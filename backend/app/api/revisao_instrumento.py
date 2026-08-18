"""Endpoints da revisão de instrumentos DSR."""

import logging
import unicodedata
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
    HistoricoRevisoesResponse,
    MeuInstrumentoRevisaoItem,
    MeusInstrumentosRevisaoResponse,
    MunicipioOficialItem,
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
    RevisaoInstrumentoDetalheResponse,
    RevisaoInstrumentoMunicipioSave,
    RevisaoInstrumentoMunicipioSalvoResponse,
    RevisaoInstrumentoSalvoResponse,
    RevisaoHistoricoItem,
    UsuarioRevisaoInfo,
)
from app.services.permissoes_revisao import exigir_permissao_edicao, pode_editar_instrumento

router = APIRouter()
logger = logging.getLogger(__name__)


def _remover_acentos(valor: str) -> str:
    return "".join(
        caractere
        for caractere in unicodedata.normalize("NFD", valor)
        if unicodedata.category(caractere) != "Mn"
    )


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


def _label_status_historico(aplicado_em) -> str:
    return "Aplicada" if aplicado_em is not None else "Enviada — aguardando aplicação"


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


def calcular_completude(
    municipios: list[MunicipioRevisaoItem],
    publico_alvo: list[PublicoAlvoRevisaoItem],
) -> dict:
    municipios_total = len(municipios)
    localidades_total = sum(len(municipio.localidades) for municipio in municipios)
    obras_total = sum(len(municipio.obras_saneamento) for municipio in municipios)
    municipios_revisados = sum(
        1 for municipio in municipios if _item_tem_conferencia(municipio.acao_sugerida)
    )
    localidades_revisadas = sum(
        1
        for municipio in municipios
        for localidade in municipio.localidades
        if _item_tem_conferencia(localidade.acao_sugerida)
        or localidade.origem_registro == "adicionado_tecnico"
    )
    obras_revisadas = sum(
        1
        for municipio in municipios
        for obra in municipio.obras_saneamento
        if obra.relacao_instrumento != "nao_analisada"
    )
    publico_alvo_revisado = any(item.conferido_em is not None for item in publico_alvo)
    municipios_pendentes = max(municipios_total - municipios_revisados, 0)
    localidades_pendentes = max(localidades_total - localidades_revisadas, 0)
    obras_pendentes = max(obras_total - obras_revisadas, 0)
    publico_alvo_pendente = bool(publico_alvo) and not publico_alvo_revisado
    total = municipios_pendentes + localidades_pendentes + obras_pendentes + int(publico_alvo_pendente)
    possui_manifestacao = bool(
        municipios_revisados
        or localidades_revisadas
        or obras_revisadas
        or publico_alvo_revisado
    )
    return {
        "completa": total == 0,
        "possui_manifestacao": possui_manifestacao,
        "municipios_revisados": municipios_revisados,
        "municipios_total": municipios_total,
        "localidades_revisadas": localidades_revisadas,
        "localidades_total": localidades_total,
        "obras_revisadas": obras_revisadas,
        "obras_total": obras_total,
        "publico_alvo_revisado": publico_alvo_revisado,
        "total_pendencias": total,
        "municipios_pendentes": municipios_pendentes,
        "localidades_pendentes": localidades_pendentes,
        "obras_pendentes": obras_pendentes,
        "publico_alvo_pendente": publico_alvo_pendente,
    }


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
            rpa.conferido_em,
            rpa.valido_ate
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
            valido_ate=row["valido_ate"],
        )
        for row in result.mappings().all()
    ]


async def _buscar_rascunho_global(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
) -> dict | None:
    result = await _execute_query(
        db,
        """
        SELECT
            r.id_revisao,
            r.id_usuario,
            u.nome AS responsavel_nome,
            r.status,
            r.observacao_geral,
            r.criado_em,
            r.atualizado_em,
            r.enviado_em
        FROM painel_dsr.tb_revisao_instrumento AS r
        JOIN painel_dsr.tb_usuario AS u
          ON u.id_usuario = r.id_usuario
        WHERE r.tipo_instrumento = :tipo_instrumento
          AND r.status = 'rascunho'
          AND (
                (:tipo_instrumento = 'ted' AND r.nr_ted = :nr_ted)
             OR (:tipo_instrumento <> 'ted'
                 AND NULLIF(BTRIM(r.nr_instrumento), '') = NULLIF(BTRIM(:nr_instrumento), ''))
          )
        ORDER BY r.atualizado_em DESC NULLS LAST, r.criado_em DESC, r.id_revisao DESC
        LIMIT 1
        """,
        {
            "tipo_instrumento": instrumento.tipo_instrumento,
            "nr_instrumento": instrumento.nr_instrumento,
            "nr_ted": instrumento.nr_ted,
        },
    )
    row = result.mappings().one_or_none()
    return dict(row) if row else None


def _rascunho_para_contrato(rascunho: dict, id_usuario: int) -> dict:
    return {
        **rascunho,
        "eh_autor": rascunho["id_usuario"] == id_usuario,
    }


def _detalhe_conflito_rascunho(rascunho: dict | None = None) -> dict:
    detail = {
        "mensagem": "Já existe um rascunho em andamento para este instrumento."
    }
    if rascunho is not None:
        detail["rascunho_global"] = rascunho
    return detail


async def _buscar_revisoes_pendentes_aplicacao(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
) -> tuple[dict | None, int]:
    result = await _execute_query(
        db,
        """
        SELECT
            r.id_revisao,
            r.id_usuario,
            r.status,
            r.enviado_em,
            r.aplicado_em,
            u.nome AS responsavel_nome
        FROM painel_dsr.tb_revisao_instrumento AS r
        JOIN painel_dsr.tb_usuario AS u
          ON u.id_usuario = r.id_usuario
        WHERE r.tipo_instrumento = :tipo_instrumento
          AND r.status = 'enviado'
          AND r.enviado_em IS NOT NULL
          AND r.aplicado_em IS NULL
          AND (
                (:tipo_instrumento = 'ted' AND r.nr_ted = :nr_ted)
             OR (:tipo_instrumento <> 'ted'
                 AND NULLIF(BTRIM(r.nr_instrumento), '') =
                     NULLIF(BTRIM(:nr_instrumento), ''))
          )
        ORDER BY r.enviado_em DESC, r.id_revisao DESC
        """,
        {
            "tipo_instrumento": instrumento.tipo_instrumento,
            "nr_instrumento": instrumento.nr_instrumento,
            "nr_ted": instrumento.nr_ted,
        },
    )
    revisoes = [dict(row) for row in result.mappings().all()]
    return (revisoes[0] if revisoes else None), len(revisoes)


async def _obter_revisao_por_id(
    db: AsyncSession,
    id_revisao: int,
    id_usuario: int,
    instrumento: InstrumentoRevisaoInfo,
) -> dict:
    result = await _execute_query(
        db,
        """
        SELECT
            id_revisao,
            id_usuario,
            tipo_instrumento,
            nr_instrumento,
            nr_ted,
            status,
            observacao_geral,
            criado_em,
            atualizado_em,
            enviado_em
        FROM painel_dsr.tb_revisao_instrumento
        WHERE id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Revisão não encontrada.",
        )

    if row["id_usuario"] != id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A revisão pertence a outro usuário.",
        )

    mesma_identidade = row["tipo_instrumento"] == instrumento.tipo_instrumento
    if instrumento.tipo_instrumento == "ted":
        mesma_identidade = mesma_identidade and row["nr_ted"] == instrumento.nr_ted
    else:
        mesma_identidade = mesma_identidade and (
            (row["nr_instrumento"] or "").strip()
            == (instrumento.nr_instrumento or "").strip()
        )

    if not mesma_identidade:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A revisão informada não pertence a este instrumento.",
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
        revisao = await _obter_revisao_por_id(
            db, id_revisao, id_usuario, instrumento
        )
        if revisao["status"] != "rascunho":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A revisão já foi enviada e é somente leitura.",
            )
        result = await db.execute(
            text(
                """
                UPDATE painel_dsr.tb_revisao_instrumento
                SET
                    status = CASE WHEN :status = 'enviado' THEN 'enviado' ELSE status END,
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

    revisao_existente = await _buscar_rascunho_global(db, instrumento)

    if revisao_existente is not None:
        if revisao_existente["id_usuario"] != id_usuario:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=_detalhe_conflito_rascunho(
                    _rascunho_para_contrato(revisao_existente, id_usuario)
                ),
            )
        if status_revisao == "enviado":
            return await _obter_ou_criar_revisao(
                db, instrumento, id_usuario,
                id_revisao=revisao_existente["id_revisao"],
                status_revisao=status_revisao,
                observacao_geral=observacao_geral,
            )
        return revisao_existente

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
                enviado_em,
                id_revisao_anterior,
                base_referencia_em
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
                CASE WHEN :status = 'enviado' THEN NOW() ELSE NULL END,
                (
                    SELECT id_revisao
                    FROM painel_dsr.tb_revisao_instrumento anterior
                    WHERE anterior.tipo_instrumento = CAST(:tipo_instrumento AS varchar)
                      AND anterior.status = 'enviado'
                      AND ((CAST(:tipo_instrumento AS varchar) = 'ted' AND anterior.nr_ted = CAST(:nr_ted AS integer))
                        OR (CAST(:tipo_instrumento AS varchar) <> 'ted' AND NULLIF(BTRIM(anterior.nr_instrumento), '') = NULLIF(BTRIM(CAST(:nr_instrumento AS varchar)), '')))
                    ORDER BY anterior.enviado_em DESC NULLS LAST, anterior.id_revisao DESC
                    LIMIT 1
                ),
                NOW()
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
    municipio = await _execute_query(db, """
        SELECT conferido_em, valido_ate
        FROM painel_dsr.tb_revisao_instrumento_municipio
        WHERE id_revisao = :id_revisao AND cod_municipio = :cod_municipio
    """, {"id_revisao": id_revisao, "cod_municipio": cod_municipio})
    localidades = await _execute_query(db, """
        SELECT MAX(conferido_em) AS conferido_em, MIN(valido_ate) AS valido_ate
        FROM painel_dsr.tb_revisao_instrumento_localidade
        WHERE id_revisao = :id_revisao AND cod_municipio = :cod_municipio
          AND conferido_em IS NOT NULL
    """, {"id_revisao": id_revisao, "cod_municipio": cod_municipio})
    obras = await _execute_query(db, """
        SELECT MAX(conferido_em) AS conferido_em, MIN(valido_ate) AS valido_ate
        FROM painel_dsr.tb_revisao_obra_saneamento
        WHERE id_revisao = :id_revisao AND cod_municipio = :cod_municipio
          AND relacao_instrumento <> 'nao_analisada'
          AND conferido_em IS NOT NULL
    """, {"id_revisao": id_revisao, "cod_municipio": cod_municipio})
    municipio_row = municipio.mappings().one_or_none() or {}
    localidade_row = localidades.mappings().one() or {}
    obra_row = obras.mappings().one() or {}
    return {
        "revisao_municipio_conferida_em": municipio_row.get("conferido_em"),
        "revisao_municipio_valido_ate": municipio_row.get("valido_ate"),
        "localidades_conferidas_em": localidade_row.get("conferido_em"),
        "localidades_valido_ate": localidade_row.get("valido_ate"),
        "obras_conferidas_em": obra_row.get("conferido_em"),
        "obras_valido_ate": obra_row.get("valido_ate"),
    }


async def _buscar_situacoes_revisao(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
    id_usuario: int,
) -> tuple[dict, dict | None, dict | None, dict | None, int, dict]:
    params = {
        "tipo_instrumento": instrumento.tipo_instrumento,
        "nr_instrumento": instrumento.nr_instrumento,
        "nr_ted": instrumento.nr_ted,
        "id_usuario": id_usuario,
    }
    filtro = """
        tipo_instrumento = :tipo_instrumento
        AND ((:tipo_instrumento = 'ted' AND nr_ted = :nr_ted)
          OR (:tipo_instrumento <> 'ted'
              AND NULLIF(BTRIM(nr_instrumento), '') = NULLIF(BTRIM(:nr_instrumento), '')))
    """
    revisao_pendente, quantidade_pendentes = (
        await _buscar_revisoes_pendentes_aplicacao(db, instrumento)
    )
    pendentes = await _execute_query(
        db,
        f"""
        SELECT COUNT(*) AS quantidade,
               MAX(enviado_em) AS ultima_revisao_enviada_em,
               MAX(aplicado_em) AS ultima_aplicacao_em
        FROM painel_dsr.tb_revisao_instrumento
        WHERE {filtro} AND status = 'enviado'
        """,
        params,
    )


    resumo = dict(pendentes.mappings().one())
    quantidade = int(resumo["quantidade"] or 0)
    if quantidade == 0:
        situacao = {
            "status": "sem_revisao_enviada",
            "status_label": "Instrumento ainda não revisado",
            "quantidade_revisoes_pendentes": 0,
        }
    else:
        situacao = {
            "status": (
                "pendente_atualizacao_diaria"
                if quantidade_pendentes > 0
                else "base_atualizada"
            ),
            "status_label": (
                "Revisões enviadas — aguardando atualização diária"
                if quantidade_pendentes > 0
                else f"Última atualização: {resumo['ultima_aplicacao_em']:%d/%m/%Y às %Hh%M}"
            ),
            "quantidade_revisoes_pendentes": quantidade_pendentes
            if quantidade_pendentes > 0
            else 0,
            "ultima_revisao_enviada_em": resumo["ultima_revisao_enviada_em"],
            "ultima_aplicacao_em": resumo["ultima_aplicacao_em"],
        }

    draft = await _buscar_rascunho_global(db, instrumento)
    ultima_usuario_result = await _execute_query(
        db,
        f"""
        SELECT id_revisao, status, criado_em, atualizado_em, enviado_em, aplicado_em,
               observacao_geral
        FROM painel_dsr.tb_revisao_instrumento
        WHERE {filtro} AND id_usuario = :id_usuario AND status = 'enviado'
        ORDER BY enviado_em DESC NULLS LAST, id_revisao DESC
        LIMIT 1
        """,
        params,
    )
    ultima_usuario = ultima_usuario_result.mappings().one_or_none()

    outros = int(bool(draft and draft["id_usuario"] != id_usuario))
    colaborativa = {
        "outros_rascunhos_existentes": outros > 0,
        "quantidade_outros_rascunhos": outros,
        "status_label": (
            "Já existe um rascunho em andamento para este instrumento."
            if outros
            else None
        ),
    }
    return (
        situacao,
        (dict(draft) if draft else None),
        (dict(ultima_usuario) if ultima_usuario else None),
        revisao_pendente,
        quantidade_pendentes,
        colaborativa,
    )


async def _buscar_meus_instrumentos(
    db: AsyncSession,
    usuario: UsuarioAutenticado,
) -> list[MeuInstrumentoRevisaoItem]:
    result = await _execute_query(
        db,
        """
        WITH carteira AS (
            SELECT DISTINCT ON (v.nr_instrumento::text)
                v.nr_instrumento::text AS nr_instrumento,
                v.nr_proposta::text AS nr_proposta,
                v.tipo_instrumento AS tipo_original,
                v.uf,
                v.municipios_beneficiados,
                v.valor_global,
                v.objeto,
                v.percentual_fisico_aferido,
                v.situacao_atual,
                t.nr_ted,
                CASE
                    WHEN t.nr_ted IS NOT NULL THEN 'ted'
                    WHEN EXISTS (
                        SELECT 1 FROM instrumento.tb_contrato_repasse cr
                        WHERE cr.nr_proposta = v.nr_proposta
                    ) THEN 'contrato_repasse'
                    WHEN EXISTS (
                        SELECT 1 FROM instrumento.tb_termo_de_compromisso tc
                        WHERE tc.nr_proposta = v.nr_proposta
                    ) THEN 'termo_compromisso'
                    ELSE NULL
                END AS tipo_normalizado
            FROM painel_dsr.tb_usuario_instrumento_monitoramento ui
            INNER JOIN instrumento.vw_carteira_dsr v
                ON NULLIF(BTRIM(v.nr_instrumento::text), '') = NULLIF(BTRIM(ui.nr_instrumento), '')
            LEFT JOIN instrumento.tb_ted t
                ON t.nr_ted::text = NULLIF(
                    LTRIM(regexp_replace(v.nr_instrumento::text, '\\D', '', 'g'), '0'),
                    ''
                )
            WHERE ui.id_usuario = :id_usuario
              AND ui.ativo IS TRUE
            ORDER BY v.nr_instrumento::text, v.nr_proposta::text
        )
        SELECT
            c.nr_instrumento,
            c.nr_proposta,
            c.nr_ted,
            c.tipo_normalizado AS tipo_instrumento,
            c.tipo_original,
            c.uf,
            c.municipios_beneficiados,
            c.valor_global,
            c.objeto,
            c.percentual_fisico_aferido,
            c.situacao_atual,
            r.status AS status_revisao
        FROM carteira c
        LEFT JOIN LATERAL (
            SELECT ri.status
            FROM painel_dsr.tb_revisao_instrumento ri
            WHERE ri.id_usuario = :id_usuario
              AND ri.tipo_instrumento = c.tipo_normalizado
              AND (
                    (c.tipo_normalizado = 'ted' AND ri.nr_ted = c.nr_ted)
                 OR (c.tipo_normalizado <> 'ted'
                     AND NULLIF(BTRIM(ri.nr_instrumento), '') = NULLIF(BTRIM(c.nr_instrumento), ''))
              )
            ORDER BY
                CASE WHEN ri.status = 'rascunho' THEN 0 ELSE 1 END,
                COALESCE(ri.atualizado_em, ri.enviado_em, ri.criado_em) DESC,
                ri.id_revisao DESC
            LIMIT 1
        ) r ON TRUE
        WHERE c.tipo_normalizado IS NOT NULL
        ORDER BY c.nr_instrumento
        """,
        {"id_usuario": usuario.id_usuario},
    )

    labels = {
        "contrato_repasse": "Contrato de Repasse",
        "termo_compromisso": "Termo de Compromisso",
        "ted": "TED",
    }
    status_labels = {
        "rascunho": "Rascunho em andamento",
        "enviado": "Última revisão enviada",
    }
    return [
        MeuInstrumentoRevisaoItem(
            **dict(row),
            tipo_instrumento_label=labels.get(row["tipo_instrumento"]),
            status_revisao_label=status_labels.get(row["status_revisao"], "Sem revisão"),
        )
        for row in result.mappings().all()
    ]


async def _buscar_municipios_oficiais(
    db: AsyncSession,
    termo: str,
    limite: int = 20,
) -> list[MunicipioOficialItem]:
    termo_limpo = termo.strip()
    if len(termo_limpo) < 2:
        return []

    result = await _execute_query(
        db,
        """
        SELECT
            m.cod_municipio,
            m.nome_municipio,
            m.cod_uf,
            BTRIM(uf.sigla_uf) AS sigla_uf,
            uf.nome_uf
        FROM territorio.tb_municipio AS m
        INNER JOIN territorio.tb_uf AS uf
          ON uf.cod_uf = m.cod_uf
        WHERE CAST(m.cod_municipio AS TEXT) = :termo_codigo
           OR TRANSLATE(
                LOWER(m.nome_municipio),
                'áàâãäéèêëíìîïóòôõöúùûüç',
                'aaaaaeeeeiiiiooooouuuuc'
              ) LIKE :termo_texto
           OR LOWER(BTRIM(uf.sigla_uf)) LIKE :termo_texto
           OR TRANSLATE(
                LOWER(uf.nome_uf),
                'áàâãäéèêëíìîïóòôõöúùûüç',
                'aaaaaeeeeiiiiooooouuuuc'
              ) LIKE :termo_texto
           OR TRANSLATE(
                LOWER(m.nome_municipio || '/' || BTRIM(uf.sigla_uf)),
                'áàâãäéèêëíìîïóòôõöúùûüç',
                'aaaaaeeeeiiiiooooouuuuc'
              ) LIKE :termo_texto
        ORDER BY m.nome_municipio, BTRIM(uf.sigla_uf), m.cod_municipio
        LIMIT :limite
        """,
        {
            "termo_codigo": termo_limpo,
            "termo_texto": f"%{_remover_acentos(termo_limpo.lower())}%",
            "limite": limite,
        },
    )
    return [MunicipioOficialItem(**dict(row)) for row in result.mappings().all()]


async def _validar_municipio_adicionado(
    db: AsyncSession,
    municipio: MunicipioRevisaoAlteracao,
) -> MunicipioOficialItem:
    if (
        municipio.origem_registro != "adicionado_tecnico"
        or municipio.acao_sugerida != "adicionar"
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                "Município incluído pelo técnico deve ter origem "
                "'adicionado_tecnico' e ação 'adicionar'."
            ),
        )

    result = await _execute_query(
        db,
        """
        SELECT
            m.cod_municipio,
            m.nome_municipio,
            m.cod_uf,
            BTRIM(uf.sigla_uf) AS sigla_uf,
            uf.nome_uf
        FROM territorio.tb_municipio AS m
        INNER JOIN territorio.tb_uf AS uf
          ON uf.cod_uf = m.cod_uf
        WHERE m.cod_municipio = :cod_municipio
        """,
        {"cod_municipio": municipio.cod_municipio},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Código de município inexistente no cadastro territorial oficial.",
        )
    return MunicipioOficialItem(**dict(row))


async def _validar_municipios_adicionados_no_instrumento(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
    municipios: list[MunicipioRevisaoItem | MunicipioRevisaoAlteracao],
) -> None:
    adicionados = [
        municipio
        for municipio in municipios
        if municipio.origem_registro == "adicionado_tecnico"
    ]
    if not adicionados:
        return

    codigos_base = {
        municipio.cod_municipio
        for municipio in await _buscar_municipios(db, instrumento)
    }
    repetido = next(
        (
            municipio.cod_municipio
            for municipio in adicionados
            if municipio.cod_municipio in codigos_base
        ),
        None,
    )
    if repetido is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="O município selecionado já pertence ao instrumento.",
        )


async def _carregar_revisao_salva(
    db: AsyncSession,
    id_revisao: int,
) -> tuple[dict[int, dict], list[dict], list[dict], dict[int, dict]]:
    municipios_result = await _execute_query(
        db,
        """
        SELECT
            rm.cod_municipio,
            m.nome_municipio AS nome,
            BTRIM(uf.sigla_uf) AS uf,
            rm.origem_registro,
            rm.acao_sugerida,
            rm.justificativa,
            rm.conferido_em,
            rm.valido_ate
        FROM painel_dsr.tb_revisao_instrumento_municipio AS rm
        JOIN territorio.tb_municipio AS m
          ON m.cod_municipio = rm.cod_municipio
        JOIN territorio.tb_uf AS uf
          ON uf.cod_uf = m.cod_uf
        WHERE rm.id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )

    localidades_result = await _execute_query(
        db,
        """
        SELECT
            rl.id_revisao_localidade,
            rl.cod_municipio,
            m.nome_municipio AS nome_municipio,
            BTRIM(uf.sigla_uf) AS uf,
            rl.cod_comunidade_rural,
            COALESCE(
                rl.nome_localidade_informada,
                to_jsonb(cr)->>'nome_comunidade_rural',
                to_jsonb(cr)->>'nome_localidade',
                to_jsonb(cr)->>'nome',
                to_jsonb(cr)->>'dsc_comunidade_rural'
            ) AS nome_localidade,
            rl.nome_localidade_informada,
            rl.origem_registro,
            rl.acao_sugerida,
            rl.qtde_familias_ben_original,
            rl.qtde_familias_ben_sugerida,
            rl.justificativa,
            rl.conferido_em,
            rl.valido_ate
        FROM painel_dsr.tb_revisao_instrumento_localidade AS rl
        LEFT JOIN territorio.tb_comunidade_rural AS cr
          ON cr.cod_comunidade_rural = rl.cod_comunidade_rural
        LEFT JOIN territorio.tb_municipio AS m
          ON m.cod_municipio = rl.cod_municipio
        LEFT JOIN territorio.tb_uf AS uf
          ON uf.cod_uf = m.cod_uf
        WHERE rl.id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )

    obras_result = await _execute_query(
        db,
        """
        SELECT
            ro.id_revisao_obra,
            ro.cod_municipio,
            m.nome_municipio AS nome_municipio,
            BTRIM(uf.sigla_uf) AS uf,
            ro.id_obra::text AS id_obra,
            ro.descricao,
            ro.orgao,
            ro.link_transferegov,
            ro.link_obrasgov,
            ro.relacao_instrumento,
            ro.confirmacao_status,
            ro.justificativa,
            ro.conferido_em,
            ro.valido_ate
        FROM painel_dsr.tb_revisao_obra_saneamento ro
        LEFT JOIN territorio.tb_municipio AS m
          ON m.cod_municipio = ro.cod_municipio
        LEFT JOIN territorio.tb_uf AS uf
          ON uf.cod_uf = m.cod_uf
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


def _revisao_corresponde_ao_identificador(revisao: dict, identificador: str) -> bool:
    esperado = identificador.strip()
    candidatos = {
        str(valor).strip()
        for valor in (
            revisao.get("identificador_busca"),
            revisao.get("nr_instrumento"),
            revisao.get("nr_proposta"),
            revisao.get("nr_ted"),
        )
        if valor is not None and str(valor).strip()
    }
    return esperado in candidatos


async def _buscar_detalhe_revisao_enviada(
    db: AsyncSession,
    identificador: str,
    id_revisao: int,
) -> RevisaoInstrumentoDetalheResponse:
    revisao_result = await _execute_query(
        db,
        """
        SELECT
            r.id_revisao,
            r.id_revisao_anterior,
            r.identificador_busca,
            r.tipo_instrumento,
            r.nr_instrumento,
            r.nr_proposta,
            r.nr_ted,
            r.status,
            r.observacao_geral,
            r.criado_em,
            r.atualizado_em,
            r.enviado_em,
            r.aplicado_em,
            r.base_referencia_em,
            u.id_usuario,
            u.nome AS usuario_nome
        FROM painel_dsr.tb_revisao_instrumento AS r
        JOIN painel_dsr.tb_usuario AS u
          ON u.id_usuario = r.id_usuario
        WHERE r.id_revisao = :id_revisao
        """,
        {"id_revisao": id_revisao},
    )
    revisao_row = revisao_result.mappings().one_or_none()
    if revisao_row is None:
        raise HTTPException(status_code=404, detail="Revisão não encontrada.")

    revisao = dict(revisao_row)
    if not _revisao_corresponde_ao_identificador(revisao, identificador):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A revisão informada não pertence a este instrumento.",
        )
    if revisao["status"] != "enviado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A revisão informada ainda não foi enviada.",
        )

    instrumento = None
    identificadores_consulta = (
        [revisao.get("nr_ted"), revisao.get("identificador_busca")]
        if revisao["tipo_instrumento"] == "ted"
        else [
            revisao.get("nr_instrumento"),
            revisao.get("nr_proposta"),
            revisao.get("identificador_busca"),
        ]
    )
    for candidato in identificadores_consulta:
        if candidato is None or not str(candidato).strip():
            continue
        if revisao["tipo_instrumento"] == "ted":
            instrumento = await _buscar_instrumento_ted(db, str(candidato).strip())
        else:
            instrumento = await _buscar_instrumento_carteira(
                db, str(candidato).strip()
            )
        if instrumento is not None:
            break

    if instrumento is None:
        instrumento = InstrumentoRevisaoInfo(
            identificador_busca=revisao["identificador_busca"] or identificador,
            tipo_instrumento=revisao["tipo_instrumento"],
            nr_instrumento=revisao["nr_instrumento"],
            nr_proposta=revisao["nr_proposta"],
            nr_ted=revisao["nr_ted"],
        )
    else:
        instrumento = instrumento.model_copy(
            update={
                "identificador_busca": revisao["identificador_busca"] or identificador,
                "tipo_instrumento": revisao["tipo_instrumento"],
                "nr_instrumento": revisao["nr_instrumento"],
                "nr_proposta": revisao["nr_proposta"],
                "nr_ted": revisao["nr_ted"],
            }
        )

    municipios_salvos, localidades_salvas, obras_salvas, _ = (
        await _carregar_revisao_salva(db, id_revisao)
    )
    codigos = {
        *municipios_salvos.keys(),
        *(item["cod_municipio"] for item in localidades_salvas),
        *(item["cod_municipio"] for item in obras_salvas),
    }
    municipios: list[MunicipioRevisaoItem] = []
    for codigo in sorted(codigos):
        salvo = municipios_salvos.get(codigo, {})
        item_descritivo = next(
            (
                item
                for item in [*localidades_salvas, *obras_salvas]
                if item["cod_municipio"] == codigo
            ),
            {},
        )
        localidades = [
            LocalidadeRevisaoItem(**item)
            for item in localidades_salvas
            if item["cod_municipio"] == codigo
        ]
        obras = [
            ObraSaneamentoRevisaoItem(**item)
            for item in obras_salvas
            if item["cod_municipio"] == codigo
        ]
        municipios.append(
            MunicipioRevisaoItem(
                cod_municipio=codigo,
                nome=salvo.get("nome") or item_descritivo.get("nome_municipio"),
                uf=salvo.get("uf") or item_descritivo.get("uf"),
                origem_registro=salvo.get("origem_registro", "base_atual"),
                acao_sugerida=salvo.get("acao_sugerida"),
                justificativa=salvo.get("justificativa"),
                conferido_em=salvo.get("conferido_em"),
                valido_ate=salvo.get("valido_ate"),
                localidades=localidades,
                obras_saneamento=obras,
            )
        )

    publico_result = await _execute_query(
        db,
        """
        SELECT
            rpa.id_revisao_publico_alvo,
            rpa.id_projeto_investimento::text AS id_projeto_investimento,
            :tipo_instrumento AS tipo_instrumento,
            COALESCE(:nr_instrumento, CAST(:nr_ted AS varchar)) AS nr_instrumento,
            COALESCE(
                NULLIF(BTRIM(to_jsonb(pi)->>'descricao'), ''),
                NULLIF(BTRIM(to_jsonb(pi)->>'nome_obra'), ''),
                NULLIF(BTRIM(to_jsonb(pi)->>'nome_projeto'), ''),
                NULLIF(BTRIM(to_jsonb(pi)->>'objeto'), '')
            ) AS nome_obra,
            rpa.populacao_beneficiada_original,
            rpa.desc_populacao_beneficiada_original,
            rpa.populacao_beneficiada_revisada,
            rpa.desc_populacao_beneficiada_revisada,
            rpa.conferido_em,
            rpa.valido_ate
        FROM painel_dsr.tb_revisao_instrumento_publico_alvo AS rpa
        LEFT JOIN LATERAL (
            SELECT projeto.*
            FROM obrasgov.tb_projeto_investimento AS projeto
            WHERE projeto.id_unico::text = rpa.id_projeto_investimento::text
            LIMIT 1
        ) AS pi ON TRUE
        WHERE rpa.id_revisao = :id_revisao
        ORDER BY rpa.id_revisao_publico_alvo
        """,
        {
            "id_revisao": id_revisao,
            "tipo_instrumento": revisao["tipo_instrumento"],
            "nr_instrumento": revisao["nr_instrumento"],
            "nr_ted": revisao["nr_ted"],
        },
    )
    publico_alvo = [
        PublicoAlvoRevisaoItem(**dict(row))
        for row in publico_result.mappings().all()
    ]

    return RevisaoInstrumentoDetalheResponse(
        **{
            campo: revisao[campo]
            for campo in (
                "id_revisao",
                "id_revisao_anterior",
                "status",
                "observacao_geral",
                "criado_em",
                "atualizado_em",
                "enviado_em",
                "aplicado_em",
                "base_referencia_em",
                "identificador_busca",
            )
        },
        instrumento=instrumento,
        usuario=UsuarioRevisaoInfo(
            id_usuario=revisao["id_usuario"],
            nome=revisao["usuario_nome"],
        ),
        municipios=municipios,
        publico_alvo=publico_alvo,
    )


async def _listar_historico_revisoes(
    db: AsyncSession,
    *,
    pagina: int,
    limite: int,
    id_usuario: int | None = None,
    instrumento: InstrumentoRevisaoInfo | None = None,
    busca: str | None = None,
) -> HistoricoRevisoesResponse:
    filtros = ["r.status = 'enviado'", "r.enviado_em IS NOT NULL"]
    params: dict = {"limite": limite, "offset": (pagina - 1) * limite}

    if id_usuario is not None:
        filtros.append("r.id_usuario = :id_usuario")
        params["id_usuario"] = id_usuario

    if instrumento is not None:
        filtros.extend(
            [
                "r.tipo_instrumento = :tipo_instrumento",
                """(
                    (:tipo_instrumento = 'ted' AND r.nr_ted = :nr_ted)
                    OR (:tipo_instrumento <> 'ted' AND
                        NULLIF(BTRIM(r.nr_instrumento), '') =
                        NULLIF(BTRIM(:nr_instrumento), ''))
                )""",
            ]
        )
        params.update(
            {
                "tipo_instrumento": instrumento.tipo_instrumento,
                "nr_instrumento": instrumento.nr_instrumento,
                "nr_ted": instrumento.nr_ted,
            }
        )

    busca_limpa = (busca or "").strip()
    if busca_limpa:
        filtros.append(
            """(
                CAST(r.id_revisao AS varchar) ILIKE :busca
                OR COALESCE(r.nr_instrumento, '') ILIKE :busca
                OR COALESCE(CAST(r.nr_ted AS varchar), '') ILIKE :busca
                OR COALESCE(r.nr_proposta, '') ILIKE :busca
                OR COALESCE(r.identificador_busca, '') ILIKE :busca
            )"""
        )
        params["busca"] = f"%{busca_limpa}%"

    clausula_where = " AND ".join(filtros)
    total_result = await _execute_query(
        db,
        f"""
        SELECT COUNT(*)
        FROM painel_dsr.tb_revisao_instrumento AS r
        WHERE {clausula_where}
        """,
        params,
    )
    total = int(total_result.scalar_one())

    itens_result = await _execute_query(
        db,
        f"""
        SELECT
            r.id_revisao,
            r.id_revisao_anterior,
            r.identificador_busca,
            r.tipo_instrumento,
            r.nr_instrumento,
            r.nr_proposta,
            r.nr_ted,
            COALESCE(
                carteira.objeto,
                NULLIF(BTRIM(ted.dados->>'objeto'), ''),
                NULLIF(BTRIM(ted.dados->>'descricao'), ''),
                NULLIF(BTRIM(ted.dados->>'objeto_ted'), '')
            ) AS objeto,
            r.status,
            r.criado_em,
            r.atualizado_em,
            r.enviado_em,
            r.aplicado_em,
            u.id_usuario,
            u.nome AS usuario_nome
        FROM painel_dsr.tb_revisao_instrumento AS r
        JOIN painel_dsr.tb_usuario AS u ON u.id_usuario = r.id_usuario
        LEFT JOIN LATERAL (
            SELECT v.objeto
            FROM instrumento.vw_carteira_dsr AS v
            WHERE r.tipo_instrumento <> 'ted'
              AND (
                    v.nr_instrumento::text = r.nr_instrumento
                    OR v.nr_proposta::text = r.nr_proposta
              )
            LIMIT 1
        ) AS carteira ON TRUE
        LEFT JOIN LATERAL (
            SELECT to_jsonb(t) AS dados
            FROM instrumento.tb_ted AS t
            WHERE r.tipo_instrumento = 'ted' AND t.nr_ted = r.nr_ted
            LIMIT 1
        ) AS ted ON TRUE
        WHERE {clausula_where}
        ORDER BY r.enviado_em DESC, r.id_revisao DESC
        LIMIT :limite OFFSET :offset
        """,
        params,
    )

    itens = []
    for row in itens_result.mappings().all():
        dados = dict(row)
        aplicado_em = dados["aplicado_em"]
        itens.append(
            RevisaoHistoricoItem(
                **{
                    campo: dados[campo]
                    for campo in (
                        "id_revisao",
                        "id_revisao_anterior",
                        "identificador_busca",
                        "tipo_instrumento",
                        "nr_instrumento",
                        "nr_proposta",
                        "nr_ted",
                        "status",
                        "criado_em",
                        "atualizado_em",
                        "enviado_em",
                        "aplicado_em",
                    )
                },
                objeto=dados.get("objeto") or (instrumento.objeto if instrumento else None),
                status_label=_label_status_historico(aplicado_em),
                usuario=UsuarioRevisaoInfo(
                    id_usuario=dados["id_usuario"],
                    nome=dados["usuario_nome"],
                ),
            )
        )

    return HistoricoRevisoesResponse(
        data=itens,
        pagina=pagina,
        limite=limite,
        total=total,
        total_paginas=(total + limite - 1) // limite,
        instrumento=instrumento,
    )


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
        conferido_em=datas.get("revisao_municipio_conferida_em"),
        valido_ate=datas.get("revisao_municipio_valido_ate"),
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
    if municipio is None and any(
        localidade.origem_registro == "adicionado_tecnico"
        for localidade in localidades
    ):
        await _validar_municipio_adicionado(
            db,
            MunicipioRevisaoAlteracao(
                cod_municipio=cod_municipio,
                origem_registro="adicionado_tecnico",
                acao_sugerida="adicionar",
            ),
        )
    if municipio is not None:
        if municipio.origem_registro == "adicionado_tecnico":
            oficial = await _validar_municipio_adicionado(db, municipio)
            municipio = municipio.model_copy(
                update={
                    "nome": oficial.nome_municipio,
                    "uf": oficial.sigla_uf,
                }
            )
        update_result = await db.execute(
            text(
                """
                UPDATE painel_dsr.tb_revisao_instrumento_municipio
                SET
                    origem_registro = :origem_registro,
                    acao_sugerida = :acao_sugerida,
                    justificativa = :justificativa,
                    conferido_em = NOW(),
                    valido_ate = NOW() + make_interval(days => COALESCE((SELECT validade_dias FROM painel_dsr.tb_revisao_instrumento WHERE id_revisao = :id_revisao), 0)),
                    atualizado_em = NOW()
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
                        justificativa,
                        conferido_em,
                        valido_ate,
                        atualizado_em
                    )
                    VALUES (
                        :id_revisao,
                        :cod_municipio,
                        :origem_registro,
                        :acao_sugerida,
                        :justificativa,
                        NOW(),
                        NOW() + make_interval(days => COALESCE((SELECT validade_dias FROM painel_dsr.tb_revisao_instrumento WHERE id_revisao = :id_revisao), 0)),
                        NOW()
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
        if cod_localidade_municipio != cod_municipio:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="A localidade deve pertencer ao município que está sendo salvo.",
            )
        if localidade.origem_registro == "adicionado_tecnico" and (
            localidade.cod_comunidade_rural is not None
            or localidade.acao_sugerida != "adicionar"
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=(
                    "Localidade informada manualmente deve usar ação 'adicionar' "
                    "e não pode indicar comunidade rural cadastrada."
                ),
            )
        nome_informado = (
            localidade.nome_localidade_informada
            or (
                localidade.nome_localidade
                if localidade.origem_registro == "adicionado_tecnico"
                else None
            )
        )
        if localidade.origem_registro == "adicionado_tecnico":
            nome_informado = " ".join((nome_informado or "").split()) or None
            if nome_informado is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Informe o nome da localidade adicionada.",
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

    validade_sql = """
        NOW() + make_interval(days => COALESCE((
            SELECT validade_dias
            FROM painel_dsr.tb_revisao_instrumento
            WHERE id_revisao = :id_revisao
        ), 0))
    """
    if municipio is not None and municipio.acao_sugerida is not None:
        await db.execute(
            text(f"""
                UPDATE painel_dsr.tb_revisao_instrumento_municipio
                SET conferido_em = NOW(), valido_ate = {validade_sql}, atualizado_em = NOW()
                WHERE id_revisao = :id_revisao AND cod_municipio = :cod_municipio
            """),
            {"id_revisao": id_revisao, "cod_municipio": cod_municipio},
        )
    for localidade_salva in localidades_salvas:
        await db.execute(
            text(f"""
                UPDATE painel_dsr.tb_revisao_instrumento_localidade
                SET conferido_em = NOW(), valido_ate = {validade_sql}, atualizado_em = NOW()
                WHERE id_revisao = :id_revisao
                  AND id_revisao_localidade = :id_revisao_localidade
            """),
            {"id_revisao": id_revisao, "id_revisao_localidade": localidade_salva.id_revisao_localidade},
        )
    for obra_salva in obras_salvas:
        await db.execute(
            text(f"""
                UPDATE painel_dsr.tb_revisao_obra_saneamento
                SET conferido_em = NOW(), valido_ate = {validade_sql}, atualizado_em = NOW()
                WHERE id_revisao = :id_revisao
                  AND id_revisao_obra = :id_revisao_obra
                  AND relacao_instrumento <> 'nao_analisada'
            """),
            {"id_revisao": id_revisao, "id_revisao_obra": obra_salva.id_revisao_obra},
        )

    if localidades_salvas:
        result = await db.execute(
            text("""
                SELECT id_revisao_localidade, conferido_em, valido_ate
                FROM painel_dsr.tb_revisao_instrumento_localidade
                WHERE id_revisao = :id_revisao
                  AND id_revisao_localidade IN :ids
            """).bindparams(bindparam("ids", expanding=True)),
            {"id_revisao": id_revisao, "ids": [item.id_revisao_localidade for item in localidades_salvas]},
        )
        datas_localidades = {
            row["id_revisao_localidade"]: row for row in result.mappings().all()
        }
        localidades_salvas = [
            item.model_copy(update={
                "conferido_em": datas_localidades[item.id_revisao_localidade]["conferido_em"],
                "valido_ate": datas_localidades[item.id_revisao_localidade]["valido_ate"],
            })
            for item in localidades_salvas
        ]

    if obras_salvas:
        result = await db.execute(
            text("""
                SELECT id_revisao_obra, conferido_em, valido_ate
                FROM painel_dsr.tb_revisao_obra_saneamento
                WHERE id_revisao = :id_revisao
                  AND id_revisao_obra IN :ids
            """).bindparams(bindparam("ids", expanding=True)),
            {"id_revisao": id_revisao, "ids": [item.id_revisao_obra for item in obras_salvas]},
        )
        datas_obras = {row["id_revisao_obra"]: row for row in result.mappings().all()}
        obras_salvas = [
            item.model_copy(update={
                "conferido_em": datas_obras[item.id_revisao_obra]["conferido_em"],
                "valido_ate": datas_obras[item.id_revisao_obra]["valido_ate"],
            })
            for item in obras_salvas
        ]

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
        populacao_enviada = (
            "populacao_beneficiada_revisada" in campos_enviados
            and item.populacao_beneficiada_revisada is not None
        )
        desc_enviada = (
            "desc_populacao_beneficiada_revisada" in campos_enviados
            and item.desc_populacao_beneficiada_revisada is not None
        )

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
                    valido_ate,
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
                    NOW() + make_interval(days => COALESCE((
                        SELECT validade_dias FROM painel_dsr.tb_revisao_instrumento
                        WHERE id_revisao = :id_revisao
                    ), 0)),
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
                    valido_ate = NOW() + make_interval(days => COALESCE((
                        SELECT validade_dias FROM painel_dsr.tb_revisao_instrumento
                        WHERE id_revisao = :id_revisao
                    ), 0)),
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
    possui_permissao_edicao = await pode_editar_instrumento(
        db, usuario_atual, instrumento
    )
    (
        situacao_atualizacao,
        revisao,
        ultima_revisao_usuario,
        revisao_pendente_aplicacao,
        quantidade_revisoes_pendentes,
        situacao_colaborativa,
    ) = await _buscar_situacoes_revisao(db, instrumento, usuario_atual.id_usuario)
    rascunho_global = (
        _rascunho_para_contrato(revisao, usuario_atual.id_usuario)
        if revisao
        else None
    )
    eh_autor_rascunho = bool(rascunho_global and rascunho_global["eh_autor"])
    pode_editar_revisao = possui_permissao_edicao and (
        revisao is None or eh_autor_rascunho
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
                nome=municipio_salvo["nome"],
                uf=municipio_salvo["uf"],
                origem_registro=municipio_salvo["origem_registro"],
                acao_sugerida=municipio_salvo["acao_sugerida"],
                justificativa=municipio_salvo["justificativa"],
                conferido_em=municipio_salvo["conferido_em"],
                valido_ate=municipio_salvo["valido_ate"],
                localidades=[],
                obras_saneamento=[],
            )
            municipios.append(municipio)
            municipios_por_codigo[cod_municipio] = municipio
        else:
            municipio.origem_registro = municipio_salvo["origem_registro"]
            municipio.acao_sugerida = municipio_salvo["acao_sugerida"]
            municipio.justificativa = municipio_salvo["justificativa"]
            municipio.conferido_em = municipio_salvo["conferido_em"]
            municipio.valido_ate = municipio_salvo["valido_ate"]

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
            nome_localidade=localidade_salva["nome_localidade"],
            nome_localidade_informada=localidade_salva["nome_localidade_informada"],
            origem_registro=localidade_salva["origem_registro"],
            acao_sugerida=localidade_salva["acao_sugerida"],
            qtde_familias_ben_original=localidade_salva["qtde_familias_ben_original"],
            qtde_familias_ben_sugerida=localidade_salva["qtde_familias_ben_sugerida"],
            justificativa=localidade_salva["justificativa"],
            conferido_em=localidade_salva["conferido_em"],
            valido_ate=localidade_salva["valido_ate"],
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
                    "conferido_em": item_salvo.conferido_em,
                    "valido_ate": item_salvo.valido_ate,
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
            conferido_em=obra_salva["conferido_em"],
            valido_ate=obra_salva["valido_ate"],
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
                    "conferido_em": item_salvo.conferido_em,
                    "valido_ate": item_salvo.valido_ate,
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
    completude = calcular_completude(municipios, publico_alvo)

    return RevisaoInstrumentoBuscaResponse(
        id_revisao=id_revisao,
        identificador_busca=instrumento.identificador_busca,
        instrumento=instrumento,
        pode_editar=possui_permissao_edicao,
        pode_editar_revisao=pode_editar_revisao,
        status=revisao["status"] if revisao else None,
        status_revisao_geral=status_revisao_geral,
        status_revisao_geral_label=status_revisao_geral_label,
        observacao_geral=revisao["observacao_geral"] if revisao else None,
        municipios=municipios,
        publico_alvo=publico_alvo,
        dados_oficiais=instrumento.dados_oficiais,
        rascunho_global=rascunho_global,
        rascunho_usuario=(
            rascunho_global if eh_autor_rascunho else None
        ),
        revisao_pendente_aplicacao=revisao_pendente_aplicacao,
        quantidade_revisoes_pendentes=quantidade_revisoes_pendentes,
        ultima_revisao_usuario=ultima_revisao_usuario,
        situacao_atualizacao=situacao_atualizacao,
        situacao_colaborativa=situacao_colaborativa,
        completude=completude,
    )


@router.get(
    "/meus-instrumentos",
    response_model=MeusInstrumentosRevisaoResponse,
    summary="Lista instrumentos atribuídos ao monitoramento do usuário autenticado",
)
async def listar_meus_instrumentos(
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    return MeusInstrumentosRevisaoResponse(
        data=await _buscar_meus_instrumentos(db, usuario_atual)
    )


@router.get(
    "/municipios-oficiais",
    response_model=list[MunicipioOficialItem],
    summary="Busca municípios no cadastro territorial oficial",
)
async def listar_municipios_oficiais(
    q: Annotated[str, Query(min_length=2, max_length=100)],
    limite: Annotated[int, Query(ge=1, le=50)] = 20,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    del usuario_atual
    return await _buscar_municipios_oficiais(db, q, limite)


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


@router.get(
    "/revisoes/minhas",
    response_model=HistoricoRevisoesResponse,
    summary="Lista revisões enviadas pelo usuário autenticado",
)
async def listar_minhas_revisoes(
    busca: Annotated[str | None, Query(max_length=100)] = None,
    pagina: Annotated[int, Query(ge=1, alias="page")] = 1,
    limite: Annotated[int, Query(ge=1, le=100, alias="limit")] = 20,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    return await _listar_historico_revisoes(
        db,
        pagina=pagina,
        limite=limite,
        id_usuario=usuario_atual.id_usuario,
        busca=busca,
    )


@router.get(
    "/instrumentos/{identificador}/revisoes",
    response_model=HistoricoRevisoesResponse,
    summary="Lista revisões enviadas de um instrumento",
)
async def listar_revisoes_do_instrumento(
    identificador: str,
    pagina: Annotated[int, Query(ge=1, alias="page")] = 1,
    limite: Annotated[int, Query(ge=1, le=100, alias="limit")] = 20,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    del usuario_atual
    identificador_limpo = identificador.strip()
    instrumento = await _buscar_instrumento_carteira(db, identificador_limpo)
    if instrumento is None:
        instrumento = await _buscar_instrumento_ted(db, identificador_limpo)
    if instrumento is None:
        raise HTTPException(
            status_code=404,
            detail="Instrumento, proposta ou TED não encontrado nas bases oficiais.",
        )
    return await _listar_historico_revisoes(
        db,
        pagina=pagina,
        limite=limite,
        instrumento=instrumento,
    )


@router.get(
    "/instrumentos/{identificador}/revisoes/{id_revisao}",
    response_model=RevisaoInstrumentoDetalheResponse,
    summary="Consulta uma revisão enviada específica em modo somente leitura",
)
async def consultar_revisao_enviada(
    identificador: str,
    id_revisao: int,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    del usuario_atual
    return await _buscar_detalhe_revisao_enviada(
        db,
        identificador.strip(),
        id_revisao,
    )


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
    await exigir_permissao_edicao(db, usuario_atual, instrumento)

    try:
        await _validar_municipios_adicionados_no_instrumento(
            db, instrumento, payload.municipios
        )
        db.info["grupo_salvamento_revisao"] = "revisao"
        revisao = await _obter_ou_criar_revisao(
            db,
            instrumento,
            usuario_atual.id_usuario,
            id_revisao=payload.id_revisao,
            # O rascunho só muda para enviado depois da completude ser
            # recalculada dentro desta mesma transação.
            status_revisao="rascunho",
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

        if payload.observacao_geral and not resposta_atualizada.completude["possui_manifestacao"]:
            resposta_atualizada = resposta_atualizada.model_copy(
                update={
                    "completude": {
                        **resposta_atualizada.completude,
                        "possui_manifestacao": True,
                    }
                }
            )

        if payload.status == "enviado" and not resposta_atualizada.completude["possui_manifestacao"] and not payload.observacao_geral:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "mensagem": "Registre ao menos uma alteração ou decisão antes de enviar a revisão.",
                    "completude": resposta_atualizada.completude,
                },
            )

        status_retorno = "rascunho"
        if payload.status == "enviado":
            enviado_result = await db.execute(
                text(
                    """
                    UPDATE painel_dsr.tb_revisao_instrumento
                    SET status = 'enviado', enviado_em = NOW(), atualizado_em = NOW()
                    WHERE id_revisao = :id_revisao
                      AND id_usuario = :id_usuario
                      AND status = 'rascunho'
                    RETURNING enviado_em, atualizado_em
                    """
                ),
                {"id_revisao": id_revisao, "id_usuario": usuario_atual.id_usuario},
            )
            enviado = enviado_result.mappings().one_or_none()
            if enviado is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A revisão já foi enviada e é somente leitura.",
                )
            revisao = {**revisao, "status": "enviado", **dict(enviado)}
            status_retorno = "enviado"

        await db.commit()

        return RevisaoInstrumentoSalvoResponse(
            id_revisao=id_revisao,
            status=status_retorno,
            status_revisao_geral=resposta_atualizada.status_revisao_geral,
            status_revisao_geral_label=resposta_atualizada.status_revisao_geral_label,
            mensagem="Revisão salva com sucesso.",
            criado_em=revisao["criado_em"],
            atualizado_em=revisao["atualizado_em"],
            enviado_em=revisao["enviado_em"],
            municipios=municipios_salvos,
            publico_alvo=publico_alvo_salvo,
            completude=resposta_atualizada.completude,
        )

    except HTTPException as exc:
        await db.rollback()
        logger.warning(
            "Revisão de instrumento rejeitada: http_status=%s grupo=%s "
            "id_revisao=%s status_solicitado=%s qtd_municipios=%s qtd_publico_alvo=%s",
            exc.status_code,
            db.info.get("grupo_salvamento_revisao", "revisao"),
            payload.id_revisao,
            payload.status,
            len(payload.municipios),
            len(payload.publico_alvo),
        )
        raise

    except SQLAlchemyError as exc:
        await db.rollback()
        if (
            "uq_revisao_rascunho_instrumento" in str(exc)
            or "duplicate key" in str(exc).lower()
        ):
            draft = await _buscar_rascunho_global(db, instrumento)
            if draft is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=_detalhe_conflito_rascunho(
                        _rascunho_para_contrato(draft, usuario_atual.id_usuario)
                    ),
                ) from exc
        logger.exception(
            "Erro ao salvar revisão de instrumento: tipo_excecao=%s grupo=%s "
            "id_revisao=%s status_solicitado=%s qtd_municipios=%s "
            "qtd_publico_alvo=%s",
            type(exc).__name__,
            db.info.get("grupo_salvamento_revisao", "revisao"),
            payload.id_revisao,
            payload.status,
            len(payload.municipios),
            len(payload.publico_alvo),
        )
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao salvar a revisão de instrumento.",
        )

    except Exception as exc:
        await db.rollback()
        logger.exception(
            "Erro inesperado ao salvar revisão de instrumento: "
            "tipo_excecao=%s grupo=%s id_revisao=%s status_solicitado=%s "
            "qtd_municipios=%s qtd_publico_alvo=%s",
            type(exc).__name__,
            db.info.get("grupo_salvamento_revisao", "revisao"),
            payload.id_revisao,
            payload.status,
            len(payload.municipios),
            len(payload.publico_alvo),
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
    await exigir_permissao_edicao(db, usuario_atual, payload.instrumento)
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
        if payload.municipio is not None:
            await _validar_municipios_adicionados_no_instrumento(
                db, payload.instrumento, [payload.municipio]
            )
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
        if (
            "uq_revisao_rascunho_instrumento" in str(exc)
            or "duplicate key" in str(exc).lower()
        ):
            draft = await _buscar_rascunho_global(db, payload.instrumento)
            if draft is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=_detalhe_conflito_rascunho(
                        _rascunho_para_contrato(draft, usuario_atual.id_usuario)
                    ),
                ) from exc
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
