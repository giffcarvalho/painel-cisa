"""Endpoints da revisão de instrumentos DSR."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import bindparam, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import obter_usuario_atual
from app.core.database import get_db
from app.schemas.auth import UsuarioAutenticado
from app.schemas.revisao_instrumento import (
    InstrumentoRevisaoInfo,
    LocalidadeRevisaoItem,
    MunicipioRevisaoItem,
    ObraSaneamentoRevisaoItem,
    RevisaoInstrumentoBuscaResponse,
    RevisaoInstrumentoCreate,
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


async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None):
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as exc:
        logger.exception("Erro no banco de dados da revisão de instrumento: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao consultar dados da revisão de instrumento.",
        )


def _normalizar_tipo(tipo_view: str | None, tipo_por_tabela: str | None) -> str | None:
    if tipo_por_tabela:
        return tipo_por_tabela

    texto = (tipo_view or "").lower()

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
            v.tipo_instrumento,
            v.operacao::text AS tipo_obra,
            v.objeto,
            v.nome_proponente,
            v.uf,
            v.situacao_atual,
            v.link_transferegov,
            to_jsonb(v)->>'link_saci' AS link_saci,
            CASE
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

    return InstrumentoRevisaoInfo(
        identificador_busca=identificador,
        tipo_instrumento=tipo,
        nr_instrumento=row.get("nr_instrumento"),
        nr_proposta=row.get("nr_proposta"),
        nr_ted=None,
        tipo_obra=row.get("tipo_obra"),
        objeto=row.get("objeto"),
        nome_proponente=row.get("nome_proponente"),
        orgao=row.get("nome_proponente"),
        uf=row.get("uf"),
        situacao_atual=row.get("situacao_atual"),
        link_transferegov=row.get("link_transferegov"),
        link_saci=row.get("link_saci"),
        dados_oficiais={
            "fonte": "instrumento.vw_carteira_dsr",
            "tipo_instrumento_original": row.get("tipo_instrumento"),
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
            acao_sugerida="manter",
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
            acao_sugerida="manter",
            qtde_familias_ben_original=row["qtde_familias_ben"],
            qtde_familias_ben_sugerida=row["qtde_familias_ben"],
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
            id::text AS id_obra,
            cod_municipio,
            descricao,
            orgao,
            link_transferegov,
            link_obrasgov
        FROM instrumento.vw_investimento_saneamento
        WHERE cod_municipio IN :cod_municipios
        ORDER BY cod_municipio, orgao NULLS LAST, id
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
            confirmacao_status=None,
        )
        for row in result.mappings().all()
    ]


async def _montar_resposta_busca(
    db: AsyncSession,
    instrumento: InstrumentoRevisaoInfo,
) -> RevisaoInstrumentoBuscaResponse:
    municipios = await _buscar_municipios(db, instrumento)
    municipios_por_codigo = {item.cod_municipio: item for item in municipios}

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
                acao_sugerida="manter",
                localidades=[],
                obras_saneamento=[],
            )
            municipios.append(municipio)
            municipios_por_codigo[localidade.cod_municipio] = municipio

        municipio.localidades.append(localidade)

    obras = await _buscar_obras_saneamento(
        db,
        [municipio.cod_municipio for municipio in municipios],
    )

    for obra in obras:
        municipio = municipios_por_codigo.get(obra.cod_municipio)

        if municipio is not None:
            municipio.obras_saneamento.append(obra)

    return RevisaoInstrumentoBuscaResponse(
        identificador_busca=instrumento.identificador_busca,
        instrumento=instrumento,
        municipios=municipios,
    )


@router.get(
    "/instrumentos",
    response_model=RevisaoInstrumentoBuscaResponse,
    summary="Busca instrumento para revisão",
)
async def buscar_instrumento_para_revisao(
    identificador: Annotated[str, Query(min_length=1, max_length=100)],
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

    return await _montar_resposta_busca(db, instrumento)


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
        revisao_result = await db.execute(
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
                    :status,
                    :observacao_geral,
                    CASE WHEN :status = 'enviado' THEN NOW() ELSE NULL END
                )
                RETURNING
                    id_revisao,
                    status,
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
                "id_usuario": usuario_atual.id_usuario,
                "status": payload.status,
                "observacao_geral": payload.observacao_geral,
            },
        )

        revisao = revisao_result.mappings().one()
        id_revisao = revisao["id_revisao"]
        municipios_salvos = []
        
        for municipio in payload.municipios:
            municipio_result = await db.execute(
                text(
                    """
                    INSERT INTO painel_dsr.tb_revisao_instrumento_municipio (
                        id_revisao,
                        cod_municipio,
                        origem_registro,
                        acao_sugerida,
                        justificativa,
                        revisao_municipio_conferida_em,
                        localidades_conferidas_em,
                        obras_conferidas_em
                    )
                    VALUES (
                        :id_revisao,
                        :cod_municipio,
                        :origem_registro,
                        :acao_sugerida,
                        :justificativa,
                        CASE
                            WHEN :revisao_municipio_alterada THEN NOW()
                            ELSE :revisao_municipio_conferida_em
                        END,
                        CASE
                            WHEN :localidades_alteradas THEN NOW()
                            ELSE :localidades_conferidas_em
                        END,
                        CASE
                            WHEN :obras_alteradas THEN NOW()
                            ELSE :obras_conferidas_em
                        END
                    )
                    RETURNING
                        revisao_municipio_conferida_em,
                        localidades_conferidas_em,
                        obras_conferidas_em
                    """
                ),
                {
                    "id_revisao": id_revisao,
                    "cod_municipio": municipio.cod_municipio,
                    "origem_registro": municipio.origem_registro,
                    "acao_sugerida": municipio.acao_sugerida,
                    "justificativa": municipio.justificativa,
                    "revisao_municipio_conferida_em": municipio.revisao_municipio_conferida_em,
                    "localidades_conferidas_em": municipio.localidades_conferidas_em,
                    "obras_conferidas_em": municipio.obras_conferidas_em,
                    "revisao_municipio_alterada": municipio.revisao_municipio_alterada,
                    "localidades_alteradas": municipio.localidades_alteradas,
                    "obras_alteradas": municipio.obras_alteradas,
                },
            )

            municipio_datas = municipio_result.mappings().one()
            municipios_salvos.append(
                municipio.model_copy(
                    update={
                        "revisao_municipio_conferida_em": municipio_datas[
                            "revisao_municipio_conferida_em"
                        ],
                        "localidades_conferidas_em": municipio_datas[
                            "localidades_conferidas_em"
                        ],
                        "obras_conferidas_em": municipio_datas["obras_conferidas_em"],
                        "revisao_municipio_alterada": False,
                        "localidades_alteradas": False,
                        "obras_alteradas": False,
                    }
                )
            )

            for localidade in municipio.localidades:
                cod_municipio = localidade.cod_municipio or municipio.cod_municipio

                await db.execute(
                    text(
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
                        """
                    ),
                    {
                        "id_revisao": id_revisao,
                        "cod_municipio": cod_municipio,
                        "cod_comunidade_rural": localidade.cod_comunidade_rural,
                        "nome_localidade_informada": localidade.nome_localidade_informada,
                        "origem_registro": localidade.origem_registro,
                        "acao_sugerida": localidade.acao_sugerida,
                        "qtde_familias_ben_original": localidade.qtde_familias_ben_original,
                        "qtde_familias_ben_sugerida": localidade.qtde_familias_ben_sugerida,
                        "justificativa": localidade.justificativa,
                    },
                )

            for obra in municipio.obras_saneamento:
                await db.execute(
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
                        """
                    ),
                    {
                        "id_revisao": id_revisao,
                        "cod_municipio": obra.cod_municipio or municipio.cod_municipio,
                        "id_obra": obra.id_obra,
                        "descricao": obra.descricao,
                        "orgao": obra.orgao,
                        "link_transferegov": obra.link_transferegov,
                        "link_obrasgov": obra.link_obrasgov,
                        "relacao_instrumento": obra.relacao_instrumento,
                        "confirmacao_status": obra.confirmacao_status,
                        "justificativa": obra.justificativa,
                    },
                )

        await db.commit()

        return RevisaoInstrumentoSalvoResponse(
            id_revisao=id_revisao,
            status=revisao["status"],
            mensagem="Revisão salva com sucesso.",
            criado_em=revisao["criado_em"],
            atualizado_em=revisao["atualizado_em"],
            enviado_em=revisao["enviado_em"],
            municipios=municipios_salvos,
        )

    except SQLAlchemyError as exc:
        await db.rollback()
        logger.exception("Erro ao salvar revisão de instrumento: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao salvar a revisão de instrumento.",
        )