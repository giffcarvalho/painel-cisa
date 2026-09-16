"""Dados operacionais pessoais do técnico."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import obter_usuario_atual
from app.api.revisao_instrumento import (
    _buscar_instrumento_carteira,
    _buscar_instrumento_ted,
    _buscar_meus_instrumentos,
    _montar_resposta_busca,
)
from app.core.database import get_db
from app.schemas.auth import UsuarioAutenticado
from app.schemas.meu_painel import (
    InstrumentoPendenteItem,
    MeuPainelResponse,
    PendenciasPorGrupo,
    RascunhoMeuPainelItem,
    ResumoAlteracoesRascunho,
    ResumoMeuPainel,
)
from app.services.pendencias_coordenadas import resumir_coordenadas_instrumentos


router = APIRouter()

TIPO_LABELS = {
    "contrato_repasse": "Contrato de Repasse",
    "termo_compromisso": "Termo de Compromisso",
    "ted": "TED",
}


def _identificador(item) -> str:
    if item.tipo_instrumento == "ted":
        return str(item.nr_ted)
    return str(item.nr_instrumento or item.nr_proposta)


async def _listar_rascunhos(
    db: AsyncSession, id_usuario: int, *, limite: int, offset: int
) -> list[RascunhoMeuPainelItem]:
    result = await db.execute(
        text(
            """
            SELECT r.id_revisao, r.identificador_busca, r.tipo_instrumento,
                   r.nr_instrumento, r.nr_proposta, r.nr_ted,
                   r.criado_em, r.atualizado_em,
                   COALESCE(m.total, 0) AS municipios,
                   COALESCE(l.total, 0) AS localidades,
                   COALESCE(c.total, 0) AS coordenadas,
                   COALESCE(p.total, 0) AS publico_alvo,
                   COALESCE(o.total, 0) AS obras,
                   (NULLIF(BTRIM(r.observacao_geral), '') IS NOT NULL) AS observacao_geral
            FROM painel_dsr.tb_revisao_instrumento r
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM painel_dsr.tb_revisao_instrumento_coordenada x
                WHERE x.id_revisao = r.id_revisao
            ) c ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM painel_dsr.tb_revisao_instrumento_municipio x
                WHERE x.id_revisao = r.id_revisao
                  AND x.acao_sugerida IS NOT NULL
                  AND x.acao_sugerida <> 'manter'
            ) m ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM painel_dsr.tb_revisao_instrumento_localidade x
                WHERE x.id_revisao = r.id_revisao
                  AND (x.origem_registro = 'adicionado_tecnico'
                       OR (x.acao_sugerida IS NOT NULL AND x.acao_sugerida <> 'manter'))
            ) l ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM painel_dsr.tb_revisao_instrumento_publico_alvo x
                WHERE x.id_revisao = r.id_revisao
                  AND (x.status_populacao_beneficiada IS NOT NULL
                       OR x.status_desc_populacao_beneficiada IS NOT NULL
                       OR NULLIF(BTRIM(x.observacao_publico_alvo), '') IS NOT NULL)
            ) p ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS total
                FROM painel_dsr.tb_revisao_obra_saneamento x
                WHERE x.id_revisao = r.id_revisao
                  AND x.relacao_instrumento <> 'nao_analisada'
            ) o ON TRUE
            WHERE r.id_usuario = :id_usuario AND r.status = 'rascunho'
            ORDER BY r.atualizado_em DESC, r.id_revisao DESC
            LIMIT :limite OFFSET :offset
            """
        ),
        {"id_usuario": id_usuario, "limite": limite, "offset": offset},
    )
    itens = []
    for row in result.mappings().all():
        dados = dict(row)
        identificador = (
            dados.get("nr_ted")
            if dados["tipo_instrumento"] == "ted"
            else dados.get("nr_instrumento") or dados.get("nr_proposta")
        )
        itens.append(
            RascunhoMeuPainelItem(
                id_revisao=dados["id_revisao"],
                identificador_instrumento=str(identificador or dados["identificador_busca"]),
                tipo_instrumento=dados["tipo_instrumento"],
                tipo_instrumento_label=TIPO_LABELS.get(
                    dados["tipo_instrumento"], dados["tipo_instrumento"]
                ),
                criado_em=dados["criado_em"],
                atualizado_em=dados["atualizado_em"],
                alteracoes=ResumoAlteracoesRascunho(**dados),
            )
        )
    return itens


async def _contar_rascunhos(db: AsyncSession, id_usuario: int) -> int:
    result = await db.execute(
        text(
            """SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento
               WHERE id_usuario = :id_usuario AND status = 'rascunho'"""
        ),
        {"id_usuario": id_usuario},
    )
    return int(result.scalar_one() or 0)


async def _pendencias_coordenadas(db: AsyncSession, identificadores: list[str]) -> dict[str, int]:
    """Agrega as coordenadas atribuídas em uma única consulta."""
    resumo = await resumir_coordenadas_instrumentos(db, identificadores)
    return {chave: valores["pendentes"] for chave, valores in resumo.items()}


async def _listar_pendencias(
    db: AsyncSession,
    usuario: UsuarioAutenticado,
    identificador: str | None = None,
) -> list[InstrumentoPendenteItem]:
    """Reusa a mesma montagem e `calcular_completude` do fluxo de envio."""
    atribuicoes = await _buscar_meus_instrumentos(db, usuario)
    if identificador is not None:
        alvo = identificador.strip()
        atribuicoes = [item for item in atribuicoes if _identificador(item) == alvo]
    coordenadas_por_instrumento = await _pendencias_coordenadas(
        db, [_identificador(item) for item in atribuicoes]
    )
    itens: list[InstrumentoPendenteItem] = []
    for atribuicao in atribuicoes:
        identificador = _identificador(atribuicao)
        instrumento = (
            await _buscar_instrumento_ted(db, identificador)
            if atribuicao.tipo_instrumento == "ted"
            else await _buscar_instrumento_carteira(db, identificador)
        )
        if instrumento is None:
            continue
        resposta = await _montar_resposta_busca(db, instrumento, usuario)
        completude = resposta.completude
        coordenadas = coordenadas_por_instrumento.get(identificador, 0)
        total = int(completude.get("total_pendencias") or 0) + coordenadas
        if total == 0:
            continue
        itens.append(
            InstrumentoPendenteItem(
                identificador_instrumento=instrumento.identificador_busca,
                tipo_instrumento=instrumento.tipo_instrumento,
                tipo_instrumento_label=TIPO_LABELS.get(
                    instrumento.tipo_instrumento, instrumento.tipo_instrumento
                ),
                total_pendencias=total,
                grupos=PendenciasPorGrupo(
                    municipios=int(completude.get("municipios_pendentes") or 0),
                    localidades=int(completude.get("localidades_pendentes") or 0),
                    coordenadas=coordenadas,
                    publico_alvo=int(bool(completude.get("publico_alvo_pendente"))),
                    obras=int(completude.get("obras_pendentes") or 0),
                ),
            )
        )
    return itens


@router.get("", response_model=MeuPainelResponse)
async def consultar_meu_painel(
    rascunhos_limit: Annotated[int, Query(ge=1, le=1000)] = 5,
    rascunhos_offset: Annotated[int, Query(ge=0)] = 0,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    rascunhos = await _listar_rascunhos(
        db, usuario.id_usuario, limite=rascunhos_limit, offset=rascunhos_offset
    )
    rascunhos_total = await _contar_rascunhos(db, usuario.id_usuario)
    pendencias = await _listar_pendencias(db, usuario)
    enviadas_result = await db.execute(
        text(
            """
            SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento
            WHERE id_usuario = :id_usuario AND status = 'enviado'
            """
        ),
        {"id_usuario": usuario.id_usuario},
    )
    enviadas = int(enviadas_result.scalar_one() or 0)
    return MeuPainelResponse(
        resumo=ResumoMeuPainel(
            instrumentos_com_pendencias=len(pendencias),
            rascunhos=rascunhos_total,
            revisoes_enviadas=enviadas,
        ),
        pendencias=pendencias,
        rascunhos=rascunhos,
        rascunhos_total=rascunhos_total,
        rascunhos_limit=rascunhos_limit,
        rascunhos_offset=rascunhos_offset,
    )
