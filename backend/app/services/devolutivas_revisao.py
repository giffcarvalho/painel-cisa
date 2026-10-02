"""Fluxo transacional de devolução e reenvio de revisões imutáveis."""

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import UsuarioAutenticado
from app.services.notificacoes import criar_notificacao


async def _clonar_filhos(db: AsyncSession, origem: int, destino: int) -> None:
    comandos = (
        """INSERT INTO painel_dsr.tb_revisao_instrumento_municipio
           (id_revisao, cod_municipio, origem_registro, acao_sugerida, justificativa,
            conferido_em, valido_ate, atualizado_em)
           SELECT :destino, cod_municipio, origem_registro, acao_sugerida, justificativa,
                  conferido_em, valido_ate, NOW()
           FROM painel_dsr.tb_revisao_instrumento_municipio WHERE id_revisao = :origem""",
        """INSERT INTO painel_dsr.tb_revisao_instrumento_localidade
           (id_revisao, cod_municipio, cod_comunidade_rural, nome_localidade_informada,
            origem_registro, acao_sugerida, qtde_familias_ben_original,
            qtde_familias_ben_sugerida, justificativa, conferido_em, valido_ate, atualizado_em)
           SELECT :destino, cod_municipio, cod_comunidade_rural, nome_localidade_informada,
                  origem_registro, acao_sugerida, qtde_familias_ben_original,
                  qtde_familias_ben_sugerida, justificativa, conferido_em, valido_ate, NOW()
           FROM painel_dsr.tb_revisao_instrumento_localidade WHERE id_revisao = :origem""",
        """INSERT INTO painel_dsr.tb_revisao_instrumento_publico_alvo
           (id_revisao, id_projeto_investimento, status_populacao_beneficiada,
            status_desc_populacao_beneficiada, observacao_publico_alvo,
            status_correcao_solicitada, conferido_em, valido_ate, atualizado_em)
           SELECT :destino, id_projeto_investimento, status_populacao_beneficiada,
                  status_desc_populacao_beneficiada, observacao_publico_alvo,
                  status_correcao_solicitada, conferido_em, valido_ate, NOW()
           FROM painel_dsr.tb_revisao_instrumento_publico_alvo WHERE id_revisao = :origem""",
        """INSERT INTO painel_dsr.tb_revisao_obra_saneamento
           (id_revisao, cod_municipio, id_obra, descricao, orgao, link_transferegov,
            link_obrasgov, relacao_instrumento, confirmacao_status, justificativa,
            conferido_em, valido_ate, atualizado_em)
           SELECT :destino, cod_municipio, id_obra, descricao, orgao, link_transferegov,
                  link_obrasgov, relacao_instrumento, confirmacao_status, justificativa,
                  conferido_em, valido_ate, NOW()
           FROM painel_dsr.tb_revisao_obra_saneamento WHERE id_revisao = :origem""",
        """INSERT INTO painel_dsr.tb_revisao_instrumento_coordenada
           (id_revisao, id_coordenada, cod_tci, situacao_analise,
            situacao_correcao, observacao_coordenada)
           SELECT :destino, id_coordenada, cod_tci, situacao_analise,
                  situacao_correcao, observacao_coordenada
           FROM painel_dsr.tb_revisao_instrumento_coordenada WHERE id_revisao = :origem""",
    )
    for comando in comandos:
        await db.execute(text(comando), {"origem": origem, "destino": destino})


async def devolver_revisao(
    db: AsyncSession, id_revisao: int, usuario: UsuarioAutenticado, comentario: str
) -> dict[str, Any]:
    comentario = comentario.strip()
    if not comentario:
        raise HTTPException(status_code=422, detail="O comentário para o monitor é obrigatório.")
    await db.rollback()
    try:
        async with db.begin():
            result = await db.execute(text("""
                SELECT r.* FROM painel_dsr.tb_revisao_instrumento r
                WHERE r.id_revisao = :id_revisao FOR UPDATE
            """), {"id_revisao": id_revisao})
            revisao = result.mappings().one_or_none()
            if revisao is None:
                raise HTTPException(status_code=404, detail="Revisão não encontrada.")
            if revisao["status"] != "enviado" or revisao["enviado_em"] is None:
                raise HTTPException(status_code=409, detail="Somente uma revisão enviada pode ser devolvida.")
            if revisao["aplicado_em"] is not None:
                raise HTTPException(status_code=409, detail="Uma revisão já aplicada não pode ser devolvida.")
            sucesso = await db.execute(text("""
                SELECT 1 FROM painel_dsr.tb_execucao_aplicacao_revisao
                WHERE id_revisao = :id_revisao AND status = 'sucesso' LIMIT 1
            """), {"id_revisao": id_revisao})
            if sucesso.scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="A revisão já possui aplicação concluída.")

            chave = f"{revisao['tipo_instrumento']}:{revisao['nr_ted'] if revisao['tipo_instrumento'] == 'ted' else revisao['nr_instrumento']}"
            await db.execute(text("SELECT pg_advisory_xact_lock(hashtextextended(:chave, 0))"), {"chave": chave})
            existente = await db.execute(text("""
                SELECT 1 FROM painel_dsr.tb_devolutiva_revisao
                WHERE id_revisao_devolvida = :id_revisao LIMIT 1
            """), {"id_revisao": id_revisao})
            if existente.scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="Esta versão já foi devolvida.")
            rascunho = await db.execute(text("""
                SELECT id_revisao FROM painel_dsr.tb_revisao_instrumento
                WHERE status = 'rascunho' AND tipo_instrumento = :tipo
                  AND ((:tipo = 'ted' AND nr_ted = :nr_ted)
                    OR (:tipo <> 'ted' AND NULLIF(BTRIM(nr_instrumento), '') = NULLIF(BTRIM(:nr_instrumento), '')))
                LIMIT 1 FOR UPDATE
            """), {"tipo": revisao["tipo_instrumento"], "nr_ted": revisao["nr_ted"], "nr_instrumento": revisao["nr_instrumento"]})
            if rascunho.scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="Já existe um rascunho em andamento para este instrumento.")

            novo = await db.execute(text("""
                INSERT INTO painel_dsr.tb_revisao_instrumento
                    (identificador_busca, tipo_instrumento, nr_instrumento, nr_proposta,
                     nr_ted, id_usuario, status, observacao_geral, id_revisao_anterior,
                     base_referencia_em, validade_dias)
                SELECT identificador_busca, tipo_instrumento, nr_instrumento, nr_proposta,
                       nr_ted, id_usuario, 'rascunho', observacao_geral, id_revisao,
                       base_referencia_em, validade_dias
                FROM painel_dsr.tb_revisao_instrumento WHERE id_revisao = :id_revisao
                RETURNING id_revisao
            """), {"id_revisao": id_revisao})
            id_rascunho = novo.scalar_one()
            await _clonar_filhos(db, id_revisao, id_rascunho)
            devolutiva = await db.execute(text("""
                INSERT INTO painel_dsr.tb_devolutiva_revisao
                    (id_revisao_devolvida, id_usuario_admin, comentario_admin)
                VALUES (:id_revisao, :id_admin, :comentario)
                RETURNING id_devolutiva, devolvido_em, status
            """), {"id_revisao": id_revisao, "id_admin": usuario.id_usuario, "comentario": comentario})
            dados = dict(devolutiva.mappings().one())
            await criar_notificacao(db, id_usuario=revisao["id_usuario"], tipo="revisao_devolvida",
                                    chave_evento=f"revisao_devolvida:{dados['id_devolutiva']}", id_revisao=id_rascunho)
        return {**dados, "id_revisao_devolvida": id_revisao, "id_rascunho": id_rascunho,
                "comentario_admin": comentario}
    except HTTPException:
        await db.rollback()
        raise
    except (IntegrityError, SQLAlchemyError) as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Não foi possível devolver a revisão; o estado foi alterado por outra operação.") from exc


async def buscar_devolutiva_do_rascunho(db: AsyncSession, id_revisao: int) -> dict[str, Any] | None:
    result = await db.execute(text("""
        SELECT d.id_devolutiva, d.id_revisao_devolvida, d.comentario_admin,
               d.devolvido_em, d.status, u.nome AS administrador
        FROM painel_dsr.tb_revisao_instrumento r
        JOIN painel_dsr.tb_devolutiva_revisao d
          ON d.id_revisao_devolvida = r.id_revisao_anterior
         AND d.status = 'aguardando_correcao'
        JOIN painel_dsr.tb_usuario u ON u.id_usuario = d.id_usuario_admin
        WHERE r.id_revisao = :id_revisao AND r.status = 'rascunho'
    """), {"id_revisao": id_revisao})
    row = result.mappings().one_or_none()
    return dict(row) if row else None


async def concluir_reenvio(db: AsyncSession, id_revisao: int, id_usuario: int, comentario: str | None) -> bool:
    devolutiva = await buscar_devolutiva_do_rascunho(db, id_revisao)
    if devolutiva is None:
        return False
    resposta = (comentario or "").strip()
    if not resposta:
        raise HTTPException(status_code=422, detail="O comentário sobre as correções realizadas é obrigatório.")
    result = await db.execute(text("""
        UPDATE painel_dsr.tb_devolutiva_revisao
        SET status = 'reenviada', id_revisao_reenvio = :id_revisao,
            id_usuario_monitor_resposta = :id_usuario, comentario_monitor = :comentario,
            reenviado_em = NOW()
        WHERE id_devolutiva = :id_devolutiva AND status = 'aguardando_correcao'
        RETURNING id_usuario_admin
    """), {"id_revisao": id_revisao, "id_usuario": id_usuario, "comentario": resposta,
             "id_devolutiva": devolutiva["id_devolutiva"]})
    id_admin = result.scalar_one_or_none()
    if id_admin is None:
        raise HTTPException(status_code=409, detail="Esta devolutiva já foi respondida.")
    await criar_notificacao(db, id_usuario=id_admin, tipo="revisao_devolvida_reenviada",
                            chave_evento=f"revisao_devolvida_reenviada:{devolutiva['id_devolutiva']}",
                            id_revisao=id_revisao)
    return True


async def obter_tramitacao(db: AsyncSession, id_revisao: int) -> dict[str, Any] | None:
    result = await db.execute(text("""
        SELECT d.*, admin.nome AS administrador, monitor.nome AS monitor_resposta
        FROM painel_dsr.tb_devolutiva_revisao d
        JOIN painel_dsr.tb_usuario admin ON admin.id_usuario = d.id_usuario_admin
        LEFT JOIN painel_dsr.tb_usuario monitor ON monitor.id_usuario = d.id_usuario_monitor_resposta
        WHERE d.id_revisao_reenvio = :id_revisao OR d.id_revisao_devolvida = :id_revisao
        ORDER BY d.devolvido_em DESC LIMIT 1
    """), {"id_revisao": id_revisao})
    row = result.mappings().one_or_none()
    return dict(row) if row else None
