"""Consultas e regras operacionais da administração de usuários."""

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.revisao_instrumento import (
    _buscar_instrumento_carteira,
    _buscar_instrumento_ted,
    _buscar_meus_instrumentos,
    _montar_resposta_busca,
)
from app.api.meu_painel import _contar_rascunhos, _listar_pendencias, _listar_rascunhos
from app.schemas.admin_usuarios import (
    AlterarSetorResponse,
    CriarUsuarioResponse,
    InstrumentoBuscaAdmin,
    InstrumentoUsuarioAdmin,
    InstrumentosUsuarioAdminResponse,
    PendenciasUsuarioAdmin,
    PendenciaInstrumentoDetalheAdmin,
    RascunhosUsuarioAdminResponse,
    ResumoAdministrativo,
    RevisaoUsuarioAdmin,
    RevisoesUsuarioAdminResponse,
    SetorAdmin,
    UsuarioAdminDetalhe,
    UsuarioAdminResumo,
    UsuariosAdminResponse,
)
from app.schemas.auth import UsuarioAutenticado
from app.services.pendencias_coordenadas import resumir_coordenadas_instrumentos
from app.services.rascunhos import descartar_rascunho


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
            SELECT u.id_usuario, u.codigo_tecnico, u.id_setor, u.nome, u.email,
                   s.nome AS setor,
                   u.perfil, u.ativo, u.conta_ativada, u.ultimo_acesso_em,
                   COALESCE(i.ativos, 0) AS instrumentos_ativos,
                   COALESCE(r.enviadas, 0) AS revisoes_enviadas,
                   COALESCE(r.rascunhos, 0) AS rascunhos
            FROM painel_dsr.tb_usuario u
            LEFT JOIN instrumento.tb_tecnico_setor s ON s.id_setor = u.id_setor
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
            SELECT u.id_usuario, u.codigo_tecnico, u.id_setor, u.nome, u.email,
                   s.nome AS setor,
                   u.perfil, u.ativo, u.conta_ativada, u.criado_em, u.atualizado_em,
                   u.ultimo_acesso_em, u.codigo_acesso_expira_em, u.codigo_acesso_usado_em,
                   (SELECT COUNT(*) FROM painel_dsr.tb_usuario_instrumento_monitoramento i
                    WHERE i.id_usuario = u.id_usuario AND i.ativo IS TRUE) AS instrumentos_ativos,
                   (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento r
                    WHERE r.id_usuario = u.id_usuario AND r.status = 'enviado') AS revisoes_enviadas,
                   (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento r
                    WHERE r.id_usuario = u.id_usuario AND r.status = 'rascunho') AS rascunhos
            FROM painel_dsr.tb_usuario u
            LEFT JOIN instrumento.tb_tecnico_setor s ON s.id_setor = u.id_setor
            WHERE u.id_usuario = :id_usuario
            """
        ),
        {"id_usuario": id_usuario},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    return dict(row)


async def _calcular_pendencias(
    db: AsyncSession,
    usuario: UsuarioAutenticado,
    *,
    busca: str | None = None,
    limit: int = 5,
    offset: int = 0,
) -> PendenciasUsuarioAdmin:
    atribuicoes = await _buscar_meus_instrumentos(db, usuario)
    termo = (busca or "").strip().casefold()
    atribuicoes_filtradas = [
        item
        for item in atribuicoes
        if not termo
        or termo
        in str(
            item.nr_ted
            if item.tipo_instrumento == "ted"
            else item.nr_instrumento or item.nr_proposta
        ).casefold()
    ]
    instrumentos_total = len(atribuicoes_filtradas)
    atribuicoes_pagina = atribuicoes_filtradas[offset : offset + limit]
    resumo_coordenadas = await resumir_coordenadas_instrumentos(
        db,
        [
            str(item.nr_ted if item.tipo_instrumento == "ted" else item.nr_instrumento or item.nr_proposta)
            for item in atribuicoes_pagina
        ],
    )
    instrumentos = []
    total_itens = concluidos = 0
    for atribuicao in atribuicoes_pagina:
        identificador = str(atribuicao.nr_ted if atribuicao.tipo_instrumento == "ted" else atribuicao.nr_instrumento or atribuicao.nr_proposta)
        instrumento = await (_buscar_instrumento_ted(db, identificador) if atribuicao.tipo_instrumento == "ted" else _buscar_instrumento_carteira(db, identificador))
        if instrumento is None:
            continue
        resposta = await _montar_resposta_busca(db, instrumento, usuario)
        c = resposta.completude
        coordenadas = resumo_coordenadas.get(identificador, {"total": 0, "pendentes": 0})
        total = int(c.get("municipios_total", 0)) + int(c.get("localidades_total", 0)) + int(c.get("obras_total", 0)) + int(bool(resposta.publico_alvo)) + coordenadas["total"]
        feitos = int(c.get("municipios_revisados", 0)) + int(c.get("localidades_revisadas", 0)) + int(c.get("obras_revisadas", 0)) + int(bool(c.get("publico_alvo_revisado"))) + coordenadas["total"] - coordenadas["pendentes"]
        total_itens += total
        concluidos += feitos
        instrumentos.append({
            "identificador_instrumento": instrumento.identificador_busca,
            "tipo_instrumento": instrumento.tipo_instrumento,
            "total": total,
            "concluidas": feitos,
            "abertas": int(c.get("total_pendencias", 0)) + coordenadas["pendentes"],
        })
    abertas = max(total_itens - concluidos, 0)
    percentual = round(concluidos * 100 / total_itens) if total_itens else 100
    return PendenciasUsuarioAdmin(
        total=total_itens,
        concluidas=concluidos,
        abertas=abertas,
        percentual_concluido=percentual,
        instrumentos=instrumentos,
        instrumentos_total=instrumentos_total,
        limit=limit,
        offset=offset,
    )


async def listar_instrumentos_usuario(
    db: AsyncSession, id_usuario: int, *, busca: str | None = None,
    limit: int = 5, offset: int = 0,
) -> InstrumentosUsuarioAdminResponse:
    params = {"id_usuario": id_usuario, "limit": limit, "offset": offset}
    filtro = ""
    if busca:
        filtro = "AND i.nr_instrumento ILIKE :busca"
        params["busca"] = f"%{busca.strip()}%"
    total = int((await db.execute(text(
        f"SELECT COUNT(*) FROM painel_dsr.tb_usuario_instrumento_monitoramento i WHERE i.id_usuario = :id_usuario {filtro}"
    ), params)).scalar_one() or 0)
    result = await db.execute(text(f"""
        SELECT i.nr_instrumento, i.ativo
        FROM painel_dsr.tb_usuario_instrumento_monitoramento i
        WHERE i.id_usuario = :id_usuario {filtro}
        ORDER BY i.ativo DESC, i.nr_instrumento
        LIMIT :limit OFFSET :offset
    """), params)
    return InstrumentosUsuarioAdminResponse(
        items=[InstrumentoUsuarioAdmin(**dict(row)) for row in result.mappings().all()],
        total=total, limit=limit, offset=offset,
    )


async def listar_revisoes_usuario(
    db: AsyncSession, id_usuario: int, *, busca: str | None = None,
    limit: int = 5, offset: int = 0,
) -> RevisoesUsuarioAdminResponse:
    params = {"id_usuario": id_usuario, "limit": limit, "offset": offset}
    filtro = ""
    if busca:
        filtro = "AND (COALESCE(r.nr_instrumento, r.nr_ted::text, r.identificador_busca) ILIKE :busca OR r.id_revisao::text ILIKE :busca)"
        params["busca"] = f"%{busca.strip()}%"
    total = int((await db.execute(text(
        f"SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento r WHERE r.id_usuario = :id_usuario AND r.status = 'enviado' {filtro}"
    ), params)).scalar_one() or 0)
    result = await db.execute(text(f"""
        SELECT r.id_revisao,
               COALESCE(NULLIF(BTRIM(r.nr_instrumento), ''), CAST(r.nr_ted AS varchar), r.identificador_busca) AS identificador_instrumento,
               r.tipo_instrumento, r.status, r.criado_em, r.atualizado_em, r.enviado_em
        FROM painel_dsr.tb_revisao_instrumento r
        WHERE r.id_usuario = :id_usuario AND r.status = 'enviado' {filtro}
        ORDER BY COALESCE(r.enviado_em, r.atualizado_em, r.criado_em) DESC, r.id_revisao DESC
        LIMIT :limit OFFSET :offset
    """), params)
    return RevisoesUsuarioAdminResponse(
        items=[RevisaoUsuarioAdmin(**dict(row)) for row in result.mappings().all()],
        total=total, limit=limit, offset=offset,
    )


async def obter_usuario(db: AsyncSession, id_usuario: int) -> UsuarioAdminDetalhe:
    base = await _usuario_base(db, id_usuario)
    instrumentos = await listar_instrumentos_usuario(db, id_usuario)
    revisoes = await listar_revisoes_usuario(db, id_usuario)
    # O detalhe inicial permanece leve; a seção busca os agregados e sua
    # primeira página pelo endpoint próprio logo após o drawer ser exibido.
    pendencias = PendenciasUsuarioAdmin(total=0, concluidas=0, abertas=0, percentual_concluido=100)
    return UsuarioAdminDetalhe(
        **base,
        instrumentos=instrumentos.items,
        instrumentos_total=instrumentos.total,
        revisoes=revisoes.items,
        revisoes_total=revisoes.total,
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


async def listar_setores_ativos(db: AsyncSession) -> list[SetorAdmin]:
    result = await db.execute(
        text(
            """SELECT id_setor, nome
               FROM instrumento.tb_tecnico_setor
               WHERE ativo IS TRUE
               ORDER BY prefixo_codigo, nome"""
        )
    )
    return [SetorAdmin(**dict(row)) for row in result.mappings().all()]


async def criar_usuario(
    db: AsyncSession,
    *,
    nome: str,
    email: str,
    perfil: str,
    id_setor: int | None,
) -> CriarUsuarioResponse:
    """Cria técnico e conta, quando aplicável, na mesma transação."""
    nome = nome.strip()
    email = email.strip().lower()
    perfil = perfil.strip().lower()
    await db.rollback()
    try:
        async with db.begin():
            duplicado = await db.execute(
                text("SELECT 1 FROM painel_dsr.tb_usuario WHERE LOWER(email) = :email LIMIT 1"),
                {"email": email},
            )
            if duplicado.scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="Já existe um usuário com este e-mail.")

            codigo_tecnico = None
            setor_validado = None
            if perfil == "tecnico":
                setor_result = await db.execute(
                    text(
                        """SELECT id_setor, prefixo_codigo
                           FROM instrumento.tb_tecnico_setor
                           WHERE id_setor = :id_setor AND ativo IS TRUE"""
                    ),
                    {"id_setor": id_setor},
                )
                setor_validado = setor_result.mappings().one_or_none()
                if setor_validado is None:
                    raise HTTPException(status_code=400, detail="Setor inexistente ou inativo.")

                prefixo = int(setor_validado["prefixo_codigo"])
                # Serializa criações do mesmo prefixo durante toda a transação.
                await db.execute(
                    text("SELECT pg_advisory_xact_lock(:chave)"),
                    {"chave": prefixo},
                )
                sufixo_result = await db.execute(
                    text(
                        """SELECT MAX(MOD(id_tecnico, 100))
                           FROM instrumento.tb_tecnico
                           WHERE id_tecnico BETWEEN :inicio AND :fim"""
                    ),
                    {"inicio": prefixo * 100 + 1, "fim": prefixo * 100 + 99},
                )
                proximo_sufixo = int(sufixo_result.scalar_one_or_none() or 0) + 1
                if proximo_sufixo > 99:
                    raise HTTPException(
                        status_code=409,
                        detail="Não há mais códigos disponíveis para este setor.",
                    )
                codigo_tecnico = prefixo * 100 + proximo_sufixo
                await db.execute(
                    text(
                        """INSERT INTO instrumento.tb_tecnico
                           (id_tecnico, id_setor, ativo_dsr, nome, email)
                           VALUES (:codigo, :id_setor, TRUE, :nome, :email)"""
                    ),
                    {
                        "codigo": codigo_tecnico,
                        "id_setor": id_setor,
                        "nome": nome,
                        "email": email,
                    },
                )

            usuario_result = await db.execute(
                text(
                    """INSERT INTO painel_dsr.tb_usuario
                       (codigo_tecnico, id_setor, nome, email, senha_hash,
                        conta_ativada, codigo_acesso_hash, codigo_acesso_expira_em,
                        codigo_acesso_usado_em, perfil, ativo)
                       VALUES (:codigo_tecnico, :id_setor, :nome, :email, NULL,
                               FALSE, NULL, NULL, NULL, :perfil, TRUE)
                       RETURNING id_usuario, codigo_tecnico, id_setor, nome, email,
                                 perfil, conta_ativada, ativo"""
                ),
                {
                    "codigo_tecnico": codigo_tecnico,
                    "id_setor": id_setor if perfil == "tecnico" else None,
                    "nome": nome,
                    "email": email,
                    "perfil": perfil,
                },
            )
            return CriarUsuarioResponse(**dict(usuario_result.mappings().one()))
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Não foi possível criar o usuário porque o e-mail ou código técnico já está em uso.",
        ) from exc


async def alterar_setor_tecnico(
    db: AsyncSession, id_usuario: int, novo_id_setor: int
) -> AlterarSetorResponse:
    await db.rollback()
    async with db.begin():
        usuario_result = await db.execute(
            text(
                """SELECT id_usuario, codigo_tecnico, id_setor, perfil
                   FROM painel_dsr.tb_usuario
                   WHERE id_usuario = :id_usuario
                   FOR UPDATE"""
            ),
            {"id_usuario": id_usuario},
        )
        usuario = usuario_result.mappings().one_or_none()
        if usuario is None:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        if str(usuario["perfil"]).lower() != "tecnico" or usuario["codigo_tecnico"] is None:
            raise HTTPException(status_code=400, detail="O usuário informado não é um técnico válido.")
        if usuario["id_setor"] == novo_id_setor:
            raise HTTPException(status_code=409, detail="O técnico já pertence a este setor.")

        tecnico_result = await db.execute(
            text(
                """SELECT id_tecnico FROM instrumento.tb_tecnico
                   WHERE id_tecnico = :codigo_tecnico FOR UPDATE"""
            ),
            {"codigo_tecnico": usuario["codigo_tecnico"]},
        )
        if tecnico_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=409, detail="Cadastro técnico correspondente não encontrado.")

        setor_result = await db.execute(
            text(
                """SELECT id_setor, nome FROM instrumento.tb_tecnico_setor
                   WHERE id_setor = :id_setor AND ativo IS TRUE"""
            ),
            {"id_setor": novo_id_setor},
        )
        setor = setor_result.mappings().one_or_none()
        if setor is None:
            raise HTTPException(status_code=400, detail="Setor inexistente ou inativo.")

        tecnico_update = await db.execute(
            text("UPDATE instrumento.tb_tecnico SET id_setor = :id_setor WHERE id_tecnico = :codigo_tecnico"),
            {"id_setor": novo_id_setor, "codigo_tecnico": usuario["codigo_tecnico"]},
        )
        usuario_update = await db.execute(
            text(
                """UPDATE painel_dsr.tb_usuario
                   SET id_setor = :id_setor, atualizado_em = NOW()
                   WHERE id_usuario = :id_usuario"""
            ),
            {"id_setor": novo_id_setor, "id_usuario": id_usuario},
        )
        if tecnico_update.rowcount != 1 or usuario_update.rowcount != 1:
            raise HTTPException(status_code=409, detail="Não foi possível sincronizar o novo setor.")
        return AlterarSetorResponse(
            id_usuario=id_usuario,
            codigo_tecnico=usuario["codigo_tecnico"],
            id_setor=novo_id_setor,
            setor=setor["nome"],
        )


async def listar_rascunhos_usuario(
    db: AsyncSession, id_usuario: int, *, limit: int = 5, offset: int = 0
) -> RascunhosUsuarioAdminResponse:
    await _usuario_base(db, id_usuario)
    items = await _listar_rascunhos(db, id_usuario, limite=limit, offset=offset)
    total = await _contar_rascunhos(db, id_usuario)
    return RascunhosUsuarioAdminResponse(items=items, total=total, limit=limit, offset=offset)


async def cancelar_rascunho_usuario(
    db: AsyncSession, id_usuario: int, id_revisao: int
) -> dict:
    base = await _usuario_base(db, id_usuario)
    if str(base["perfil"]).lower() != "tecnico":
        raise HTTPException(status_code=400, detail="O usuário informado não é técnico.")
    await db.rollback()
    async with db.begin():
        return await descartar_rascunho(db, id_revisao, id_usuario_esperado=id_usuario)


async def detalhar_pendencias_instrumento(
    db: AsyncSession, id_usuario: int, identificador: str
) -> PendenciaInstrumentoDetalheAdmin:
    base = await _usuario_base(db, id_usuario)
    if str(base["perfil"]).lower() != "tecnico":
        raise HTTPException(status_code=400, detail="O usuário informado não é técnico.")
    usuario = UsuarioAutenticado(
        id_usuario=id_usuario, nome=base["nome"], email=base["email"], perfil=base["perfil"]
    )
    itens = await _listar_pendencias(db, usuario, identificador=identificador)
    item = next(
        (x for x in itens if str(x.identificador_instrumento) == str(identificador)),
        None,
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Pendências não encontradas para este instrumento.")
    return PendenciaInstrumentoDetalheAdmin(**item.model_dump())
