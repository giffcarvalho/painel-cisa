"""Dados operacionais pessoais do técnico."""

import json
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
from app.schemas.revisao_instrumento import MeuInstrumentoRevisaoItem
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
                   d.id_devolutiva, d.id_revisao_devolvida, d.comentario_admin,
                   d.devolvido_em, admin.nome AS administrador,
                   COALESCE(m.total, 0) AS municipios,
                   COALESCE(l.total, 0) AS localidades,
                   COALESCE(c.total, 0) AS coordenadas,
                   COALESCE(p.total, 0) AS publico_alvo,
                   COALESCE(o.total, 0) AS obras,
                   (NULLIF(BTRIM(r.observacao_geral), '') IS NOT NULL) AS observacao_geral
            FROM painel_dsr.tb_revisao_instrumento r
            LEFT JOIN painel_dsr.tb_devolutiva_revisao d
              ON d.id_revisao_devolvida = r.id_revisao_anterior
             AND d.status = 'aguardando_correcao'
            LEFT JOIN painel_dsr.tb_usuario admin ON admin.id_usuario = d.id_usuario_admin
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
                LEFT JOIN territorio.tb_comunidade_rural cr
                  ON cr.cod_comunidade_rural = x.cod_comunidade_rural
                WHERE x.id_revisao = r.id_revisao
                  AND (x.origem_registro = 'adicionado_tecnico'
                       OR (x.acao_sugerida IS NOT NULL AND x.acao_sugerida <> 'manter')
                       OR x.tipo_localidade IS DISTINCT FROM cr.tipo_localidade)
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
                devolutiva=(
                    {
                        "id_devolutiva": dados["id_devolutiva"],
                        "id_revisao_devolvida": dados["id_revisao_devolvida"],
                        "comentario_admin": dados["comentario_admin"],
                        "devolvido_em": dados["devolvido_em"],
                        "administrador": dados["administrador"],
                    }
                    if dados.get("id_devolutiva") is not None
                    else None
                ),
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


async def _buscar_status_instrumentos(
    db: AsyncSession, atribuicoes: list[MeuInstrumentoRevisaoItem]
) -> dict[tuple[str, str], str | None]:
    """Consulta o projeto e o status próprio do TED nas fontes atuais, em lote."""
    instrumentos = [
        {
            "tipo_instrumento": item.tipo_instrumento,
            "identificador": _identificador(item),
            "nr_proposta": item.nr_proposta,
            "nr_instrumento": item.nr_instrumento,
            "nr_ted": item.nr_ted,
        }
        for item in atribuicoes
    ]
    if not instrumentos:
        return {}
    result = await db.execute(
        text(
            """
            WITH atribuicoes AS (
                SELECT * FROM jsonb_to_recordset(CAST(:instrumentos AS jsonb))
                    AS a(tipo_instrumento text, identificador text,
                         nr_proposta text, nr_instrumento text, nr_ted integer)
            ), instrumentos_dsr AS (
                SELECT 'contrato_repasse'::text AS tipo_instrumento,
                       cr.nr_proposta::text AS nr_proposta, cr.id_proposta
                FROM instrumento.tb_contrato_repasse cr
                UNION ALL
                SELECT 'termo_compromisso'::text AS tipo_instrumento,
                       tc.nr_proposta::text AS nr_proposta, tc.id_proposta
                FROM instrumento.tb_termo_de_compromisso tc
            )
            SELECT a.tipo_instrumento, a.identificador,
                   CASE WHEN a.tipo_instrumento = 'ted'
                        THEN ted.tx_situacao_termo
                        ELSE projeto.situacao_projeto_basico END AS status
            FROM atribuicoes a
            LEFT JOIN LATERAL (
                SELECT p.situacao_projeto_basico
                FROM instrumentos_dsr i
                JOIN transferegov.tb_proposta p ON p.id_proposta = i.id_proposta
                WHERE i.tipo_instrumento = a.tipo_instrumento
                  AND (
                      i.nr_proposta = NULLIF(a.nr_proposta, '')
                      OR (NULLIF(a.nr_proposta, '') IS NULL AND EXISTS (
                          SELECT 1 FROM transferegov.tb_convenio cv
                          WHERE cv.id_proposta = i.id_proposta
                            AND cv.nr_convenio::text = a.nr_instrumento
                      ))
                  )
                ORDER BY p.id_proposta DESC
                LIMIT 1
            ) projeto ON TRUE
            LEFT JOIN LATERAL (
                SELECT te.tx_situacao_termo
                FROM instrumento.tb_ted t
                JOIN transferegov.tb_termo_execucao te
                  ON te.id_plano_acao = t.id_plano_acao
                WHERE a.tipo_instrumento = 'ted' AND t.nr_ted = a.nr_ted
                ORDER BY te.id_termo DESC
                LIMIT 1
            ) ted ON TRUE
            """
        ),
        {"instrumentos": json.dumps(instrumentos)},
    )
    return {
        (row["tipo_instrumento"], row["identificador"]): row["status"]
        for row in result.mappings().all()
    }


async def _buscar_projetos_aprovados(
    db: AsyncSession, atribuicoes: list[MeuInstrumentoRevisaoItem]
) -> set[tuple[str, str]]:
    status = await _buscar_status_instrumentos(db, atribuicoes)
    return {chave for chave, valor in status.items() if chave[0] != "ted" and valor in (
        "Aprovado", "Homologado Automaticamente pelo Sistema"
    )}


async def _listar_pendencias(
    db: AsyncSession,
    usuario: UsuarioAutenticado,
    identificador: str | None = None,
    *,
    exigir_projeto_aprovado: bool = False,
    somente_prioridade_principal: bool = False,
) -> list[InstrumentoPendenteItem]:
    """Reusa a completude; o filtro específico do Meu Painel é optativo para o admin."""
    atribuicoes = await _buscar_meus_instrumentos(
        db, usuario, somente_prioridade_principal=somente_prioridade_principal
    )
    if identificador is not None:
        alvo = identificador.strip()
        atribuicoes = [item for item in atribuicoes if _identificador(item) == alvo]
    status_por_instrumento = (
        await _buscar_status_instrumentos(db, atribuicoes)
        if exigir_projeto_aprovado
        else {}
    )
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
        localidades = int(completude.get("localidades_pendentes") or 0)
        publico_alvo = int(bool(completude.get("publico_alvo_pendente")))
        municipios = int(completude.get("municipios_pendentes") or 0)
        obras = int(completude.get("obras_pendentes") or 0)
        status = status_por_instrumento.get((atribuicao.tipo_instrumento, identificador))
        analise_exigivel = (
            not exigir_projeto_aprovado
            or atribuicao.tipo_instrumento == "ted"
            or status in ("Aprovado", "Homologado Automaticamente pelo Sistema")
        )
        total = int(completude.get("total_pendencias") or 0) + coordenadas
        if exigir_projeto_aprovado:
            # Regra exclusiva do Meu Painel; a completude da ficha fica intacta.
            municipios = 0
            total = obras + (coordenadas + localidades + publico_alvo if analise_exigivel else 0)
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
                status_instrumento=status,
                analise_projeto_exigivel=analise_exigivel,
                grupos=PendenciasPorGrupo(
                    municipios=municipios,
                    localidades=localidades,
                    coordenadas=coordenadas,
                    publico_alvo=publico_alvo,
                    obras=obras,
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
    pendencias = await _listar_pendencias(
        db, usuario, exigir_projeto_aprovado=True, somente_prioridade_principal=True
    )
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
