"""Agregação das coordenadas oficiais e de sua análise vigente."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def resumir_coordenadas_instrumentos(
    db: AsyncSession, identificadores: list[str]
) -> dict[str, dict[str, int]]:
    if not identificadores:
        return {}
    result = await db.execute(
        text(
            """
            WITH ultima_analise AS (
                SELECT DISTINCT ON (rc.id_coordenada)
                       rc.id_coordenada, rc.situacao_analise
                FROM painel_dsr.tb_revisao_instrumento_coordenada rc
                ORDER BY rc.id_coordenada, rc.criado_em DESC,
                         rc.id_revisao_coordenada DESC
            )
            SELECT geo.nr_instrumento::text AS nr_instrumento,
                   geo.nr_proposta::text AS nr_proposta,
                   geo.cod_tci::text AS cod_tci,
                   COUNT(DISTINCT geo.id_coordenada) AS total,
                   COUNT(DISTINCT geo.id_coordenada) FILTER (
                       WHERE ua.id_coordenada IS NULL
                          OR ua.situacao_analise = 'Sem análise'
                   ) AS pendentes
            FROM instrumento.vw_geometrias_carteira_dsr geo
            LEFT JOIN ultima_analise ua ON ua.id_coordenada = geo.id_coordenada
            WHERE geo.nr_instrumento::text = ANY(CAST(:identificadores AS text[]))
               OR geo.nr_proposta::text = ANY(CAST(:identificadores AS text[]))
               OR geo.cod_tci::text = ANY(CAST(:identificadores AS text[]))
            GROUP BY geo.nr_instrumento, geo.nr_proposta, geo.cod_tci
            """
        ),
        {"identificadores": identificadores},
    )
    totais: dict[str, dict[str, int]] = {}
    for row in result.mappings().all():
        for chave in {row["nr_instrumento"], row["nr_proposta"], row["cod_tci"]}:
            if not chave:
                continue
            atual = totais.setdefault(str(chave), {"total": 0, "pendentes": 0})
            atual["total"] += int(row["total"] or 0)
            atual["pendentes"] += int(row["pendentes"] or 0)
    return totais
