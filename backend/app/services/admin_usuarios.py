"""Consultas e regras operacionais da administração de usuários."""

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.revisao_instrumento import (
    _buscar_instrumento_carteira,
    _buscar_instrumento_ted,
    _buscar_meus_instrumentos,
    _montar_resposta_busca,
)
from app.schemas.admin_usuarios import (
    InstrumentoBuscaAdmin,
    InstrumentoUsuarioAdmin,
    PendenciasUsuarioAdmin,
    ResumoAdministrativo,
    RevisaoUsuarioAdmin,
    UsuarioAdminDetalhe,
    UsuarioAdminResumo,
    UsuariosAdminResponse,
)
from app.schemas.auth import UsuarioAutenticado


async def listar_usuarios(
    db: AsyncSession,
    *,
    busca: str | None = None,
    ativo: bool | None = None,
    conta_ativada: bool | None = None,
    perfil: str | None = None,
) -> UsuariosAdminResponse:
    filtros = []
    params: dict = {}
    if busca:
        filtros.append(
            "(u.nome ILIKE :busca OR u.email ILIKE :busca "
            "OR CAST(u.codigo_tecnico AS varchar) ILIKE :busca)"
        )
        params["busca"] = f"%{busca.strip()}%"
    if ativo is not None:
        filtros.append("u.ativo = :ativo")
        params["ativo"] = ativo
    if conta_ativada is not None:
        filtros.append("u.conta_ativada = :conta_ativada")
        params["conta_ativada"] = conta_ativada
    if perfil:
        filtros.append("LOWER(u.perfil) = :perfil")
        params["perfil"] = perfil.strip().lower()
    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""
    result = await db.execute(
        text(
            f"""
            WITH instrumentos AS (
                SELECT id_usuario, COUNT(*) FILTER (WHERE ativo IS TRUE) AS ativos
                FROM painel_dsr.tb_usuario_instrumento_monitoramento GROUP BY id_usuario
            ), revisoes AS (
                SELECT id_usuario,
                       COUNT(*) FILTER (WHERE status = 'enviado') AS enviadas,
                       COUNT(*) FILTER (WHERE status = 'rascunho') AS rascunhos
                FROM painel_dsr.tb_revisao_instrumento GROUP BY id_usuario
            )
            SELECT u.id_usuario, u.codigo_tecnico, u.nome, u.email, u.setor,
                   u.perfil, u.ativo, u.conta_ativada, u.ultimo_acesso_em,
                   COALESCE(i.ativos, 0) AS instrumentos_ativos,
                   COALESCE(r.enviadas, 0) AS revisoes_enviadas,
                   COALESCE(r.rascunhos, 0) AS rascunhos
            FROM painel_dsr.tb_usuario u
            LEFT JOIN instrumentos i ON i.id_usuario = u.id_usuario
            LEFT JOIN revisoes r ON r.id_usuario = u.id_usuario
            {where}
            ORDER BY u.nome, u.id_usuario
            """
        ),
        params,
    )
    resumo_result = await db.execute(
        text(
            """
            SELECT COUNT(*) AS total_usuarios,
                   COUNT(*) FILTER (WHERE ativo IS TRUE) AS usuarios_ativos,
                   COUNT(*) FILTER (WHERE ativo IS FALSE) AS usuarios_desativados,
                   COUNT(*) FILTER (WHERE conta_ativada IS TRUE) AS contas_ativadas,
                   COUNT(*) FILTER (WHERE conta_ativada IS FALSE) AS contas_aguardando_ativacao,
                   (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento
                    WHERE status = 'enviado' AND enviado_em >= NOW() - INTERVAL '7 days') AS revisoes_recentes
            FROM painel_dsr.tb_usuario
            """
        )
    )
    return UsuariosAdminResponse(
        resumo=ResumoAdministrativo(**dict(resumo_result.mappings().one())),
        data=[UsuarioAdminResumo(**dict(row)) for row in result.mappings().all()],
    )


async def _usuario_base(db: AsyncSession, id_usuario: int) -> dict:
    result = await db.execute(
        text(
            """
            SELECT u.id_usuario, u.codigo_tecnico, u.nome, u.email, u.setor,
                   u.perfil, u.ativo, u.conta_ativada, u.criado_em, u.atualizado_em,
                   u.ultimo_acesso_em, u.codigo_acesso_expira_em, u.codigo_acesso_usado_em,
                   (SELECT COUNT(*) FROM painel_dsr.tb_usuario_instrumento_monitoramento i
                    WHERE i.id_usuario = u.id_usuario AND i.ativo IS TRUE) AS instrumentos_ativos,
                   (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento r
                    WHERE r.id_usuario = u.id_usuario AND r.status = 'enviado') AS revisoes_enviadas,
                   (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento r
                    WHERE r.id_usuario = u.id_usuario AND r.status = 'rascunho') AS rascunhos
            FROM painel_dsr.tb_usuario u WHERE u.id_usuario = :id_usuario
            """
        ),
        {"id_usuario": id_usuario},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    return dict(row)


async def _calcular_pendencias(db: AsyncSession, usuario: UsuarioAutenticado) -> PendenciasUsuarioAdmin:
    atribuicoes = await _buscar_meus_instrumentos(db, usuario)
    instrumentos = []
    total_itens = concluidos = 0
    for atribuicao in atribuicoes:
        identificador = str(atribuicao.nr_ted if atribuicao.tipo_instrumento == "ted" else atribuicao.nr_instrumento or atribuicao.nr_proposta)
        instrumento = await (_buscar_instrumento_ted(db, identificador) if atribuicao.tipo_instrumento == "ted" else _buscar_instrumento_carteira(db, identificador))
        if instrumento is None:
            continue
        resposta = await _montar_resposta_busca(db, instrumento, usuario)
        c = resposta.completude
        total = int(c.get("municipios_total", 0)) + int(c.get("localidades_total", 0)) + int(c.get("obras_total", 0)) + int(bool(resposta.publico_alvo))
        feitos = int(c.get("municipios_revisados", 0)) + int(c.get("localidades_revisadas", 0)) + int(c.get("obras_revisadas", 0)) + int(bool(c.get("publico_alvo_revisado")))
        total_itens += total
        concluidos += feitos
        instrumentos.append({
            "identificador_instrumento": instrumento.identificador_busca,
            "tipo_instrumento": instrumento.tipo_instrumento,
            "total": total,
            "concluidas": feitos,
            "abertas": int(c.get("total_pendencias", 0)),
        })
    abertas = max(total_itens - concluidos, 0)
    percentual = round(concluidos * 100 / total_itens) if total_itens else 100
    return PendenciasUsuarioAdmin(total=total_itens, concluidas=concluidos, abertas=abertas, percentual_concluido=percentual, instrumentos=instrumentos)


async def obter_usuario(db: AsyncSession, id_usuario: int) -> UsuarioAdminDetalhe:
    base = await _usuario_base(db, id_usuario)
    instrumentos_result = await db.execute(
        text("SELECT nr_instrumento, ativo FROM painel_dsr.tb_usuario_instrumento_monitoramento WHERE id_usuario = :id_usuario ORDER BY ativo DESC, nr_instrumento"),
        {"id_usuario": id_usuario},
    )
    revisoes_result = await db.execute(
        text(
            """
            SELECT id_revisao,
                   COALESCE(NULLIF(BTRIM(nr_instrumento), ''), CAST(nr_ted AS varchar), identificador_busca) AS identificador_instrumento,
                   tipo_instrumento, status, criado_em, atualizado_em, enviado_em
            FROM painel_dsr.tb_revisao_instrumento
            WHERE id_usuario = :id_usuario
            ORDER BY COALESCE(enviado_em, atualizado_em, criado_em) DESC, id_revisao DESC
            """
        ),
        {"id_usuario": id_usuario},
    )
    usuario = UsuarioAutenticado(id_usuario=id_usuario, nome=base["nome"], email=base["email"], perfil=base["perfil"])
    pendencias = PendenciasUsuarioAdmin(total=0, concluidas=0, abertas=0, percentual_concluido=100)
    if str(base["perfil"]).lower() == "tecnico":
        pendencias = await _calcular_pendencias(db, usuario)
    return UsuarioAdminDetalhe(
        **base,
        instrumentos=[InstrumentoUsuarioAdmin(**dict(row)) for row in instrumentos_result.mappings().all()],
        revisoes=[RevisaoUsuarioAdmin(**dict(row)) for row in revisoes_result.mappings().all()],
        pendencias=pendencias,
    )


async def alterar_status_usuario(db: AsyncSession, id_usuario: int, ativo: bool, id_admin: int) -> None:
    if id_usuario == id_admin and not ativo:
        raise HTTPException(status_code=400, detail="Você não pode desativar a própria conta.")
    result = await db.execute(
        text("UPDATE painel_dsr.tb_usuario SET ativo = :ativo, atualizado_em = NOW() WHERE id_usuario = :id_usuario"),
        {"id_usuario": id_usuario, "ativo": ativo},
    )
    if result.rowcount != 1:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    await db.commit()


async def buscar_instrumentos(db: AsyncSession, q: str, limite: int = 20) -> list[InstrumentoBuscaAdmin]:
    result = await db.execute(
        text(
            """
            SELECT DISTINCT ON (v.nr_instrumento::text)
                   v.nr_instrumento::text AS nr_instrumento,
                   v.nr_proposta::text AS nr_proposta, v.tipo_instrumento, v.objeto
            FROM instrumento.vw_carteira_dsr v
            WHERE v.nr_instrumento::text ILIKE :q OR v.nr_proposta::text ILIKE :q
            ORDER BY v.nr_instrumento::text, v.nr_proposta::text
            LIMIT :limite
            """
        ),
        {"q": f"%{q.strip()}%", "limite": limite},
    )
    return [InstrumentoBuscaAdmin(**dict(row)) for row in result.mappings().all()]


async def vincular_instrumento(db: AsyncSession, id_usuario: int, nr_instrumento: str) -> InstrumentoUsuarioAdmin:
    usuario = await _usuario_base(db, id_usuario)
    if str(usuario["perfil"]).lower() != "tecnico":
        raise HTTPException(status_code=400, detail="Administradores possuem acesso global e não usam vínculos.")
    existe = await db.execute(text("SELECT 1 FROM instrumento.vw_carteira_dsr WHERE NULLIF(BTRIM(nr_instrumento::text), '') = NULLIF(BTRIM(:nr), '') LIMIT 1"), {"nr": nr_instrumento})
    if existe.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Instrumento inexistente.")
    result = await db.execute(
        text(
            """
            INSERT INTO painel_dsr.tb_usuario_instrumento_monitoramento (id_usuario, nr_instrumento, ativo)
            VALUES (:id_usuario, :nr, TRUE)
            ON CONFLICT (id_usuario, nr_instrumento) DO UPDATE SET ativo = TRUE
            RETURNING nr_instrumento, ativo
            """
        ),
        {"id_usuario": id_usuario, "nr": nr_instrumento.strip()},
    )
    await db.commit()
    return InstrumentoUsuarioAdmin(**dict(result.mappings().one()))


async def alterar_vinculo(db: AsyncSession, id_usuario: int, nr_instrumento: str, ativo: bool) -> InstrumentoUsuarioAdmin:
    result = await db.execute(
        text("UPDATE painel_dsr.tb_usuario_instrumento_monitoramento SET ativo = :ativo WHERE id_usuario = :id_usuario AND nr_instrumento = :nr RETURNING nr_instrumento, ativo"),
        {"id_usuario": id_usuario, "nr": nr_instrumento, "ativo": ativo},
    )
    row = result.mappings().one_or_none()
    if row is None:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Vínculo não encontrado.")
    await db.commit()
    return InstrumentoUsuarioAdmin(**dict(row))
