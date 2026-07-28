"""Endpoints da revisão de instrumentos DSR."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import BigInteger, bindparam, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import obter_usuario_atual
from app.core.database import get_db
from app.schemas.auth import UsuarioAutenticado
from app.schemas.revisao_instrumento import (
    InstrumentoRevisaoInfo,
    LocalidadeRevisaoAlteracao,
    LocalidadeRevisaoItem,
    MunicipioRevisaoAlteracao,
    MunicipioRevisaoItem,
    ObraSaneamentoRevisaoAlteracao,
    ObraSaneamentoRevisaoItem,
    PublicoAlvoRevisaoAlteracao,
    PublicoAlvoRevisaoItem,
    RevisaoInstrumentoBuscaResponse,
    RevisaoInstrumentoCreate,
    RevisaoInstrumentoMunicipioSave,
    RevisaoInstrumentoMunicipioSalvoResponse,
    RevisaoInstrumentoSalvoResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


TABELAS_MUNICIPIO = {
    "contrato_repasse": "instrumento.tb_contrato_repasse_municipio",
    "termo_compromisso": "instrumento.tb_termo_de_compromisso_municipio",
}

TABELAS_LOCALIDADE = {
    "contrato_repasse": "instrumento.tb_contrato_repasse_comunidade_rural",
    "termo_compromisso": "instrumento.tb_termo_de_compromisso_comunidade_rural",
}

STATUS_REVISAO_LABELS = {
    "pendente": "Revisão pendente",
    "em_revisao": "Em revisão",
    "parcial": "Revisão parcial",
    "concluida": "Revisão concluída",
}


async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None):
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as exc:
        logger.exception("Erro no banco de dados da revisão de instrumento: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao consultar dados da revisão de instrumento.",
        )


def _localidade_text(sql: str):
    return text(sql).bindparams(
        bindparam("cod_comunidade_rural", type_=BigInteger)
    )


def _normalizar_tipo(tipo_view: str | None, tipo_por_tabela: str | None) -> str | None:
    if tipo_por_tabela:
        return tipo_por_tabela

    texto = (tipo_view or "").lower()

    if "ted" in texto or ("execu" in texto and "descentralizada" in texto):
        return "ted"

    if "contrato" in texto or "repasse" in texto:
        return "contrato_repasse"

    if "termo" in texto or "compromisso" in texto:
        return "termo_compromisso"

    return None


def _primeiro_valor(dados: dict, chaves: list[str]) -> str | None:
    for chave in chaves:
        valor = dados.get(chave)
        if valor is not None and str(valor).strip():
            return str(valor).strip()
    return None


def _normalizar_nr_ted(value) -> int | None:
    texto = str(value or "").strip()
    if not texto:
        return None

    digitos = "".join(char for char in texto if char.isdigit())
    if not digitos:
        return None

    return int(digitos)


def calcular_status_revisao(
    municipio_conferido: bool,
    localidades_conferidas: bool,
    obras_conferidas: bool,
) -> str:
    total_conferido = sum(
        [municipio_conferido, localidades_conferidas, obras_conferidas]
    )

    if total_conferido == 0:
        return "pendente"

    if total_conferido == 3:
        return "concluida"

    return "parcial"


def _label_status_revisao(status_revisao: str) -> str:
    return STATUS_REVISAO_LABELS.get(status_revisao, STATUS_REVISAO_LABELS["pendente"])


def _item_tem_conferencia(acao: str | None) -> bool:
    return bool(acao and acao != "nao_analisada")


def _grupo_municipio_conferido(municipios: list[MunicipioRevisaoItem]) -> bool:
    if not municipios:
        return False

    return all(
        _item_tem_conferencia(municipio.acao_sugerida)
        for municipio in municipios
    )


def _grupo_localidades_conferido(
    municipios: list[MunicipioRevisaoItem],
) -> bool | None:
    localidades = [
        localidade
        for municipio in municipios
        for localidade in municipio.localidades
        if localidade.origem_registro != "adicionado_tecnico"
    ]

    if not localidades:
        return None

    return all(
        _item_tem_conferencia(localidade.acao_sugerida)
        for localidade in localidades
    )


def _grupo_obras_conferido(municipios: list[MunicipioRevisaoItem]) -> bool | None:
    obras = [
        obra
        for municipio in municipios
        for obra in municipio.obras_saneamento
    ]

    if not obras:
        return None

    return all(
        _item_tem_conferencia(obra.relacao_instrumento)
        for obra in obras
    )


def _calcular_status_revisao_municipios(
    municipios: list[MunicipioRevisaoItem],
) -> tuple[str, str]:
    municipio_conferido = _grupo_municipio_conferido(municipios)
    localidades_conferidas = _grupo_localidades_conferido(municipios)
    obras_conferidas = _grupo_obras_conferido(municipios)

    if not any(
        valor is True
        for valor in [municipio_conferido, localidades_conferidas, obras_conferidas]
    ):
        status_revisao = "pendente"
    else:
        status_revisao = calcular_status_revisao(
            municipio_conferido,
            True if localidades_conferidas is None else localidades_conferidas,
            True if obras_conferidas is None else obras_conferidas,
        )

    return status_revisao, _label_status_revisao(status_revisao)


async def _buscar_instrumento_carteira(
    db: AsyncSession,
    identificador: str,
) -> InstrumentoRevisaoInfo | None:
    result = await _execute_query(
        db,
        """
        SELECT DISTINCT
            v.nr_proposta::text AS nr_proposta,
            v.nr_instrumento::text AS nr_instrumento,
            t.nr_ted,
            v.tipo_instrumento,
            v.operacao::text AS tipo_obra,
            v.objeto,
            v.nome_proponente,
            v.uf,
            v.situacao_atual,
            v.link_transferegov,
            to_jsonb(v)->>'link_saci' AS link_saci,
            to_jsonb(t) AS dados_ted,
            CASE
                WHEN t.nr_ted IS NOT NULL THEN 'ted'
                WHEN EXISTS (
                    SELECT 1
                    FROM instrumento.tb_contrato_repasse cr
                    WHERE cr.nr_proposta = v.nr_proposta
                    LIMIT 1
                ) THEN 'contrato_repasse'
                WHEN EXISTS (
                    SELECT 1
                    FROM instrumento.tb_termo_de_compromisso tc
                    WHERE tc.nr_proposta = v.nr_proposta
                    LIMIT 1
                ) THEN 'termo_compromisso'
                ELSE NULL
            END AS tipo_por_tabela,
            CASE
                WHEN v.nr_instrumento::text = :identificador THEN 1
                WHEN v.nr_proposta::text = :identificador THEN 2
                ELSE 3
            END AS ordem_busca
        FROM instrumento.vw_carteira_dsr v
        LEFT JOIN instrumento.tb_ted t
          ON t.nr_ted::text = NULLIF(
              LTRIM(regexp_replace(v.nr_instrumento::text, '\D', '', 'g'), '0'),
              ''
          )
        WHERE v.nr_proposta::text = :identificador
           OR v.nr_instrumento::text = :identificador
        ORDER BY ordem_busca
        LIMIT 2
        """,
        {"identificador": identificador},
    )

    rows = result.mappings().all()

    if not rows:
        return None

    if len(rows) > 1:
        raise HTTPException(
            status_code=409,
            detail="Mais de um instrumento foi encontrado para o identificador informado.",
        )

    row = dict(rows[0])
    tipo = _normalizar_tipo(row.get("tipo_instrumento"), row.get("tipo_por_tabela"))

    if tipo is None:
        return None

    dados_ted = dict(row.get("dados_ted") or {})
    nr_ted = row.get("nr_ted")
    if tipo == "ted" and nr_ted is None:
        nr_ted = _normalizar_nr_ted(row.get("nr_instrumento") or identificador)

    return InstrumentoRevisaoInfo(
        identificador_busca=identificador,
        tipo_instrumento=tipo,
        nr_instrumento=None if tipo == "ted" else row.get("nr_instrumento"),
        nr_proposta=None if tipo == "ted" else row.get("nr_proposta"),
        nr_ted=nr_ted if tipo == "ted" else None,
        tipo_obra=row.get("tipo_obra")
        or _primeiro_valor(dados_ted, ["tipo_obra", "modalidade", "operacao"]),
        objeto=row.get("objeto")
        or _primeiro_valor(dados_ted, ["objeto", "descricao", "objeto_ted"]),
        nome_proponente=row.get("nome_proponente")
        or _primeiro_valor(dados_ted, ["nome_proponente", "nome_tomador", "tomador"]),
        orgao=row.get("nome_proponente")
        or _primeiro_valor(dados_ted, ["orgao", "nome_orgao", "nome_repassador"]),
        uf=row.get("uf") or _primeiro_valor(dados_ted, ["uf", "sigla_uf"]),
        situacao_atual=row.get("situacao_atual")
        or _primeiro_valor(dados_ted, ["situacao_atual", "situacao"]),
        link_transferegov=row.get("link_transferegov")
        or _primeiro_valor(dados_ted, ["link_transferegov"]),
        link_saci=row.get("link_saci") or _primeiro_valor(dados_ted, ["link_saci", "saci"]),
        dados_oficiais={
            "fonte": "instrumento.vw_carteira_dsr",
            "tipo_instrumento_original": row.get("tipo_instrumento"),
            "nr_proposta_carteira": row.get("nr_proposta") if tipo == "ted" else None,
            "nr_instrumento_carteira": row.get("nr_instrumento") if tipo == "ted" else None,
            "dados_ted": dados_ted or None,
        },
    )


async def _buscar_instrumento_ted(
    db: AsyncSession,
    identificador: str,
) -> InstrumentoRevisaoInfo | None:
    result = await _execute_query(
        db,
        """
        SELECT
            t.nr_ted,
            to_jsonb(t) AS dados_ted
        FROM instrumento.tb_ted t
        WHERE t.nr_ted::text = :identificador
           OR t.nr_ted::text = NULLIF(
              LTRIM(regexp_replace(:identificador, '\D', '', 'g'), '0'),
              ''
           )
        LIMIT 1
        """,
        {"identificador": identificador},
    )

    row = result.mappings().one_or_none()

    if row is None:
        return None

    dados = dict(row["dados_ted"] or {})

    return InstrumentoRevisaoInfo(
        identificador_busca=identificador,
        tipo_instrumento="ted",
        nr_instrumento=None,
        nr_proposta=None,
        nr_ted=row["nr_ted"],
        tipo_obra=_primeiro_valor(dados, ["tipo_obra", "modalidade", "operacao"]),
        objeto=_primeiro_valor(dados, ["objeto", "descricao", "objeto_ted"]),
        nome_proponente=_primeiro_valor(dados, ["nome_proponente", "nome_tomador", "tomador"]),
        orgao=_primeiro_valor(dados, ["orgao", "nome_orgao", "nome_repassador"]),
        uf=_primeiro_valor(dados, ["uf", "sigla_uf"]),
        situacao_atual=_primeiro_valor(dados, ["situacao_atual", "situacao"]),
        link_transferegov=_primeiro_valor(dados, ["link_transferegov"]),
        link_saci=_primeiro_valor(dados, ["link_saci", "saci"]),
        dados_oficiais={
            "fonte": "instrumento.tb_ted",
            "dados_ted": dados,
        },
    )


async def _buscar_municipios(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
) -> list[MunicipioRevisaoItem]:
    if instrumento.tipo_instrumento == "ted":
        if instrumento.nr_ted is None:
            return []

        result = await _execute_query(
            db,
            """
            SELECT
                tm.cod_municipio,
                bm.nome,
                bm.sigla_uf::text AS uf
            FROM instrumento.tb_ted_municipio tm
            LEFT JOIN territorio.vw_base_municipal bm
              ON bm.cod_municipio = tm.cod_municipio
            WHERE tm.nr_ted = :nr_ted
            ORDER BY bm.nome NULLS LAST, tm.cod_municipio
            """,
            {"nr_ted": instrumento.nr_ted},
        )
    else:
        tabela = TABELAS_MUNICIPIO[instrumento.tipo_instrumento]

        result = await _execute_query(
            db,
            f"""
            SELECT
                rel.cod_municipio,
                bm.nome,
                bm.sigla_uf::text AS uf
            FROM {tabela} rel
            LEFT JOIN territorio.vw_base_municipal bm
              ON bm.cod_municipio = rel.cod_municipio
            WHERE rel.nr_proposta = :nr_proposta
            ORDER BY bm.nome NULLS LAST, rel.cod_municipio
            """,
            {"nr_proposta": instrumento.nr_proposta},
        )

    return [
        MunicipioRevisaoItem(
            cod_municipio=row["cod_municipio"],
            nome=row["nome"],
            uf=row["uf"],
            origem_registro="base_atual",
            acao_sugerida=None,
            localidades=[],
            obras_saneamento=[],
        )
        for row in result.mappings().all()
    ]


async def _buscar_localidades(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
) -> list[LocalidadeRevisaoItem]:
    if instrumento.tipo_instrumento not in TABELAS_LOCALIDADE:
        return []

    if not instrumento.nr_proposta:
        return []

    tabela = TABELAS_LOCALIDADE[instrumento.tipo_instrumento]

    result = await _execute_query(
        db,
        f"""
        SELECT
            cr.cod_municipio,
            rel.cod_comunidade_rural,
            COALESCE(
                to_jsonb(cr)->>'nome_comunidade_rural',
                to_jsonb(cr)->>'nome_localidade',
                to_jsonb(cr)->>'nome',
                to_jsonb(cr)->>'dsc_comunidade_rural'
            ) AS nome_localidade,
            rel.qtde_familias_ben
        FROM {tabela} rel
        JOIN territorio.tb_comunidade_rural cr
          ON cr.cod_comunidade_rural = rel.cod_comunidade_rural
        WHERE rel.nr_proposta = :nr_proposta
        ORDER BY cr.cod_municipio, nome_localidade NULLS LAST, rel.cod_comunidade_rural
        """,
        {"nr_proposta": instrumento.nr_proposta},
    )

    return [
        LocalidadeRevisaoItem(
            cod_municipio=row["cod_municipio"],
            cod_comunidade_rural=row["cod_comunidade_rural"],
            nome_localidade=row["nome_localidade"],
            origem_registro="base_atual",
            acao_sugerida=None,
            qtde_familias_ben_original=row["qtde_familias_ben"],
            qtde_familias_ben_sugerida=None,
        )
        for row in result.mappings().all()
    ]


async def _buscar_obras_saneamento(
    db: AsyncSession,
    cod_municipios: list[int],
) -> list[ObraSaneamentoRevisaoItem]:
    if not cod_municipios:
        return []

    stmt = text(
        """
        SELECT
            obras.id::text AS id_obra,
            obras.cod_municipio,
            obras.descricao,
            obras.orgao,
            obras.link_transferegov,
            obras.link_obrasgov
        FROM instrumento.vw_investimento_saneamento obras
        WHERE obras.cod_municipio IN :cod_municipios
        ORDER BY obras.cod_municipio, obras.orgao NULLS LAST, obras.id
        """
    ).bindparams(bindparam("cod_municipios", expanding=True))

    try:
        result = await db.execute(stmt, {"cod_municipios": cod_municipios})
    except SQLAlchemyError as exc:
        logger.exception("Erro ao consultar obras de saneamento: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao consultar obras de saneamento.",
        )

    return [
        ObraSaneamentoRevisaoItem(
            id_obra=row["id_obra"],
            cod_municipio=row["cod_municipio"],
            descricao=row["descricao"],
            orgao=row["orgao"],
            link_transferegov=row["link_transferegov"],
            link_obrasgov=row["link_obrasgov"],
            relacao_instrumento="nao_analisada",
            confirmacao_status="nao_confirmada",
        )
        for row in result.mappings().all()
    ]


async def _buscar_publico_alvo(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
    id_revisao: int | None,
) -> list[PublicoAlvoRevisaoItem]:
    params = {
        "tipo_instrumento": instrumento.tipo_instrumento,
        "nr_proposta": instrumento.nr_proposta,
        "nr_instrumento": instrumento.nr_instrumento,
        "nr_ted": instrumento.nr_ted,
        "id_revisao": id_revisao,
    }

    result = await _execute_query(
        db,
        """
        WITH instrumentos_dsr AS (
            SELECT
                'contrato_repasse'::varchar AS tipo_instrumento,
                cv.nr_convenio::text AS nr_instrumento,
                cr.id_proposta,
                cr.nr_proposta,
                NULL::int AS nr_ted
            FROM instrumento.tb_contrato_repasse cr
            INNER JOIN transferegov.tb_convenio cv
                    ON cv.id_proposta = cr.id_proposta
            WHERE CAST(:tipo_instrumento AS varchar) = 'contrato_repasse'
              AND (
                    (
                        CAST(:nr_proposta AS varchar) IS NOT NULL
                        AND cr.nr_proposta::text = CAST(:nr_proposta AS varchar)
                    )
                 OR (
                        CAST(:nr_instrumento AS varchar) IS NOT NULL
                        AND cv.nr_convenio::text = CAST(:nr_instrumento AS varchar)
                    )
              )

            UNION ALL

            SELECT
                'termo_compromisso'::varchar AS tipo_instrumento,
                cv.nr_convenio::text AS nr_instrumento,
                tc.id_proposta,
                tc.nr_proposta,
                NULL::int AS nr_ted
            FROM instrumento.tb_termo_de_compromisso tc
            INNER JOIN transferegov.tb_convenio cv
                    ON cv.id_proposta = tc.id_proposta
            WHERE CAST(:tipo_instrumento AS varchar) = 'termo_compromisso'
              AND (
                    (
                        CAST(:nr_proposta AS varchar) IS NOT NULL
                        AND tc.nr_proposta::text = CAST(:nr_proposta AS varchar)
                    )
                 OR (
                        CAST(:nr_instrumento AS varchar) IS NOT NULL
                        AND cv.nr_convenio::text = CAST(:nr_instrumento AS varchar)
                    )
              )

            UNION ALL

            SELECT
                'ted'::varchar AS tipo_instrumento,
                ted.nr_ted::text AS nr_instrumento,
                NULL::int AS id_proposta,
                NULL::varchar AS nr_proposta,
                ted.nr_ted
            FROM instrumento.tb_ted ted
            WHERE CAST(:tipo_instrumento AS varchar) = 'ted'
              AND ted.nr_ted = CAST(:nr_ted AS integer)
        ),
        projetos AS (
            SELECT DISTINCT ON (pi.id_unico)
                i.tipo_instrumento,
                i.nr_instrumento,
                pi.id_unico::text AS id_projeto_investimento,
                COALESCE(
                    NULLIF(BTRIM(to_jsonb(pi)->>'descricao'), ''),
                    NULLIF(BTRIM(to_jsonb(pi)->>'nome_obra'), ''),
                    NULLIF(BTRIM(to_jsonb(pi)->>'nome_projeto'), ''),
                    NULLIF(BTRIM(to_jsonb(pi)->>'objeto'), '')
                ) AS nome_obra,
                NULLIF(BTRIM(pi.populacao_beneficiada), '') AS populacao_beneficiada_original,
                NULLIF(BTRIM(pi.desc_populacao_beneficiada), '') AS desc_populacao_beneficiada_original
            FROM instrumentos_dsr i
            INNER JOIN transferegov.tb_dados_obrasgov_geral dog
                    ON dog.nr_instrumento::text = i.nr_instrumento
            INNER JOIN obrasgov.tb_projeto_investimento pi
                    ON pi.id_unico::text = dog.id_projeto_investimento::text
            ORDER BY pi.id_unico, i.tipo_instrumento, i.nr_instrumento
        )
        SELECT
            rpa.id_revisao_publico_alvo,
            p.id_projeto_investimento,
            p.tipo_instrumento,
            p.nr_instrumento,
            p.nome_obra,
            COALESCE(
                rpa.populacao_beneficiada_original,
                p.populacao_beneficiada_original
            ) AS populacao_beneficiada_original,
            COALESCE(
                rpa.desc_populacao_beneficiada_original,
                p.desc_populacao_beneficiada_original
            ) AS desc_populacao_beneficiada_original,
            rpa.populacao_beneficiada_revisada,
            rpa.desc_populacao_beneficiada_revisada,
            rpa.conferido_em
        FROM projetos p
        LEFT JOIN painel_dsr.tb_revisao_instrumento_publico_alvo rpa
               ON CAST(:id_revisao AS integer) IS NOT NULL
              AND rpa.id_revisao = CAST(:id_revisao AS integer)
              AND rpa.id_projeto_investimento = p.id_projeto_investimento
        ORDER BY p.nome_obra NULLS LAST, p.id_projeto_investimento
        """,
        params,
    )

    return [
        PublicoAlvoRevisaoItem(
            id_revisao_publico_alvo=row["id_revisao_publico_alvo"],
            id_projeto_investimento=row["id_projeto_investimento"],
            tipo_instrumento=row["tipo_instrumento"],
            nr_instrumento=row["nr_instrumento"],
            nome_obra=row["nome_obra"],
            populacao_beneficiada_original=row["populacao_beneficiada_original"],
            desc_populacao_beneficiada_original=row[
                "desc_populacao_beneficiada_original"
            ],
            populacao_beneficiada_revisada=row["populacao_beneficiada_revisada"],
            desc_populacao_beneficiada_revisada=row[
                "desc_populacao_beneficiada_revisada"
            ],
            conferido_em=row["conferido_em"],
        )
        for row in result.mappings().all()
    ]


async def _buscar_revisao_existente(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
    id_usuario: int,
) -> dict | None:
    result = await _execute_query(
        db,
        """
        SELECT
            id_revisao,
            status,
            observacao_geral,
            criado_em,
            atualizado_em,
            enviado_em
        FROM painel_dsr.tb_revisao_instrumento
        WHERE id_usuario = :id_usuario
          AND identificador_busca = :identificador_busca
          AND tipo_instrumento = :tipo_instrumento
          AND COALESCE(nr_instrumento::text, '') = COALESCE(CAST(:nr_instrumento AS text), '')
          AND COALESCE(nr_proposta::text, '') = COALESCE(CAST(:nr_proposta AS text), '')
          AND COALESCE(nr_ted::text, '') = COALESCE(CAST(:nr_ted AS text), '')
        ORDER BY atualizado_em DESC NULLS LAST, criado_em DESC
        LIMIT 1
        """,
        {
            "id_usuario": id_usuario,
            "identificador_busca": instrumento.identificador_busca,
            "tipo_instrumento": instrumento.tipo_instrumento,
            "nr_instrumento": instrumento.nr_instrumento,
            "nr_proposta": instrumento.nr_proposta,
            "nr_ted": str(instrumento.nr_ted) if instrumento.nr_ted is not None else None,
        },
    )
    row = result.mappings().one_or_none()
    return dict(row) if row else None


async def _obter_revisao_por_id(
    db: AsyncSession,
    id_revisao: int,
    id_usuario: int,
) -> dict:
    result = await _execute_query(
        db,
        """
        SELECT
            id_revisao,
            status,
            observacao_geral,
            criado_em,
            atualizado_em,
            enviado_em
        FROM painel_dsr.tb_revisao_instrumento
        WHERE id_revisao = :id_revisao
          AND id_usuario = :id_usuario
        """,
        {"id_revisao": id_revisao, "id_usuario": id_usuario},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Revisão não encontrada para o usuário autenticado.",
        )

    return dict(row)


async def _obter_ou_criar_revisao(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
    id_usuario: int,
    *,
    id_revisao: int | None = None,
    status_revisao: str | None = "rascunho",
    observacao_geral: str | None = None,
) -> dict:
    if id_revisao is not None:
        await _obter_revisao_por_id(db, id_revisao, id_usuario)
        result = await db.execute(
            text(
                """
                UPDATE painel_dsr.tb_revisao_instrumento
                SET
                    status = COALESCE(:status, status),
                    observacao_geral = COALESCE(:observacao_geral, observacao_geral),
                    atualizado_em = NOW(),
                    enviado_em = CASE
                        WHEN :status = 'enviado' THEN COALESCE(enviado_em, NOW())
                        ELSE enviado_em
                    END
                WHERE id_revisao = :id_revisao
                  AND id_usuario = :id_usuario
                RETURNING
                    id_revisao,
                    status,
                    observacao_geral,
                    criado_em,
                    atualizado_em,
                    enviado_em
                """
            ),
            {
                "id_revisao": id_revisao,
                "id_usuario": id_usuario,
                "status": status_revisao,
                "observacao_geral": observacao_geral,
            },
        )
        return dict(result.mappings().one())

    revisao_existente = await _buscar_revisao_existente(db, instrumento, id_usuario)

    if revisao_existente is not None:
        return await _obter_ou_criar_revisao(
            db,
            instrumento,
            id_usuario,
            id_revisao=revisao_existente["id_revisao"],
            status_revisao=status_revisao,
            observacao_geral=observacao_geral,
        )

    result = await db.execute(
        text(
            """
            INSERT INTO painel_dsr.tb_revisao_instrumento (
                identificador_busca,
                tipo_instrumento,
                nr_instrumento,
                nr_proposta,
                nr_ted,
                id_usuario,
                status,
                observacao_geral,
                enviado_em
            )
            VALUES (
                :identificador_busca,
                :tipo_instrumento,
                :nr_instrumento,
                :nr_proposta,
                :nr_ted,
                :id_usuario,
                COALESCE(:status, 'rascunho'),
                :observacao_geral,
                CASE WHEN :status = 'enviado' THEN NOW() ELSE NULL END
            )
            RETURNING
                id_revisao,
                status,
                observacao_geral,
                criado_em,
                atualizado_em,
                enviado_em
            """
        ),
        {
            "identificador_busca": instrumento.identificador_busca,
            "tipo_instrumento": instrumento.tipo_instrumento,
            "nr_instrumento": instrumento.nr_instrumento,
            "nr_proposta": instrumento.nr_proposta,
            "nr_ted": instrumento.nr_ted,
            "id_usuario": id_usuario,
            "status": status_revisao,
            "observacao_geral": observacao_geral,
        },
    )
    return dict(result.mappings().one())


async def _buscar_datas_agregadas(
    db: AsyncSession,
    id_revisao: int,
    cod_municipio: int,
) -> dict:
    # As tabelas de município, localidade e obra não possuem datas de
    # conferência. O contrato mantém os campos opcionais como nulos.
    return {
        "revisao_municipio_conferida_em": None,
        "localidades_conferidas_em": None,
        "obras_conferidas_em": None,
    }


async def _carregar_revisao_salva(
    db: AsyncSession,
    id_revisao: int,
) -> tuple[dict[int, dict], list[dict], list[dict], dict[int, dict]]:
    municipios_result = await _execute_query(
        db,
        """
        SELECT
            cod_municipio,
            origem_registro,
            acao_sugerida,
            justificativa
        FROM painel_dsr.tb_revisao_instrumento_municipio
        WHERE id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )

    localidades_result = await _execute_query(
        db,
        """
        SELECT
            id_revisao_localidade,
            cod_municipio,
            cod_comunidade_rural,
            nome_localidade_informada,
            origem_registro,
            acao_sugerida,
            qtde_familias_ben_original,
            qtde_familias_ben_sugerida,
            justificativa
        FROM painel_dsr.tb_revisao_instrumento_localidade
        WHERE id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )

    obras_result = await _execute_query(
        db,
        """
        SELECT
            id_revisao_obra,
            cod_municipio,
            id_obra::text AS id_obra,
            descricao,
            orgao,
            link_transferegov,
            link_obrasgov,
            relacao_instrumento,
            confirmacao_status,
            justificativa
        FROM painel_dsr.tb_revisao_obra_saneamento ro
        WHERE ro.id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )

    municipios = {
        row["cod_municipio"]: dict(row)
        for row in municipios_result.mappings().all()
    }
    localidades = [dict(row) for row in localidades_result.mappings().all()]
    obras = [dict(row) for row in obras_result.mappings().all()]
    datas: dict[int, dict] = {}

    return municipios, localidades, obras, datas


def _chave_localidade(localidade: LocalidadeRevisaoItem | dict) -> tuple:
    cod_comunidade = (
        localidade.get("cod_comunidade_rural")
        if isinstance(localidade, dict)
        else localidade.cod_comunidade_rural
    )
    nome_informado = (
        localidade.get("nome_localidade_informada")
        if isinstance(localidade, dict)
        else localidade.nome_localidade_informada
    )
    nome = (
        localidade.get("nome_localidade")
        if isinstance(localidade, dict)
        else localidade.nome_localidade
    )

    if cod_comunidade is not None:
        return ("comunidade", cod_comunidade)

    return ("informada", (nome_informado or nome or "").strip().lower())


def _chave_obra(obra: ObraSaneamentoRevisaoItem | dict) -> str:
    return str(obra.get("id_obra") if isinstance(obra, dict) else obra.id_obra)


def _normalizar_id_obra_banco(id_obra: str) -> int | str:
    return str(id_obra).strip()


def _localidade_identificada(localidade: LocalidadeRevisaoAlteracao) -> bool:
    return bool(
        localidade.id_revisao_localidade
        or localidade.cod_comunidade_rural is not None
        or (
            localidade.nome_localidade_informada
            or localidade.nome_localidade
            or ""
        ).strip()
    )


def _montar_municipio_resposta(
    payload_municipio: MunicipioRevisaoAlteracao | None,
    cod_municipio: int,
    datas: dict,
    localidades: list[LocalidadeRevisaoItem],
    obras: list[ObraSaneamentoRevisaoItem],
) -> MunicipioRevisaoItem:
    return MunicipioRevisaoItem(
        cod_municipio=cod_municipio,
        nome=payload_municipio.nome if payload_municipio else None,
        uf=payload_municipio.uf if payload_municipio else None,
        origem_registro=payload_municipio.origem_registro if payload_municipio else "base_atual",
        acao_sugerida=payload_municipio.acao_sugerida if payload_municipio else None,
        justificativa=payload_municipio.justificativa if payload_municipio else None,
        revisao_municipio_conferida_em=datas.get("revisao_municipio_conferida_em"),
        localidades_conferidas_em=datas.get("localidades_conferidas_em"),
        obras_conferidas_em=datas.get("obras_conferidas_em"),
        localidades=localidades,
        obras_saneamento=obras,
    )


async def _persistir_municipio_revisao(
    db: AsyncSession,
    id_revisao: int,
    cod_municipio: int,
    municipio: MunicipioRevisaoAlteracao | None,
    localidades: list[LocalidadeRevisaoAlteracao],
    obras_saneamento: list[ObraSaneamentoRevisaoAlteracao],
) -> MunicipioRevisaoItem:
    localidades_salvas: list[LocalidadeRevisaoItem] = []
    obras_salvas: list[ObraSaneamentoRevisaoItem] = []

    db.info["grupo_salvamento_revisao"] = "municipio"
    if municipio is not None:
        update_result = await db.execute(
            text(
                """
                UPDATE painel_dsr.tb_revisao_instrumento_municipio
                SET
                    origem_registro = :origem_registro,
                    acao_sugerida = :acao_sugerida,
                    justificativa = :justificativa
                WHERE id_revisao = :id_revisao
                  AND cod_municipio = :cod_municipio
                RETURNING id_revisao_municipio
                """
            ),
            {
                "id_revisao": id_revisao,
                "cod_municipio": cod_municipio,
                "origem_registro": municipio.origem_registro,
                "acao_sugerida": municipio.acao_sugerida,
                "justificativa": municipio.justificativa,
            },
        )

        if update_result.mappings().one_or_none() is None:
            await db.execute(
                text(
                    """
                    INSERT INTO painel_dsr.tb_revisao_instrumento_municipio (
                        id_revisao,
                        cod_municipio,
                        origem_registro,
                        acao_sugerida,
                        justificativa
                    )
                    VALUES (
                        :id_revisao,
                        :cod_municipio,
                        :origem_registro,
                        :acao_sugerida,
                        :justificativa
                    )
                    """
                ),
                {
                    "id_revisao": id_revisao,
                    "cod_municipio": cod_municipio,
                    "origem_registro": municipio.origem_registro,
                    "acao_sugerida": municipio.acao_sugerida,
                    "justificativa": municipio.justificativa,
                },
            )

    db.info["grupo_salvamento_revisao"] = "localidades"
    for localidade in localidades:
        if not _localidade_identificada(localidade):
            raise HTTPException(
                status_code=400,
                detail="Localidade alterada sem identificação suficiente.",
            )

        cod_localidade_municipio = localidade.cod_municipio or cod_municipio
        nome_informado = (
            localidade.nome_localidade_informada
            or (
                localidade.nome_localidade
                if localidade.origem_registro == "adicionado_tecnico"
                else None
            )
        )
        params = {
            "id_revisao": id_revisao,
            "cod_municipio": cod_localidade_municipio,
            "cod_comunidade_rural": localidade.cod_comunidade_rural,
            "nome_localidade_informada": nome_informado,
            "origem_registro": localidade.origem_registro,
            "acao_sugerida": localidade.acao_sugerida,
            "qtde_familias_ben_original": localidade.qtde_familias_ben_original,
            "qtde_familias_ben_sugerida": localidade.qtde_familias_ben_sugerida,
            "justificativa": localidade.justificativa,
            "id_revisao_localidade": localidade.id_revisao_localidade,
        }

        if localidade.id_revisao_localidade is not None:
            update_sql = """
                UPDATE painel_dsr.tb_revisao_instrumento_localidade
                SET
                    cod_municipio = :cod_municipio,
                    cod_comunidade_rural = :cod_comunidade_rural,
                    nome_localidade_informada = :nome_localidade_informada,
                    origem_registro = :origem_registro,
                    acao_sugerida = :acao_sugerida,
                    qtde_familias_ben_original = :qtde_familias_ben_original,
                    qtde_familias_ben_sugerida = :qtde_familias_ben_sugerida,
                    justificativa = :justificativa
                WHERE id_revisao = :id_revisao
                  AND id_revisao_localidade = :id_revisao_localidade
                RETURNING id_revisao_localidade
            """
        else:
            update_sql = """
                UPDATE painel_dsr.tb_revisao_instrumento_localidade
                SET
                    nome_localidade_informada = :nome_localidade_informada,
                    origem_registro = :origem_registro,
                    acao_sugerida = :acao_sugerida,
                    qtde_familias_ben_original = :qtde_familias_ben_original,
                    qtde_familias_ben_sugerida = :qtde_familias_ben_sugerida,
                    justificativa = :justificativa
                WHERE id_revisao = :id_revisao
                  AND cod_municipio = :cod_municipio
                  AND (
                    (
                        CAST(:cod_comunidade_rural AS bigint) IS NOT NULL
                        AND cod_comunidade_rural = CAST(:cod_comunidade_rural AS bigint)
                    )
                    OR (
                        CAST(:cod_comunidade_rural AS bigint) IS NULL
                        AND cod_comunidade_rural IS NULL
                        AND COALESCE(nome_localidade_informada, '') =
                            COALESCE(:nome_localidade_informada, '')
                    )
                  )
                RETURNING id_revisao_localidade
            """

        update_result = await db.execute(_localidade_text(update_sql), params)
        localidade_row = update_result.mappings().one_or_none()

        if (
            localidade_row is None
            and localidade.id_revisao_localidade is not None
        ):
            raise HTTPException(
                status_code=404,
                detail="Localidade salva não encontrada para esta revisão.",
            )

        if localidade_row is None:
            insert_result = await db.execute(
                _localidade_text(
                    """
                    INSERT INTO painel_dsr.tb_revisao_instrumento_localidade (
                        id_revisao,
                        cod_municipio,
                        cod_comunidade_rural,
                        nome_localidade_informada,
                        origem_registro,
                        acao_sugerida,
                        qtde_familias_ben_original,
                        qtde_familias_ben_sugerida,
                        justificativa
                    )
                    VALUES (
                        :id_revisao,
                        :cod_municipio,
                        :cod_comunidade_rural,
                        :nome_localidade_informada,
                        :origem_registro,
                        :acao_sugerida,
                        :qtde_familias_ben_original,
                        :qtde_familias_ben_sugerida,
                        :justificativa
                    )
                    RETURNING id_revisao_localidade
                    """
                ),
                params,
            )
            localidade_row = insert_result.mappings().one()

        localidades_salvas.append(
            LocalidadeRevisaoItem(
                **localidade.model_dump(
                    exclude={
                        "id_revisao_localidade",
                        "cod_municipio",
                        "nome_localidade_informada",
                    }
                ),
                id_revisao_localidade=localidade_row["id_revisao_localidade"],
                cod_municipio=cod_localidade_municipio,
                nome_localidade_informada=nome_informado,
            )
        )

    db.info["grupo_salvamento_revisao"] = "obras"
    for obra in obras_saneamento:
        cod_obra_municipio = obra.cod_municipio or cod_municipio
        params = {
            "id_revisao": id_revisao,
            "cod_municipio": cod_obra_municipio,
            "id_revisao_obra": obra.id_revisao_obra,
            "id_obra": _normalizar_id_obra_banco(obra.id_obra),
            "id_obra_texto": str(obra.id_obra),
            "descricao": obra.descricao,
            "orgao": obra.orgao,
            "link_transferegov": obra.link_transferegov,
            "link_obrasgov": obra.link_obrasgov,
            "relacao_instrumento": obra.relacao_instrumento,
            "confirmacao_status": obra.confirmacao_status,
            "justificativa": obra.justificativa,
        }

        if obra.id_revisao_obra is not None:
            update_sql = """
                UPDATE painel_dsr.tb_revisao_obra_saneamento
                SET
                    cod_municipio = :cod_municipio,
                    descricao = :descricao,
                    orgao = :orgao,
                    link_transferegov = :link_transferegov,
                    link_obrasgov = :link_obrasgov,
                    relacao_instrumento = :relacao_instrumento,
                    confirmacao_status = :confirmacao_status,
                    justificativa = :justificativa
                WHERE id_revisao = :id_revisao
                  AND id_revisao_obra = :id_revisao_obra
                RETURNING id_revisao_obra
            """
        else:
            update_sql = """
                UPDATE painel_dsr.tb_revisao_obra_saneamento
                SET
                    descricao = :descricao,
                    orgao = :orgao,
                    link_transferegov = :link_transferegov,
                    link_obrasgov = :link_obrasgov,
                    relacao_instrumento = :relacao_instrumento,
                    confirmacao_status = :confirmacao_status,
                    justificativa = :justificativa
                WHERE id_revisao = :id_revisao
                  AND cod_municipio = :cod_municipio
                  AND id_obra::text = :id_obra_texto
                RETURNING id_revisao_obra
            """

        update_result = await db.execute(text(update_sql), params)
        obra_row = update_result.mappings().one_or_none()

        if obra_row is None and obra.id_revisao_obra is not None:
            raise HTTPException(
                status_code=404,
                detail="Obra salva não encontrada para esta revisão.",
            )

        if obra_row is None:
            insert_result = await db.execute(
                text(
                    """
                    INSERT INTO painel_dsr.tb_revisao_obra_saneamento (
                        id_revisao,
                        cod_municipio,
                        id_obra,
                        descricao,
                        orgao,
                        link_transferegov,
                        link_obrasgov,
                        relacao_instrumento,
                        confirmacao_status,
                        justificativa
                    )
                    VALUES (
                        :id_revisao,
                        :cod_municipio,
                        :id_obra,
                        :descricao,
                        :orgao,
                        :link_transferegov,
                        :link_obrasgov,
                        :relacao_instrumento,
                        :confirmacao_status,
                        :justificativa
                    )
                    RETURNING id_revisao_obra
                    """
                ),
                params,
            )
            obra_row = insert_result.mappings().one_or_none()

            if obra_row is None:
                raise HTTPException(
                    status_code=400,
                    detail="Obra alterada sem identificação válida.",
                )

        obras_salvas.append(
            ObraSaneamentoRevisaoItem(
                **obra.model_dump(
                    exclude={
                        "id_revisao_obra",
                        "cod_municipio",
                        "relacao_instrumento",
                        "confirmacao_status",
                    }
                ),
                id_revisao_obra=obra_row["id_revisao_obra"],
                cod_municipio=cod_obra_municipio,
                relacao_instrumento=obra.relacao_instrumento,
                confirmacao_status=obra.confirmacao_status,
            )
        )

    datas = await _buscar_datas_agregadas(db, id_revisao, cod_municipio)
    return _montar_municipio_resposta(
        municipio,
        cod_municipio,
        datas,
        localidades_salvas,
        obras_salvas,
    )


async def _persistir_publico_alvo(
    db: AsyncSession,
    id_revisao: int,
    instrumento: InstrumentoRevisaoInfo,
    itens: list[PublicoAlvoRevisaoAlteracao],
) -> list[PublicoAlvoRevisaoItem]:
    db.info["grupo_salvamento_revisao"] = "publico-alvo"
    if not itens:
        return await _buscar_publico_alvo(db, instrumento, id_revisao)

    elegiveis = await _buscar_publico_alvo(db, instrumento, id_revisao)
    elegiveis_por_id = {
        item.id_projeto_investimento: item
        for item in elegiveis
    }

    for item in itens:
        projeto = elegiveis_por_id.get(item.id_projeto_investimento)

        if projeto is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Projeto de investimento não vinculado ao instrumento DSR "
                    "pesquisado."
                ),
            )

        campos_enviados = item.model_fields_set
        populacao_enviada = "populacao_beneficiada_revisada" in campos_enviados
        desc_enviada = "desc_populacao_beneficiada_revisada" in campos_enviados

        if not populacao_enviada and not desc_enviada:
            continue

        await db.execute(
            text(
                """
                INSERT INTO painel_dsr.tb_revisao_instrumento_publico_alvo AS rpa (
                    id_revisao,
                    id_projeto_investimento,
                    populacao_beneficiada_original,
                    desc_populacao_beneficiada_original,
                    populacao_beneficiada_revisada,
                    desc_populacao_beneficiada_revisada,
                    conferido_em,
                    atualizado_em
                )
                VALUES (
                    :id_revisao,
                    :id_projeto_investimento,
                    :populacao_beneficiada_original,
                    :desc_populacao_beneficiada_original,
                    CASE
                        WHEN :populacao_enviada
                        THEN :populacao_beneficiada_revisada
                        ELSE NULL
                    END,
                    CASE
                        WHEN :desc_enviada
                        THEN :desc_populacao_beneficiada_revisada
                        ELSE NULL
                    END,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id_revisao, id_projeto_investimento)
                DO UPDATE SET
                    populacao_beneficiada_original = COALESCE(
                        rpa.populacao_beneficiada_original,
                        EXCLUDED.populacao_beneficiada_original
                    ),
                    desc_populacao_beneficiada_original = COALESCE(
                        rpa.desc_populacao_beneficiada_original,
                        EXCLUDED.desc_populacao_beneficiada_original
                    ),
                    populacao_beneficiada_revisada = CASE
                        WHEN :populacao_enviada
                        THEN EXCLUDED.populacao_beneficiada_revisada
                        ELSE rpa.populacao_beneficiada_revisada
                    END,
                    desc_populacao_beneficiada_revisada = CASE
                        WHEN :desc_enviada
                        THEN EXCLUDED.desc_populacao_beneficiada_revisada
                        ELSE rpa.desc_populacao_beneficiada_revisada
                    END,
                    conferido_em = NOW(),
                    atualizado_em = NOW()
                """
            ),
            {
                "id_revisao": id_revisao,
                "id_projeto_investimento": item.id_projeto_investimento,
                "populacao_beneficiada_original": projeto.populacao_beneficiada_original,
                "desc_populacao_beneficiada_original": (
                    projeto.desc_populacao_beneficiada_original
                ),
                "populacao_beneficiada_revisada": (
                    item.populacao_beneficiada_revisada
                ),
                "desc_populacao_beneficiada_revisada": (
                    item.desc_populacao_beneficiada_revisada
                ),
                "populacao_enviada": populacao_enviada,
                "desc_enviada": desc_enviada,
            },
        )

    return await _buscar_publico_alvo(db, instrumento, id_revisao)


async def _montar_resposta_busca(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
    usuario_atual: UsuarioAutenticado,
) -> RevisaoInstrumentoBuscaResponse:
    revisao = await _buscar_revisao_existente(
        db,
        instrumento,
        usuario_atual.id_usuario,
    )
    id_revisao = revisao["id_revisao"] if revisao else None
    municipios_salvos: dict[int, dict] = {}
    localidades_salvas: list[dict] = []
    obras_salvas: list[dict] = []
    datas_salvas: dict[int, dict] = {}

    if id_revisao is not None:
        (
            municipios_salvos,
            localidades_salvas,
            obras_salvas,
            datas_salvas,
        ) = await _carregar_revisao_salva(db, id_revisao)

    municipios = await _buscar_municipios(db, instrumento)
    municipios_por_codigo = {item.cod_municipio: item for item in municipios}

    for cod_municipio, municipio_salvo in municipios_salvos.items():
        municipio = municipios_por_codigo.get(cod_municipio)

        if municipio is None:
            municipio = MunicipioRevisaoItem(
                cod_municipio=cod_municipio,
                nome=None,
                uf=None,
                origem_registro=municipio_salvo["origem_registro"],
                acao_sugerida=municipio_salvo["acao_sugerida"],
                justificativa=municipio_salvo["justificativa"],
                localidades=[],
                obras_saneamento=[],
            )
            municipios.append(municipio)
            municipios_por_codigo[cod_municipio] = municipio
        else:
            municipio.origem_registro = municipio_salvo["origem_registro"]
            municipio.acao_sugerida = municipio_salvo["acao_sugerida"]
            municipio.justificativa = municipio_salvo["justificativa"]

    localidades = await _buscar_localidades(db, instrumento)

    for localidade in localidades:
        if localidade.cod_municipio is None:
            continue

        municipio = municipios_por_codigo.get(localidade.cod_municipio)

        if municipio is None:
            municipio = MunicipioRevisaoItem(
                cod_municipio=localidade.cod_municipio,
                nome=None,
                uf=None,
                origem_registro="base_atual",
                acao_sugerida=None,
                localidades=[],
                obras_saneamento=[],
            )
            municipios.append(municipio)
            municipios_por_codigo[localidade.cod_municipio] = municipio

        municipio.localidades.append(localidade)

    for localidade_salva in localidades_salvas:
        cod_municipio = localidade_salva["cod_municipio"]
        municipio = municipios_por_codigo.get(cod_municipio)

        if municipio is None:
            municipio = MunicipioRevisaoItem(
                cod_municipio=cod_municipio,
                nome=None,
                uf=None,
                origem_registro="base_atual",
                acao_sugerida=None,
                localidades=[],
                obras_saneamento=[],
            )
            municipios.append(municipio)
            municipios_por_codigo[cod_municipio] = municipio

        item_salvo = LocalidadeRevisaoItem(
            id_revisao_localidade=localidade_salva["id_revisao_localidade"],
            cod_municipio=cod_municipio,
            cod_comunidade_rural=localidade_salva["cod_comunidade_rural"],
            nome_localidade=localidade_salva["nome_localidade_informada"],
            nome_localidade_informada=localidade_salva["nome_localidade_informada"],
            origem_registro=localidade_salva["origem_registro"],
            acao_sugerida=localidade_salva["acao_sugerida"],
            qtde_familias_ben_original=localidade_salva["qtde_familias_ben_original"],
            qtde_familias_ben_sugerida=localidade_salva["qtde_familias_ben_sugerida"],
            justificativa=localidade_salva["justificativa"],
        )
        chave_salva = _chave_localidade(item_salvo)
        indice_existente = next(
            (
                index
                for index, localidade in enumerate(municipio.localidades)
                if _chave_localidade(localidade) == chave_salva
            ),
            None,
        )

        if indice_existente is None:
            municipio.localidades.append(item_salvo)
        else:
            municipio.localidades[indice_existente] = municipio.localidades[
                indice_existente
            ].model_copy(
                update={
                    "id_revisao_localidade": item_salvo.id_revisao_localidade,
                    "nome_localidade_informada": item_salvo.nome_localidade_informada,
                    "origem_registro": item_salvo.origem_registro,
                    "acao_sugerida": item_salvo.acao_sugerida,
                    "qtde_familias_ben_sugerida": item_salvo.qtde_familias_ben_sugerida,
                    "justificativa": item_salvo.justificativa,
                }
            )

    obras = await _buscar_obras_saneamento(
        db,
        [municipio.cod_municipio for municipio in municipios],
    )

    for obra in obras:
        municipio = municipios_por_codigo.get(obra.cod_municipio)

        if municipio is not None:
            municipio.obras_saneamento.append(obra)

    for obra_salva in obras_salvas:
        cod_municipio = obra_salva["cod_municipio"]
        municipio = municipios_por_codigo.get(cod_municipio)

        if municipio is None:
            municipio = MunicipioRevisaoItem(
                cod_municipio=cod_municipio,
                nome=None,
                uf=None,
                origem_registro="base_atual",
                acao_sugerida=None,
                localidades=[],
                obras_saneamento=[],
            )
            municipios.append(municipio)
            municipios_por_codigo[cod_municipio] = municipio

        item_salvo = ObraSaneamentoRevisaoItem(
            id_revisao_obra=obra_salva["id_revisao_obra"],
            id_obra=obra_salva["id_obra"],
            cod_municipio=cod_municipio,
            descricao=obra_salva["descricao"],
            orgao=obra_salva["orgao"],
            link_transferegov=obra_salva["link_transferegov"],
            link_obrasgov=obra_salva["link_obrasgov"],
            relacao_instrumento=obra_salva["relacao_instrumento"] or "nao_analisada",
            confirmacao_status=obra_salva["confirmacao_status"] or "nao_confirmada",
            justificativa=obra_salva["justificativa"],
        )
        chave_salva = _chave_obra(item_salvo)
        indice_existente = next(
            (
                index
                for index, obra in enumerate(municipio.obras_saneamento)
                if _chave_obra(obra) == chave_salva
            ),
            None,
        )

        if indice_existente is None:
            municipio.obras_saneamento.append(item_salvo)
        else:
            municipio.obras_saneamento[indice_existente] = municipio.obras_saneamento[
                indice_existente
            ].model_copy(
                update={
                    "id_revisao_obra": item_salvo.id_revisao_obra,
                    "relacao_instrumento": item_salvo.relacao_instrumento,
                    "confirmacao_status": item_salvo.confirmacao_status,
                    "justificativa": item_salvo.justificativa,
                }
            )

    for municipio in municipios:
        datas = datas_salvas.get(municipio.cod_municipio, {})
        municipio.revisao_municipio_conferida_em = datas.get(
            "revisao_municipio_conferida_em"
        )
        municipio.localidades_conferidas_em = datas.get("localidades_conferidas_em")
        municipio.obras_conferidas_em = datas.get("obras_conferidas_em")

    status_revisao_geral, status_revisao_geral_label = (
        _calcular_status_revisao_municipios(municipios)
    )
    publico_alvo = await _buscar_publico_alvo(db, instrumento, id_revisao)

    return RevisaoInstrumentoBuscaResponse(
        id_revisao=id_revisao,
        identificador_busca=instrumento.identificador_busca,
        instrumento=instrumento,
        status=revisao["status"] if revisao else None,
        status_revisao_geral=status_revisao_geral,
        status_revisao_geral_label=status_revisao_geral_label,
        observacao_geral=revisao["observacao_geral"] if revisao else None,
        municipios=municipios,
        publico_alvo=publico_alvo,
    )


@router.get(
    "/instrumentos",
    response_model=RevisaoInstrumentoBuscaResponse,
    summary="Busca instrumento para revisão",
)
async def buscar_instrumento_para_revisao(
    identificador: Annotated[str, Query(min_length=1, max_length=100)],
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    identificador_limpo = identificador.strip()

    instrumento = await _buscar_instrumento_carteira(db, identificador_limpo)

    if instrumento is None:
        instrumento = await _buscar_instrumento_ted(db, identificador_limpo)

    if instrumento is None:
        raise HTTPException(
            status_code=404,
            detail="Instrumento, proposta ou TED não encontrado nas bases oficiais.",
        )

    return await _montar_resposta_busca(db, instrumento, usuario_atual)


@router.post(
    "/revisoes",
    response_model=RevisaoInstrumentoSalvoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Salva revisão de instrumento como rascunho ou enviada",
)
async def salvar_revisao_instrumento(
    payload: RevisaoInstrumentoCreate,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    instrumento = payload.instrumento

    try:
        db.info["grupo_salvamento_revisao"] = "revisao"
        revisao = await _obter_ou_criar_revisao(
            db,
            instrumento,
            usuario_atual.id_usuario,
            id_revisao=payload.id_revisao,
            status_revisao=payload.status,
            observacao_geral=payload.observacao_geral,
        )
        id_revisao = revisao["id_revisao"]
        municipios_salvos = []

        for municipio in payload.municipios:
            municipio_alteracao = None

            if municipio.acao_sugerida is not None:
                municipio_alteracao = MunicipioRevisaoAlteracao(
                    cod_municipio=municipio.cod_municipio,
                    nome=municipio.nome,
                    uf=municipio.uf,
                    origem_registro=municipio.origem_registro,
                    acao_sugerida=municipio.acao_sugerida,
                    justificativa=municipio.justificativa,
                )

            municipio_salvo = await _persistir_municipio_revisao(
                db,
                id_revisao,
                municipio.cod_municipio,
                municipio_alteracao,
                municipio.localidades,
                municipio.obras_saneamento,
            )
            municipios_salvos.append(municipio_salvo)

        publico_alvo_salvo = await _persistir_publico_alvo(
            db,
            id_revisao,
            instrumento,
            payload.publico_alvo,
        )
        resposta_atualizada = await _montar_resposta_busca(
            db,
            instrumento,
            usuario_atual,
        )

        await db.commit()

        return RevisaoInstrumentoSalvoResponse(
            id_revisao=id_revisao,
            status=revisao["status"],
            status_revisao_geral=resposta_atualizada.status_revisao_geral,
            status_revisao_geral_label=resposta_atualizada.status_revisao_geral_label,
            mensagem="Revisão salva com sucesso.",
            criado_em=revisao["criado_em"],
            atualizado_em=revisao["atualizado_em"],
            enviado_em=revisao["enviado_em"],
            municipios=municipios_salvos,
            publico_alvo=publico_alvo_salvo,
        )

    except HTTPException:
        await db.rollback()
        raise

    except SQLAlchemyError as exc:
        await db.rollback()
        logger.exception(
            "Erro ao salvar revisão de instrumento: tipo_excecao=%s grupo=%s "
            "id_revisao=%s",
            type(exc).__name__,
            db.info.get("grupo_salvamento_revisao", "revisao"),
            payload.id_revisao,
        )
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao salvar a revisão de instrumento.",
        )

    except Exception as exc:
        await db.rollback()
        logger.exception(
            "Erro inesperado ao salvar revisão de instrumento: "
            "tipo_excecao=%s grupo=%s id_revisao=%s",
            type(exc).__name__,
            db.info.get("grupo_salvamento_revisao", "revisao"),
            payload.id_revisao,
        )
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao salvar a revisão de instrumento.",
        )


@router.patch(
    "/revisoes/municipio",
    response_model=RevisaoInstrumentoMunicipioSalvoResponse,
    summary="Salva alterações de um município da revisão",
)
async def salvar_municipio_revisao(
    payload: RevisaoInstrumentoMunicipioSave,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    id_revisao_log = payload.id_revisao

    if (
        payload.municipio is None
        and not payload.localidades
        and not payload.obras_saneamento
    ):
        raise HTTPException(
            status_code=400,
            detail="Não há alterações para salvar neste município.",
        )

    try:
        db.info["grupo_salvamento_revisao"] = "revisao"
        revisao = await _obter_ou_criar_revisao(
            db,
            payload.instrumento,
            usuario_atual.id_usuario,
            id_revisao=payload.id_revisao,
            status_revisao=None,
            observacao_geral=None,
        )
        id_revisao_log = revisao["id_revisao"]
        municipio = await _persistir_municipio_revisao(
            db,
            revisao["id_revisao"],
            payload.cod_municipio,
            payload.municipio,
            payload.localidades,
            payload.obras_saneamento,
        )
        resposta_atualizada = await _montar_resposta_busca(
            db,
            payload.instrumento,
            usuario_atual,
        )

        await db.commit()

        return RevisaoInstrumentoMunicipioSalvoResponse(
            id_revisao=revisao["id_revisao"],
            status=revisao["status"],
            status_revisao_geral=resposta_atualizada.status_revisao_geral,
            status_revisao_geral_label=resposta_atualizada.status_revisao_geral_label,
            mensagem="Alterações do município salvas com sucesso.",
            municipio=municipio,
        )

    except HTTPException:
        await db.rollback()
        raise

    except SQLAlchemyError as exc:
        await db.rollback()
        logger.exception(
            "Erro ao salvar município da revisão: tipo_excecao=%s "
            "grupo=%s id_revisao=%s cod_municipio=%s "
            "qtd_localidades=%s qtd_obras=%s",
            type(exc).__name__,
            db.info.get("grupo_salvamento_revisao", "desconhecido"),
            id_revisao_log,
            payload.cod_municipio,
            len(payload.localidades),
            len(payload.obras_saneamento),
        )
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao salvar as alterações do município.",
        )

    except Exception as exc:
        await db.rollback()
        logger.exception(
            "Erro inesperado ao salvar município da revisão: tipo_excecao=%s "
            "grupo=%s id_revisao=%s cod_municipio=%s "
            "qtd_localidades=%s qtd_obras=%s",
            type(exc).__name__,
            db.info.get("grupo_salvamento_revisao", "desconhecido"),
            id_revisao_log,
            payload.cod_municipio,
            len(payload.localidades),
            len(payload.obras_saneamento),
        )
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao salvar as alterações do município.",
        )
