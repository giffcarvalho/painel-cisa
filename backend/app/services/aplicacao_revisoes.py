"""Regras transacionais para aplicar revisões às tabelas oficiais."""

from __future__ import annotations

import hashlib
import json
import logging
from collections import Counter
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.aplicacao_revisoes import (
    AlteracaoRevisaoItem,
    ContagemAlteracoes,
    DetalheExecucao,
    ExecucaoAplicacaoResponse,
    ExecucaoHistoricoItem,
    HistoricoAplicacoesResponse,
    ObraRevisaoItem,
    PublicoAlvoRevisaoItem,
    ResumoResultados,
    RevisaoAplicacaoDetalhe,
    RevisaoPendenteItem,
    RevisoesPendentesResponse,
    ValidacaoAplicacao,
    ValidacaoCancelamento,
    SolicitacaoCancelamentoResponse,
    SolicitacoesCancelamentoResponse,
)
from app.schemas.auth import UsuarioAutenticado
from app.services.notificacoes import (
    criar_notificacao,
    dados_revisao_para_notificacao,
    dados_revisao_para_notificacao_por_execucao,
)


logger = logging.getLogger(__name__)

MENSAGEM_LIMITE_COMUNIDADES = (
    "O município informado já atingiu o limite de 999 comunidades rurais "
    "cadastradas; nenhuma alteração foi confirmada."
)

TIPOS = {
    "contrato_repasse": {
        "label": "Contrato de repasse",
        "instrumento": "instrumento.tb_contrato_repasse",
        "municipio": "instrumento.tb_contrato_repasse_municipio",
        "localidade": "instrumento.tb_contrato_repasse_comunidade_rural",
    },
    "termo_compromisso": {
        "label": "Termo de compromisso",
        "instrumento": "instrumento.tb_termo_de_compromisso",
        "municipio": "instrumento.tb_termo_de_compromisso_municipio",
        "localidade": "instrumento.tb_termo_de_compromisso_comunidade_rural",
    },
    "ted": {
        "label": "TED",
        "instrumento": "instrumento.tb_ted",
        "municipio": "instrumento.tb_ted_municipio",
        "localidade": None,
    },
}


def exigir_admin(usuario: UsuarioAutenticado) -> None:
    if str(usuario.perfil or "").strip().lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )


def _identificador(revisao: dict[str, Any]) -> str:
    if revisao.get("tipo_instrumento") == "ted":
        return str(revisao.get("nr_ted") or revisao.get("identificador_busca") or "-")
    return str(
        revisao.get("nr_instrumento")
        or revisao.get("nr_proposta")
        or revisao.get("identificador_busca")
        or "-"
    )


def _item_pendente(row: dict[str, Any]) -> RevisaoPendenteItem:
    qtd_municipios = int(row.get("qtd_municipios") or 0)
    qtd_localidades = int(row.get("qtd_localidades") or 0)
    qtd_publico_alvo = int(row.get("qtd_publico_alvo") or 0)
    qtd_obras = int(row.get("qtd_obras") or 0)
    tipo = row["tipo_instrumento"]
    return RevisaoPendenteItem(
        id_revisao=row["id_revisao"],
        tipo_instrumento=tipo,
        tipo_instrumento_label=TIPOS.get(tipo, {}).get("label", tipo),
        nr_instrumento=row.get("nr_instrumento"),
        nr_proposta=row.get("nr_proposta"),
        nr_ted=row.get("nr_ted"),
        identificador_principal=_identificador(row),
        tecnico_responsavel=row.get("tecnico_responsavel") or "Não identificado",
        enviado_em=row["enviado_em"],
        observacao_geral=row.get("observacao_geral"),
        status=row["status"],
        alteracoes=ContagemAlteracoes(
            municipios=qtd_municipios,
            localidades=qtd_localidades,
            publico_alvo=qtd_publico_alvo,
            obras=qtd_obras,
            total=qtd_municipios + qtd_localidades + qtd_publico_alvo + qtd_obras,
        ),
    )


async def listar_pendentes(db: AsyncSession) -> RevisoesPendentesResponse:
    result = await db.execute(
        text(
            """
            SELECT
                r.id_revisao, r.identificador_busca, r.tipo_instrumento,
                r.nr_instrumento, r.nr_proposta, r.nr_ted, r.status,
                r.observacao_geral, r.enviado_em,
                u.nome AS tecnico_responsavel,
                (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento_municipio rm
                 WHERE rm.id_revisao = r.id_revisao AND rm.acao_sugerida <> 'manter') AS qtd_municipios,
                (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento_localidade rl
                 WHERE rl.id_revisao = r.id_revisao AND rl.acao_sugerida <> 'manter') AS qtd_localidades,
                (SELECT COUNT(*) FROM painel_dsr.tb_revisao_instrumento_publico_alvo rpa
                 WHERE rpa.id_revisao = r.id_revisao) AS qtd_publico_alvo,
                (SELECT COUNT(*) FROM painel_dsr.tb_revisao_obra_saneamento ro
                 WHERE ro.id_revisao = r.id_revisao) AS qtd_obras
            FROM painel_dsr.tb_revisao_instrumento r
            JOIN painel_dsr.tb_usuario u ON u.id_usuario = r.id_usuario
            WHERE r.status = 'enviado'
              AND r.enviado_em IS NOT NULL
              AND r.aplicado_em IS NULL
            ORDER BY r.enviado_em ASC, r.id_revisao ASC
            """
        )
    )
    data = [_item_pendente(dict(row)) for row in result.mappings().all()]
    return RevisoesPendentesResponse(data=data, total=len(data))


async def _carregar_revisao(
    db: AsyncSession, id_revisao: int, *, bloquear: bool = False
) -> tuple[
    dict[str, Any],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    lock = " FOR UPDATE OF r" if bloquear else ""
    result = await db.execute(
        text(
            """
            SELECT r.*, u.nome AS tecnico_responsavel
            FROM painel_dsr.tb_revisao_instrumento r
            JOIN painel_dsr.tb_usuario u ON u.id_usuario = r.id_usuario
            WHERE r.id_revisao = :id_revisao
            """ + lock
        ),
        {"id_revisao": id_revisao},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Revisão não encontrada.")
    revisao = dict(row)

    municipios_result = await db.execute(
        text(
            """
            SELECT rm.id_revisao_municipio AS id_item, rm.cod_municipio,
                   rm.origem_registro, rm.acao_sugerida, rm.justificativa,
                   m.nome_municipio AS municipio, BTRIM(uf.sigla_uf) AS uf
            FROM painel_dsr.tb_revisao_instrumento_municipio rm
            LEFT JOIN territorio.tb_municipio m ON m.cod_municipio = rm.cod_municipio
            LEFT JOIN territorio.tb_uf uf ON uf.cod_uf = m.cod_uf
            WHERE rm.id_revisao = :id_revisao
            ORDER BY m.nome_municipio NULLS LAST, rm.cod_municipio
            """
        ),
        {"id_revisao": id_revisao},
    )
    localidades_result = await db.execute(
        text(
            """
            SELECT rl.id_revisao_localidade AS id_item, rl.cod_municipio,
                   rl.cod_comunidade_rural, rl.nome_localidade_informada,
                   COALESCE(cr.nome_comunidade_rural, rl.nome_localidade_informada) AS localidade,
                   rl.origem_registro, rl.acao_sugerida,
                   rl.qtde_familias_ben_original, rl.qtde_familias_ben_sugerida,
                   rl.justificativa, m.nome_municipio AS municipio,
                   BTRIM(uf.sigla_uf) AS uf
            FROM painel_dsr.tb_revisao_instrumento_localidade rl
            LEFT JOIN territorio.tb_comunidade_rural cr
              ON cr.cod_comunidade_rural = rl.cod_comunidade_rural
            LEFT JOIN territorio.tb_municipio m ON m.cod_municipio = rl.cod_municipio
            LEFT JOIN territorio.tb_uf uf ON uf.cod_uf = m.cod_uf
            WHERE rl.id_revisao = :id_revisao
            ORDER BY m.nome_municipio NULLS LAST, localidade NULLS LAST, rl.id_revisao_localidade
            """
        ),
        {"id_revisao": id_revisao},
    )
    publico_result = await db.execute(
        text(
            """
            SELECT id_revisao_publico_alvo AS id_item, id_projeto_investimento,
                   status_populacao_beneficiada,
                   status_desc_populacao_beneficiada,
                   observacao_publico_alvo, status_correcao_solicitada
            FROM painel_dsr.tb_revisao_instrumento_publico_alvo
            WHERE id_revisao = :id_revisao
            ORDER BY id_projeto_investimento
            """
        ),
        {"id_revisao": id_revisao},
    )
    obras_result = await db.execute(
        text(
            """
            SELECT ro.id_revisao_obra AS id_item, ro.cod_municipio, ro.id_obra,
                   ro.descricao, ro.orgao, ro.link_transferegov, ro.link_obrasgov,
                   ro.relacao_instrumento, ro.confirmacao_status, ro.justificativa,
                   m.nome_municipio AS municipio, BTRIM(uf.sigla_uf) AS uf
            FROM painel_dsr.tb_revisao_obra_saneamento ro
            LEFT JOIN territorio.tb_municipio m ON m.cod_municipio = ro.cod_municipio
            LEFT JOIN territorio.tb_uf uf ON uf.cod_uf = m.cod_uf
            WHERE ro.id_revisao = :id_revisao
            ORDER BY m.nome_municipio NULLS LAST, ro.id_obra
            """
        ),
        {"id_revisao": id_revisao},
    )
    return (
        revisao,
        [dict(row) for row in municipios_result.mappings().all()],
        [dict(row) for row in localidades_result.mappings().all()],
        [dict(row) for row in publico_result.mappings().all()],
        [dict(row) for row in obras_result.mappings().all()],
    )


async def _validar(
    db: AsyncSession,
    revisao: dict[str, Any],
    municipios: list[dict[str, Any]],
    localidades: list[dict[str, Any]],
    publico_alvo: list[dict[str, Any]] | int,
    obras: list[dict[str, Any]] | None = None,
) -> ValidacaoAplicacao:
    pendencias: list[str] = []
    avisos: list[str] = []

    if revisao.get("aplicado_em") is not None:
        return ValidacaoAplicacao(
            aplicavel=False,
            status="ja_aplicada",
            pendencias=["Esta revisão já foi aplicada e não pode ser processada novamente."],
        )
    if revisao.get("status") != "enviado" or revisao.get("enviado_em") is None:
        pendencias.append("A revisão precisa estar formalmente enviada antes da aplicação.")

    tipo = revisao.get("tipo_instrumento")
    config = TIPOS.get(tipo)
    if config is None:
        pendencias.append(f"Tipo de instrumento não suportado: {tipo or 'não informado'}.")
    else:
        if tipo == "ted":
            if revisao.get("nr_ted") is None:
                pendencias.append("A revisão de TED não possui nr_ted.")
            else:
                existe = await db.execute(
                    text("SELECT 1 FROM instrumento.tb_ted WHERE nr_ted = :chave LIMIT 1"),
                    {"chave": revisao["nr_ted"]},
                )
                if existe.scalar_one_or_none() is None:
                    pendencias.append("O TED informado não existe na tabela oficial.")
            if any(item["acao_sugerida"] == "adicionar" for item in municipios):
                pendencias.append(
                    "Inclusão de município em TED bloqueada: a revisão não informa a proporção exigida."
                )
            if any(item["acao_sugerida"] != "manter" for item in localidades):
                pendencias.append(
                    "Localidades de TED não podem ser aplicadas: não existe tabela oficial de destino configurada."
                )
        else:
            proposta = str(revisao.get("nr_proposta") or "").strip()
            if not proposta:
                pendencias.append("A revisão não possui o número canônico da proposta.")
            else:
                existe = await db.execute(
                    text(f"SELECT 1 FROM {config['instrumento']} WHERE nr_proposta = :chave LIMIT 1"),
                    {"chave": proposta},
                )
                if existe.scalar_one_or_none() is None:
                    pendencias.append("A proposta informada não existe na tabela oficial do instrumento.")

    anterior = revisao.get("id_revisao_anterior")
    anterior_nao_aplicado = False
    if anterior:
        anterior_result = await db.execute(
            text(
                "SELECT aplicado_em FROM painel_dsr.tb_revisao_instrumento "
                "WHERE id_revisao = :id_revisao"
            ),
            {"id_revisao": anterior},
        )
        anterior_aplicado = anterior_result.scalar_one_or_none()
        if anterior_aplicado is None:
            anterior_nao_aplicado = True

    primeira_pendente = None
    if revisao.get("status") == "enviado" and revisao.get("aplicado_em") is None:
        primeira_result = await db.execute(
            text(
                """
                SELECT id_revisao
                FROM painel_dsr.tb_revisao_instrumento
                WHERE tipo_instrumento = :tipo_instrumento
                  AND status = 'enviado'
                  AND enviado_em IS NOT NULL
                  AND aplicado_em IS NULL
                  AND (
                        (:tipo_instrumento = 'ted' AND nr_ted = :nr_ted)
                     OR (:tipo_instrumento <> 'ted'
                         AND NULLIF(BTRIM(nr_instrumento), '') =
                             NULLIF(BTRIM(:nr_instrumento), ''))
                  )
                ORDER BY enviado_em ASC, id_revisao ASC
                LIMIT 1
                """
            ),
            {
                "tipo_instrumento": revisao.get("tipo_instrumento"),
                "nr_ted": revisao.get("nr_ted"),
                "nr_instrumento": revisao.get("nr_instrumento"),
            },
        )
        primeira_pendente = primeira_result.scalar_one_or_none()
        if primeira_pendente is not None and primeira_pendente != revisao["id_revisao"]:
            pendencias.append(
                f"A revisão nº {primeira_pendente} é a mais antiga pendente deste instrumento e deve ser aplicada primeiro."
            )
        elif anterior_nao_aplicado:
            pendencias.append(
                f"A revisão anterior nº {anterior} deve ser aplicada primeiro; o encadeamento é sequencial."
            )

    for item in municipios:
        if item["acao_sugerida"] == "manter":
            continue
        municipio_result = await db.execute(
            text(
                "SELECT 1 FROM territorio.tb_municipio "
                "WHERE cod_municipio = :cod_municipio LIMIT 1"
            ),
            {"cod_municipio": item["cod_municipio"]},
        )
        if municipio_result.scalar_one_or_none() is None:
            pendencias.append(
                f"O município {item['cod_municipio']} não existe no cadastro territorial oficial."
            )

    for item in localidades:
        acao = item["acao_sugerida"]
        if acao == "manter":
            continue
        codigo = item.get("cod_comunidade_rural")
        if codigo is not None:
            comunidade_result = await db.execute(
                text(
                    "SELECT cod_municipio FROM territorio.tb_comunidade_rural "
                    "WHERE cod_comunidade_rural = :codigo"
                ),
                {"codigo": codigo},
            )
            municipio_comunidade = comunidade_result.scalar_one_or_none()
            if municipio_comunidade is None:
                pendencias.append(f"A comunidade {codigo} não existe no cadastro territorial.")
            elif municipio_comunidade != item["cod_municipio"]:
                pendencias.append(
                    f"A comunidade {codigo} pertence a outro município e não pode ser associada ao município {item['cod_municipio']}."
                )
        else:
            nome = str(item.get("nome_localidade_informada") or "").strip()
            if not nome:
                pendencias.append("Uma localidade manual não possui nome para identificação segura.")
                continue
            if item.get("origem_registro") != "adicionado_tecnico":
                pendencias.append(
                    f"A localidade manual '{nome}' não está identificada como adicionada pelo técnico."
                )
            candidatos = await db.execute(
                text(
                    """
                    SELECT cod_comunidade_rural
                    FROM territorio.tb_comunidade_rural
                    WHERE cod_municipio = :cod_municipio
                      AND LOWER(BTRIM(nome_comunidade_rural)) = LOWER(BTRIM(:nome))
                    """
                ),
                {"cod_municipio": item["cod_municipio"], "nome": nome},
            )
            quantidade = len(candidatos.scalars().all())
            if quantidade > 1:
                pendencias.append(
                    f"A localidade '{nome}' possui múltiplos cadastros equivalentes no município {item['cod_municipio']}."
                )
            if quantidade == 0 and acao != "adicionar":
                pendencias.append(
                    f"A localidade '{nome}' não existe no cadastro territorial e a ação '{acao}' não pode criá-la."
                )
        if acao == "corrigir" and item.get("qtde_familias_ben_sugerida") is None:
            pendencias.append(
                f"A correção da localidade '{item.get('localidade') or codigo}' não informa a nova quantidade de famílias."
            )

        if (
            config
            and config.get("municipio")
            and tipo != "ted"
            and acao in {"adicionar", "corrigir"}
            and revisao.get("nr_proposta")
        ):
            acao_municipio = next(
                (
                    municipio["acao_sugerida"]
                    for municipio in municipios
                    if municipio["cod_municipio"] == item["cod_municipio"]
                    and municipio["acao_sugerida"] != "manter"
                ),
                None,
            )
            vinculo_result = await db.execute(
                text(
                    f"SELECT 1 FROM {config['municipio']} "
                    "WHERE nr_proposta = :nr_proposta "
                    "AND cod_municipio = :cod_municipio LIMIT 1"
                ),
                {
                    "nr_proposta": revisao["nr_proposta"],
                    "cod_municipio": item["cod_municipio"],
                },
            )
            municipio_vinculado = vinculo_result.scalar_one_or_none() is not None
            if acao_municipio == "remover" or (
                not municipio_vinculado and acao_municipio != "adicionar"
            ):
                pendencias.append(
                    f"A localidade '{item.get('localidade') or item.get('nome_localidade_informada')}' "
                    f"seria vinculada sem que o município {item['cod_municipio']} pertença ao instrumento."
                )

    if config and config.get("localidade") and revisao.get("nr_proposta"):
        removidos = {
            item["cod_municipio"]
            for item in municipios
            if item["acao_sugerida"] == "remover"
        }
        for cod_municipio in removidos:
            adicionadas = any(
                loc["cod_municipio"] == cod_municipio
                and loc["acao_sugerida"] in {"adicionar", "corrigir"}
                for loc in localidades
            )
            if adicionadas:
                pendencias.append(
                    f"O município {cod_municipio} será removido, mas possui localidade adicionada ou corrigida na mesma revisão."
                )
                continue
            existentes = await db.execute(
                text(
                    f"""
                    SELECT rel.cod_comunidade_rural
                    FROM {config['localidade']} rel
                    JOIN territorio.tb_comunidade_rural cr
                      ON cr.cod_comunidade_rural = rel.cod_comunidade_rural
                    WHERE rel.nr_proposta = :nr_proposta
                      AND cr.cod_municipio = :cod_municipio
                    """
                ),
                {"nr_proposta": revisao["nr_proposta"], "cod_municipio": cod_municipio},
            )
            codigos_existentes = set(existentes.scalars().all())
            codigos_removidos = {
                loc["cod_comunidade_rural"]
                for loc in localidades
                if loc["cod_municipio"] == cod_municipio
                and loc["acao_sugerida"] == "remover"
                and loc.get("cod_comunidade_rural") is not None
            }
            for loc in localidades:
                if (
                    loc["cod_municipio"] != cod_municipio
                    or loc["acao_sugerida"] != "remover"
                    or loc.get("cod_comunidade_rural") is not None
                ):
                    continue
                nome = str(loc.get("nome_localidade_informada") or "").strip()
                candidato_result = await db.execute(
                    text(
                        """
                        SELECT cod_comunidade_rural
                        FROM territorio.tb_comunidade_rural
                        WHERE cod_municipio = :cod_municipio
                          AND LOWER(BTRIM(nome_comunidade_rural)) = LOWER(BTRIM(:nome))
                        """
                    ),
                    {"cod_municipio": cod_municipio, "nome": nome},
                )
                candidatos = candidato_result.scalars().all()
                if len(candidatos) == 1:
                    codigos_removidos.add(candidatos[0])
            if codigos_existentes - codigos_removidos:
                pendencias.append(
                    f"O município {cod_municipio} ainda teria localidades vinculadas ao instrumento após sua remoção."
                )

    if (
        not any(item["acao_sugerida"] != "manter" for item in municipios + localidades)
        and not publico_alvo
        and not obras
    ):
        avisos.append("A revisão não possui registros para incorporação.")

    return ValidacaoAplicacao(
        aplicavel=not pendencias,
        status="pronta" if not pendencias else "possui_pendencias",
        pendencias=list(dict.fromkeys(pendencias)),
        avisos=avisos,
    )


def _alteracao_municipio(row: dict[str, Any]) -> AlteracaoRevisaoItem:
    return AlteracaoRevisaoItem(
        id_item=row["id_item"], entidade="municipio", acao=row["acao_sugerida"],
        cod_municipio=row["cod_municipio"], municipio=row.get("municipio"),
        uf=row.get("uf"), origem_registro=row.get("origem_registro"),
        justificativa=row.get("justificativa"),
    )


def _alteracao_localidade(row: dict[str, Any]) -> AlteracaoRevisaoItem:
    return AlteracaoRevisaoItem(
        id_item=row["id_item"], entidade="localidade", acao=row["acao_sugerida"],
        cod_municipio=row["cod_municipio"], municipio=row.get("municipio"), uf=row.get("uf"),
        cod_comunidade_rural=row.get("cod_comunidade_rural"),
        localidade=row.get("localidade"), origem_registro=row.get("origem_registro"),
        valor_anterior=row.get("qtde_familias_ben_original"),
        valor_sugerido=row.get("qtde_familias_ben_sugerida"),
        justificativa=row.get("justificativa"),
    )


def _avaliacao_publico_alvo(row: dict[str, Any]) -> PublicoAlvoRevisaoItem:
    return PublicoAlvoRevisaoItem(
        id_item=row["id_item"],
        id_projeto_investimento=row["id_projeto_investimento"],
        status_populacao_beneficiada=row.get("status_populacao_beneficiada"),
        status_desc_populacao_beneficiada=row.get("status_desc_populacao_beneficiada"),
        status_correcao_solicitada=row.get("status_correcao_solicitada"),
        observacao_publico_alvo=row.get("observacao_publico_alvo"),
    )


def _avaliacao_obra(row: dict[str, Any]) -> ObraRevisaoItem:
    return ObraRevisaoItem(
        id_item=row["id_item"], id_obra=row["id_obra"],
        cod_municipio=row["cod_municipio"], municipio=row.get("municipio"),
        uf=row.get("uf"), relacao_instrumento=row["relacao_instrumento"],
        confirmacao_status=row["confirmacao_status"],
        justificativa=row.get("justificativa"),
    )


async def obter_detalhe(db: AsyncSession, id_revisao: int) -> RevisaoAplicacaoDetalhe:
    revisao, municipios, localidades, publico, obras = await _carregar_revisao(
        db, id_revisao
    )
    row = {
        **revisao,
        "qtd_municipios": sum(item["acao_sugerida"] != "manter" for item in municipios),
        "qtd_localidades": sum(item["acao_sugerida"] != "manter" for item in localidades),
        "qtd_publico_alvo": len(publico),
        "qtd_obras": len(obras),
    }
    validacao = await _validar(db, revisao, municipios, localidades, publico, obras)
    return RevisaoAplicacaoDetalhe(
        revisao=_item_pendente(row),
        municipios=[_alteracao_municipio(item) for item in municipios],
        localidades=[_alteracao_localidade(item) for item in localidades],
        publico_alvo=[_avaliacao_publico_alvo(item) for item in publico],
        obras=[_avaliacao_obra(item) for item in obras],
        validacao=validacao,
    )


async def validar_aplicacao(db: AsyncSession, id_revisao: int) -> ValidacaoAplicacao:
    revisao, municipios, localidades, publico, obras = await _carregar_revisao(
        db, id_revisao
    )
    return await _validar(db, revisao, municipios, localidades, publico, obras)


STATUS_EXECUCAO_LABELS = {
    "em_processamento": "Em processamento",
    "sucesso": "Sucesso",
    "falha": "Falha",
    "cancelado": "Cancelado",
}


def _mensagem_erro_publica(mensagem: str | None) -> str | None:
    """Evita devolver rastros técnicos eventualmente persistidos no passado."""
    if not mensagem:
        return None
    primeira_linha = str(mensagem).strip().splitlines()[0][:500]
    if "traceback" in primeira_linha.lower() or not primeira_linha:
        return "A execução terminou com falha. Consulte os logs do backend para detalhes técnicos."
    return primeira_linha


async def listar_historico(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 10,
    busca: str | None = None,
    status_execucao: str | None = None,
) -> HistoricoAplicacoesResponse:
    filtros: list[str] = []
    params: dict[str, Any] = {
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }
    busca = (busca or "").strip()
    if busca:
        filtros.append(
            "(r.nr_instrumento ILIKE :busca OR r.nr_proposta ILIKE :busca "
            "OR CAST(r.nr_ted AS TEXT) ILIKE :busca)"
        )
        params["busca"] = f"%{busca}%"
    if status_execucao:
        filtros.append("e.status = :status_execucao")
        params["status_execucao"] = status_execucao
    where = f"WHERE {' AND '.join(filtros)}" if filtros else ""

    total_result = await db.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM painel_dsr.tb_execucao_aplicacao_revisao e
            JOIN painel_dsr.tb_revisao_instrumento r ON r.id_revisao = e.id_revisao
            {where}
            """
        ),
        params,
    )
    total = int(total_result.scalar_one() or 0)
    result = await db.execute(
        text(
            f"""
            SELECT e.id_execucao, e.id_revisao, e.status, e.iniciado_em,
                   e.concluido_em, COALESCE(e.qtd_municipios, 0) AS qtd_municipios,
                   COALESCE(e.qtd_localidades, 0) AS qtd_localidades,
                   COALESCE(e.qtd_publico_alvo, 0) AS qtd_publico_alvo,
                   COALESCE(e.qtd_obras, 0) AS qtd_obras, e.mensagem_erro,
                   r.tipo_instrumento, r.nr_instrumento, r.nr_proposta, r.nr_ted,
                   r.identificador_busca, u.nome AS administrador
            FROM painel_dsr.tb_execucao_aplicacao_revisao e
            JOIN painel_dsr.tb_revisao_instrumento r ON r.id_revisao = e.id_revisao
            JOIN painel_dsr.tb_usuario u ON u.id_usuario = e.id_usuario_admin
            {where}
            ORDER BY e.iniciado_em DESC, e.id_execucao DESC
            LIMIT :limit OFFSET :offset
            """
        ),
        params,
    )
    data = []
    for row in result.mappings().all():
        dados = dict(row)
        tipo = dados["tipo_instrumento"]
        data.append(
            ExecucaoHistoricoItem(
                **{**dados, "mensagem_erro": _mensagem_erro_publica(dados.get("mensagem_erro"))},
                status_label=STATUS_EXECUCAO_LABELS.get(dados["status"], dados["status"]),
                tipo_instrumento_label=TIPOS.get(tipo, {}).get("label", tipo),
                identificador_instrumento=_identificador(dados),
            )
        )
    return HistoricoAplicacoesResponse(
        data=data,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


async def obter_execucao(
    db: AsyncSession, id_execucao: int
) -> ExecucaoAplicacaoResponse:
    result = await db.execute(
        text(
            """
            SELECT e.id_execucao, e.id_revisao, e.status, e.iniciado_em,
                   e.concluido_em, e.mensagem_erro, e.cancelado_em,
                   e.motivo_cancelamento,
                   r.tipo_instrumento, r.nr_instrumento, r.nr_proposta,
                   r.nr_ted, r.identificador_busca, r.aplicado_em,
                   u.nome AS administrador,
                   uc.nome AS administrador_cancelamento
            FROM painel_dsr.tb_execucao_aplicacao_revisao e
            JOIN painel_dsr.tb_revisao_instrumento r ON r.id_revisao = e.id_revisao
            JOIN painel_dsr.tb_usuario u ON u.id_usuario = e.id_usuario_admin
            LEFT JOIN painel_dsr.tb_usuario uc
              ON uc.id_usuario = e.id_usuario_cancelamento
            WHERE e.id_execucao = :id_execucao
            """
        ),
        {"id_execucao": id_execucao},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    dados = dict(row)
    detalhes_result = await db.execute(
        text(
            """
            SELECT id_detalhe, entidade, acao, resultado, chave,
                   valores_anteriores, valores_novos, mensagem
            FROM painel_dsr.tb_execucao_aplicacao_revisao_detalhe
            WHERE id_execucao = :id_execucao
            ORDER BY id_detalhe
            """
        ),
        {"id_execucao": id_execucao},
    )
    detalhes = [dict(item) for item in detalhes_result.mappings().all()]
    detalhes_aplicacao = [
        item for item in detalhes if not str(item.get("acao") or "").startswith("desfazer_")
    ]
    tipo = dados["tipo_instrumento"]
    mensagem_erro = _mensagem_erro_publica(dados.get("mensagem_erro"))
    return ExecucaoAplicacaoResponse(
        id_execucao=dados["id_execucao"], id_revisao=dados["id_revisao"],
        status=dados["status"], iniciado_em=dados["iniciado_em"],
        concluido_em=dados["concluido_em"],
        aplicado_em=(dados.get("aplicado_em") or (
            dados.get("concluido_em") if dados["status"] in {"sucesso", "cancelado"} else None
        )),
        cancelado_em=dados.get("cancelado_em"),
        administrador=dados["administrador"], tipo_instrumento=tipo,
        administrador_cancelamento=dados.get("administrador_cancelamento"),
        motivo_cancelamento=dados.get("motivo_cancelamento"),
        tipo_instrumento_label=TIPOS.get(tipo, {}).get("label", tipo),
        nr_instrumento=dados.get("nr_instrumento"),
        nr_proposta=dados.get("nr_proposta"), nr_ted=dados.get("nr_ted"),
        identificador_instrumento=_identificador(dados), resumo=_resumir(detalhes_aplicacao),
        detalhes=[DetalheExecucao(**item) for item in detalhes],
        mensagem=(
            "Aplicação cancelada e alterações desfeitas com sucesso."
            if dados["status"] == "cancelado"
            else "Revisão aplicada com sucesso."
            if dados["status"] == "sucesso"
            else mensagem_erro or "Execução não concluída."
        ),
    )


def _advisory_key(value: str) -> int:
    raw = hashlib.sha256(value.encode("utf-8")).digest()[:8]
    return int.from_bytes(raw, "big", signed=True)


def _mensagem_limite_comunidades(exc: SQLAlchemyError) -> str | None:
    erro_banco = str(getattr(exc, "orig", exc))
    if "limite de 999 comunidades rurais" in erro_banco.lower():
        return MENSAGEM_LIMITE_COMUNIDADES
    return None


async def _registrar_detalhe(
    db: AsyncSession, id_execucao: int, detalhe: dict[str, Any]
) -> None:
    await db.execute(
        text(
            """
            INSERT INTO painel_dsr.tb_execucao_aplicacao_revisao_detalhe (
                id_execucao, entidade, acao, resultado, chave,
                valores_anteriores, valores_novos, mensagem
            ) VALUES (
                :id_execucao, :entidade, :acao, :resultado, CAST(:chave AS jsonb),
                CAST(:anteriores AS jsonb), CAST(:novos AS jsonb), :mensagem
            )
            """
        ),
        {
            "id_execucao": id_execucao,
            "entidade": detalhe["entidade"],
            "acao": detalhe["acao"],
            "resultado": detalhe["resultado"],
            "chave": json.dumps(detalhe.get("chave") or {}),
            "anteriores": json.dumps(detalhe.get("valores_anteriores")),
            "novos": json.dumps(detalhe.get("valores_novos")),
            "mensagem": detalhe.get("mensagem"),
        },
    )


async def _resolver_comunidade(
    db: AsyncSession, item: dict[str, Any], *, permitir_criar: bool
) -> tuple[int | None, bool]:
    if item.get("cod_comunidade_rural") is not None:
        return int(item["cod_comunidade_rural"]), False
    nome = str(item.get("nome_localidade_informada") or "").strip()
    cod_municipio = int(item["cod_municipio"])
    # Serializa toda a resolução por município. Assim, a busca por nome também
    # permanece protegida até o INSERT e duas transações não criam equivalentes.
    await db.execute(
        text("SELECT pg_advisory_xact_lock(CAST(:cod_municipio AS BIGINT))"),
        {"cod_municipio": cod_municipio},
    )
    result = await db.execute(
        text(
            """
            SELECT cod_comunidade_rural
            FROM territorio.tb_comunidade_rural
            WHERE cod_municipio = :cod_municipio
              AND LOWER(BTRIM(nome_comunidade_rural)) = LOWER(BTRIM(:nome))
            FOR UPDATE
            """
        ),
        {"cod_municipio": cod_municipio, "nome": nome},
    )
    candidatos = result.scalars().all()
    if len(candidatos) > 1:
        raise ValueError(f"Localidade ambígua: {nome}.")
    if candidatos:
        return int(candidatos[0]), False
    if not permitir_criar:
        return None, False
    codigo_result = await db.execute(
        text(
            "SELECT territorio.fn_proximo_cod_comunidade_rural(:cod_municipio)"
        ),
        {"cod_municipio": cod_municipio},
    )
    codigo = int(codigo_result.scalar_one())
    await db.execute(
        text(
            """
            INSERT INTO territorio.tb_comunidade_rural (
                cod_comunidade_rural, cod_municipio, nome_comunidade_rural
            ) VALUES (:codigo, :cod_municipio, :nome)
            """
        ),
        {"codigo": codigo, "cod_municipio": cod_municipio, "nome": nome},
    )
    return codigo, True


async def _aplicar_municipio(
    db: AsyncSession, revisao: dict[str, Any], item: dict[str, Any]
) -> dict[str, Any]:
    tipo = revisao["tipo_instrumento"]
    if tipo == "ted" and item["acao_sugerida"] == "adicionar":
        raise ValueError(
            "Inclusão de município em TED exige proporção e permanece bloqueada."
        )
    tabela = TIPOS[tipo]["municipio"]
    chave_nome = "nr_ted" if tipo == "ted" else "nr_proposta"
    chave_valor = revisao[chave_nome]
    params = {"chave": chave_valor, "cod_municipio": item["cod_municipio"]}
    condicao = f"{chave_nome} = :chave AND cod_municipio = :cod_municipio"
    existe = await db.execute(
        text(f"SELECT to_jsonb(rel) FROM {tabela} rel WHERE {condicao} LIMIT 1"), params
    )
    registro_anterior = existe.scalar_one_or_none()
    presente = registro_anterior is not None
    proporcao_anterior = (
        registro_anterior.get("proporcao")
        if isinstance(registro_anterior, dict) else None
    )
    acao = item["acao_sugerida"]
    if acao == "adicionar":
        if presente:
            resultado = "ja_existente"
        else:
            insert_result = await db.execute(
                text(
                    f"INSERT INTO {tabela} ({chave_nome}, cod_municipio) "
                    "VALUES (:chave, :cod_municipio) "
                    f"ON CONFLICT ({chave_nome}, cod_municipio) DO NOTHING "
                    "RETURNING 1"
                ),
                params,
            )
            resultado = (
                "adicionado"
                if insert_result.scalar_one_or_none() is not None
                else "ja_existente"
            )
    else:
        if presente:
            await db.execute(text(f"DELETE FROM {tabela} WHERE {condicao}"), params)
            resultado = "removido"
        else:
            resultado = "ja_ausente"
    return {
        "entidade": "municipio", "acao": acao, "resultado": resultado,
        "chave": {chave_nome: chave_valor, "cod_municipio": item["cod_municipio"]},
        "valores_anteriores": {
            "vinculado": presente,
            **({"proporcao": proporcao_anterior} if tipo == "ted" and presente else {}),
        },
        "valores_novos": {
            "vinculado": acao == "adicionar",
            **({"proporcao": proporcao_anterior} if tipo == "ted" and acao == "adicionar" else {}),
        },
        "mensagem": item.get("municipio"),
    }


async def _aplicar_localidade(
    db: AsyncSession, revisao: dict[str, Any], item: dict[str, Any]
) -> dict[str, Any]:
    tabela = TIPOS[revisao["tipo_instrumento"]]["localidade"]
    if tabela is None:
        raise ValueError("O tipo de instrumento não possui tabela oficial de localidades.")
    acao = item["acao_sugerida"]
    codigo, criada = await _resolver_comunidade(db, item, permitir_criar=acao == "adicionar")
    proposta = revisao["nr_proposta"]
    if codigo is None:
        presente = False
        atual = None
    else:
        result = await db.execute(
            text(
                f"SELECT qtde_familias_ben FROM {tabela} "
                "WHERE nr_proposta = :nr_proposta AND cod_comunidade_rural = :codigo"
            ),
            {"nr_proposta": proposta, "codigo": codigo},
        )
        atual = result.scalar_one_or_none()
        presente = atual is not None
        if atual is None:
            existe_sem_quantidade = await db.execute(
                text(
                    f"SELECT 1 FROM {tabela} WHERE nr_proposta = :nr_proposta "
                    "AND cod_comunidade_rural = :codigo LIMIT 1"
                ),
                {"nr_proposta": proposta, "codigo": codigo},
            )
            presente = existe_sem_quantidade.scalar_one_or_none() is not None

    sugerido = item.get("qtde_familias_ben_sugerida")
    if acao == "adicionar":
        if presente:
            resultado = "ja_existente"
        else:
            insert_result = await db.execute(
                text(
                    f"INSERT INTO {tabela} (cod_comunidade_rural, nr_proposta, qtde_familias_ben) "
                    "VALUES (:codigo, :nr_proposta, :quantidade) "
                    "ON CONFLICT (cod_comunidade_rural, nr_proposta) DO NOTHING "
                    "RETURNING 1"
                ),
                {"codigo": codigo, "nr_proposta": proposta, "quantidade": sugerido},
            )
            resultado = (
                "adicionado"
                if insert_result.scalar_one_or_none() is not None
                else "ja_existente"
            )
    elif acao == "remover":
        if presente:
            await db.execute(
                text(
                    f"DELETE FROM {tabela} WHERE nr_proposta = :nr_proposta "
                    "AND cod_comunidade_rural = :codigo"
                ),
                {"codigo": codigo, "nr_proposta": proposta},
            )
            resultado = "removido"
        else:
            resultado = "ja_ausente"
    else:
        if not presente:
            raise ValueError(f"A localidade {codigo} não está vinculada ao instrumento para correção.")
        if atual == sugerido:
            resultado = "ja_atualizado"
        else:
            await db.execute(
                text(
                    f"UPDATE {tabela} SET qtde_familias_ben = :quantidade "
                    "WHERE nr_proposta = :nr_proposta AND cod_comunidade_rural = :codigo"
                ),
                {"codigo": codigo, "nr_proposta": proposta, "quantidade": sugerido},
            )
            resultado = "corrigido"
    return {
        "entidade": "localidade", "acao": acao, "resultado": resultado,
        "chave": {"nr_proposta": proposta, "cod_comunidade_rural": codigo,
                  "cod_municipio": item["cod_municipio"],
                  "nome_comunidade_rural": (
                      str(item.get("nome_localidade_informada") or "").strip() or None
                  )},
        "valores_anteriores": {"vinculado": presente, "qtde_familias_ben": atual},
        "valores_novos": {
            "vinculado": acao != "remover",
            "qtde_familias_ben": sugerido if acao in {"adicionar", "corrigir"} else atual,
            "comunidade_criada": criada,
            "comunidade_reutilizada": (
                item.get("cod_comunidade_rural") is None and codigo is not None and not criada
            ),
        },
        "mensagem": item.get("localidade"),
    }


def _detalhe_publico_alvo(item: dict[str, Any]) -> dict[str, Any]:
    projeto = item["id_projeto_investimento"]
    return {
        "entidade": "publico_alvo",
        "acao": "incorporar_avaliacao",
        "resultado": "incorporado",
        "chave": {"id_projeto_investimento": projeto},
        # A aplicação não altera a fonte externa e, neste schema, os valores
        # originais são resolvidos no ObrasGov apenas durante a visualização.
        "valores_anteriores": None,
        "valores_novos": {
            "status_populacao_beneficiada": item.get(
                "status_populacao_beneficiada"
            ),
            "status_desc_populacao_beneficiada": item.get(
                "status_desc_populacao_beneficiada"
            ),
            "status_correcao_solicitada": item.get("status_correcao_solicitada"),
            "observacao_publico_alvo": item.get("observacao_publico_alvo"),
        },
        "mensagem": f"Projeto {projeto}",
    }


def _detalhe_obra(revisao: dict[str, Any], item: dict[str, Any]) -> dict[str, Any]:
    municipio = item.get("municipio") or str(item["cod_municipio"])
    if item.get("uf"):
        municipio = f"{municipio}/{item['uf']}"
    return {
        "entidade": "obra",
        "acao": "incorporar_avaliacao",
        "resultado": "incorporado",
        "chave": {
            "tipo_instrumento": revisao["tipo_instrumento"],
            "identificador_instrumento": _identificador(revisao),
            "cod_municipio": item["cod_municipio"],
            "id_obra": item["id_obra"],
        },
        "valores_anteriores": {
            "descricao": item.get("descricao"),
            "orgao": item.get("orgao"),
            "link_transferegov": item.get("link_transferegov"),
            "link_obrasgov": item.get("link_obrasgov"),
        },
        "valores_novos": {
            "relacao_instrumento": item["relacao_instrumento"],
            "confirmacao_status": item["confirmacao_status"],
            "justificativa": item.get("justificativa"),
        },
        "mensagem": f"Obra {item['id_obra']} — {municipio}",
    }


async def _atualizar_views_consolidadas(
    db: AsyncSession, *, possui_publico_alvo: bool, possui_obras: bool
) -> None:
    # O refresh não concorrente é intencional: ele participa da mesma transação
    # que define aplicado_em, de modo que uma falha reverta toda a aplicação.
    if possui_publico_alvo:
        await db.execute(
            text("REFRESH MATERIALIZED VIEW obrasgov.vw_publico_alvo_revisado")
        )
    if possui_obras:
        await db.execute(
            text("REFRESH MATERIALIZED VIEW instrumento.vw_obra_saneamento_revisada")
        )


def _resumir(detalhes: list[dict[str, Any]]) -> ResumoResultados:
    grupos: dict[str, Counter] = {
        "municipio": Counter(), "localidade": Counter(),
        "publico_alvo": Counter(), "obra": Counter(),
    }
    for detalhe in detalhes:
        grupos[detalhe["entidade"]][detalhe["resultado"]] += 1
    return ResumoResultados(
        municipios=dict(grupos["municipio"]),
        localidades=dict(grupos["localidade"]),
        publico_alvo=dict(grupos["publico_alvo"]),
        obras=dict(grupos["obra"]),
    )


RESULTADOS_COM_EFEITO = {"adicionado", "removido", "corrigido", "incorporado"}


async def _carregar_execucao_cancelamento(
    db: AsyncSession, id_execucao: int, *, bloquear: bool = False
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    lock = " FOR UPDATE OF e" if bloquear else ""
    result = await db.execute(
        text(
            """
            SELECT e.*, r.id_usuario AS id_usuario_revisao,
                   r.tipo_instrumento, r.nr_instrumento, r.nr_proposta,
                   r.nr_ted, r.identificador_busca, r.aplicado_em
            FROM painel_dsr.tb_execucao_aplicacao_revisao e
            JOIN painel_dsr.tb_revisao_instrumento r ON r.id_revisao = e.id_revisao
            WHERE e.id_execucao = :id_execucao
            """ + lock
        ),
        {"id_execucao": id_execucao},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    execucao = dict(row)
    detalhes_result = await db.execute(
        text(
            """
            SELECT id_detalhe, entidade, acao, resultado, chave,
                   valores_anteriores, valores_novos, mensagem
            FROM painel_dsr.tb_execucao_aplicacao_revisao_detalhe
            WHERE id_execucao = :id_execucao
              AND acao NOT LIKE 'desfazer\_%' ESCAPE '\\'
            ORDER BY id_detalhe
            """
        ),
        {"id_execucao": id_execucao},
    )
    return execucao, [dict(item) for item in detalhes_result.mappings().all()]


async def _existe_aplicacao_posterior(
    db: AsyncSession, execucao: dict[str, Any]
) -> bool:
    result = await db.execute(
        text(
            """
            SELECT 1
            FROM painel_dsr.tb_execucao_aplicacao_revisao e2
            JOIN painel_dsr.tb_revisao_instrumento r2
              ON r2.id_revisao = e2.id_revisao
            WHERE e2.status = 'sucesso'
              AND e2.id_execucao <> :id_execucao
              AND r2.tipo_instrumento = :tipo_instrumento
              AND COALESCE(NULLIF(BTRIM(r2.nr_instrumento), ''), r2.nr_ted::TEXT)
                  = COALESCE(NULLIF(BTRIM(:nr_instrumento), ''), CAST(:nr_ted AS TEXT))
              AND (r2.aplicado_em, e2.id_execucao)
                  > (:aplicado_em, :id_execucao)
            LIMIT 1
            """
        ),
        {
            "id_execucao": execucao["id_execucao"],
            "tipo_instrumento": execucao["tipo_instrumento"],
            "nr_instrumento": execucao.get("nr_instrumento"),
            "nr_ted": execucao.get("nr_ted"),
            "aplicado_em": execucao.get("aplicado_em"),
        },
    )
    return result.scalar_one_or_none() is not None


def _detalhes_com_efeito(detalhes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in detalhes if item.get("resultado") in RESULTADOS_COM_EFEITO]


async def _conflitos_estado_atual(
    db: AsyncSession,
    execucao: dict[str, Any],
    detalhes: list[dict[str, Any]],
    *,
    bloquear: bool = False,
) -> list[str]:
    conflitos: list[str] = []
    config = TIPOS.get(execucao.get("tipo_instrumento"))
    if config is None:
        return ["O tipo de instrumento desta execução não é suportado para reversão."]

    sufixo_lock = " FOR UPDATE" if bloquear else ""
    for detalhe in _detalhes_com_efeito(detalhes):
        entidade = detalhe["entidade"]
        chave = detalhe.get("chave") or {}
        esperado = detalhe.get("valores_novos") or {}
        nome = detalhe.get("mensagem") or str(chave)
        if entidade == "municipio":
            chave_nome = "nr_ted" if execucao["tipo_instrumento"] == "ted" else "nr_proposta"
            result = await db.execute(
                text(
                    f"SELECT to_jsonb(rel) FROM {config['municipio']} rel "
                    f"WHERE {chave_nome} = :chave AND cod_municipio = :cod_municipio"
                    + sufixo_lock
                ),
                {"chave": chave.get(chave_nome), "cod_municipio": chave.get("cod_municipio")},
            )
            registro = result.scalar_one_or_none()
            atual_vinculado = registro is not None
            if atual_vinculado != bool(esperado.get("vinculado")):
                conflitos.append(f"Município {nome}: o vínculo atual diverge do estado deixado pela aplicação.")
            elif (
                atual_vinculado
                and "proporcao" in esperado
                and isinstance(registro, dict)
                and registro.get("proporcao") != esperado.get("proporcao")
            ):
                conflitos.append(f"Município {nome}: a proporção atual foi alterada após a aplicação.")
        elif entidade == "localidade":
            result = await db.execute(
                text(
                    f"SELECT qtde_familias_ben FROM {config['localidade']} "
                    "WHERE nr_proposta = :nr_proposta "
                    "AND cod_comunidade_rural = :codigo" + sufixo_lock
                ),
                {
                    "nr_proposta": chave.get("nr_proposta"),
                    "codigo": chave.get("cod_comunidade_rural"),
                },
            )
            row = result.mappings().one_or_none()
            atual_vinculado = row is not None
            atual_quantidade = row.get("qtde_familias_ben") if row is not None else None
            if atual_vinculado != bool(esperado.get("vinculado")):
                conflitos.append(f"Localidade {nome}: o vínculo atual diverge do estado deixado pela aplicação.")
            elif atual_vinculado and atual_quantidade != esperado.get("qtde_familias_ben"):
                conflitos.append(f"Localidade {nome}: a quantidade de famílias foi alterada após a aplicação.")
    return conflitos


async def _validar_cancelamento_carregado(
    db: AsyncSession,
    execucao: dict[str, Any],
    detalhes: list[dict[str, Any]],
    *,
    bloquear_estado: bool = False,
) -> ValidacaoCancelamento:
    resumo = _resumir(detalhes)
    if execucao["status"] == "cancelado":
        return ValidacaoCancelamento(
            pode_cancelar=False,
            status="ja_cancelado",
            motivo_bloqueio="Esta aplicação já foi cancelada.",
            resumo=resumo,
        )
    if execucao["status"] != "sucesso":
        labels = STATUS_EXECUCAO_LABELS.get(execucao["status"], execucao["status"])
        return ValidacaoCancelamento(
            pode_cancelar=False,
            status="bloqueado",
            motivo_bloqueio=f"Execuções com status {labels} não podem ser canceladas.",
            resumo=resumo,
        )
    if await _existe_aplicacao_posterior(db, execucao):
        return ValidacaoCancelamento(
            pode_cancelar=False,
            status="bloqueado",
            motivo_bloqueio=(
                "Esta aplicação não pode ser cancelada porque existe uma aplicação posterior "
                "vigente para o mesmo instrumento. Cancele primeiro a aplicação mais recente."
            ),
            resumo=resumo,
        )
    conflitos = await _conflitos_estado_atual(
        db, execucao, detalhes, bloquear=bloquear_estado
    )
    if conflitos:
        return ValidacaoCancelamento(
            pode_cancelar=False,
            status="bloqueado",
            motivo_bloqueio=" ".join(conflitos),
            resumo=resumo,
        )
    return ValidacaoCancelamento(pode_cancelar=True, status="disponivel", resumo=resumo)


async def validar_cancelamento(
    db: AsyncSession, id_execucao: int
) -> ValidacaoCancelamento:
    execucao, detalhes = await _carregar_execucao_cancelamento(db, id_execucao)
    return await _validar_cancelamento_carregado(db, execucao, detalhes)


async def _reverter_detalhe(
    db: AsyncSession, execucao: dict[str, Any], detalhe: dict[str, Any]
) -> dict[str, Any]:
    entidade = detalhe["entidade"]
    acao_original = detalhe["acao"]
    chave = detalhe.get("chave") or {}
    anterior = detalhe.get("valores_anteriores") or {}
    novo = detalhe.get("valores_novos") or {}
    config = TIPOS[execucao["tipo_instrumento"]]

    if entidade == "municipio":
        chave_nome = "nr_ted" if execucao["tipo_instrumento"] == "ted" else "nr_proposta"
        params = {"chave": chave[chave_nome], "cod_municipio": chave["cod_municipio"]}
        condicao = f"{chave_nome} = :chave AND cod_municipio = :cod_municipio"
        if anterior.get("vinculado"):
            if execucao["tipo_instrumento"] == "ted":
                await db.execute(
                    text(
                        f"INSERT INTO {config['municipio']} ({chave_nome}, cod_municipio, proporcao) "
                        "VALUES (:chave, :cod_municipio, :proporcao)"
                    ),
                    {**params, "proporcao": anterior.get("proporcao")},
                )
            else:
                await db.execute(
                    text(
                        f"INSERT INTO {config['municipio']} ({chave_nome}, cod_municipio) "
                        "VALUES (:chave, :cod_municipio)"
                    ),
                    params,
                )
        else:
            await db.execute(text(f"DELETE FROM {config['municipio']} WHERE {condicao}"), params)
    elif entidade == "localidade":
        params = {
            "nr_proposta": chave["nr_proposta"],
            "codigo": chave["cod_comunidade_rural"],
        }
        condicao = "nr_proposta = :nr_proposta AND cod_comunidade_rural = :codigo"
        if anterior.get("vinculado") and not novo.get("vinculado"):
            await db.execute(
                text(
                    f"INSERT INTO {config['localidade']} "
                    "(cod_comunidade_rural, nr_proposta, qtde_familias_ben) "
                    "VALUES (:codigo, :nr_proposta, :quantidade)"
                ),
                {**params, "quantidade": anterior.get("qtde_familias_ben")},
            )
        elif not anterior.get("vinculado") and novo.get("vinculado"):
            await db.execute(text(f"DELETE FROM {config['localidade']} WHERE {condicao}"), params)
        elif anterior.get("vinculado") and novo.get("vinculado"):
            await db.execute(
                text(
                    f"UPDATE {config['localidade']} SET qtde_familias_ben = :quantidade "
                    f"WHERE {condicao}"
                ),
                {**params, "quantidade": anterior.get("qtde_familias_ben")},
            )

    acao_reversao = {
        "adicionar": "desfazer_adicao",
        "remover": "desfazer_remocao",
        "corrigir": "desfazer_correcao",
        "incorporar_avaliacao": "desfazer_incorporacao",
    }.get(acao_original, f"desfazer_{acao_original}")
    return {
        "entidade": entidade,
        "acao": acao_reversao,
        "resultado": "revertido",
        "chave": chave,
        "valores_anteriores": novo,
        "valores_novos": anterior,
        "mensagem": detalhe.get("mensagem"),
    }


async def cancelar_aplicacao(
    db: AsyncSession,
    id_execucao: int,
    usuario: UsuarioAutenticado,
    motivo: str,
    *,
    id_solicitacao: int | None = None,
    observacao_resposta: str | None = None,
) -> ExecucaoAplicacaoResponse:
    motivo = motivo.strip()
    if not motivo:
        raise HTTPException(status_code=422, detail="O motivo do cancelamento é obrigatório.")
    await db.rollback()
    ja_cancelada = False
    try:
        async with db.begin():
            solicitacao = None
            if id_solicitacao is not None:
                solicitacao_result = await db.execute(
                    text(
                        """
                        SELECT id_solicitacao, id_execucao, status, motivo_solicitacao
                        FROM painel_dsr.tb_solicitacao_cancelamento_aplicacao
                        WHERE id_solicitacao = :id_solicitacao
                        FOR UPDATE
                        """
                    ),
                    {"id_solicitacao": id_solicitacao},
                )
                solicitacao_row = solicitacao_result.mappings().one_or_none()
                if solicitacao_row is None:
                    raise HTTPException(status_code=404, detail="Solicitação não encontrada.")
                solicitacao = dict(solicitacao_row)
                if solicitacao["id_execucao"] != id_execucao:
                    raise HTTPException(status_code=409, detail="A solicitação não pertence a esta execução.")
                if solicitacao["status"] != "pendente":
                    raise HTTPException(status_code=409, detail="Esta solicitação já foi respondida.")
            execucao, detalhes = await _carregar_execucao_cancelamento(
                db, id_execucao, bloquear=True
            )
            if execucao["status"] == "cancelado":
                if solicitacao is not None:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="A aplicação já foi cancelada; a solicitação permanece pendente para tratamento administrativo.",
                    )
                ja_cancelada = True
            else:
                chave_instrumento = (
                    f"{execucao['tipo_instrumento']}:{_identificador(execucao)}"
                )
                await db.execute(
                    text("SELECT pg_advisory_xact_lock(:chave)"),
                    {"chave": _advisory_key(chave_instrumento)},
                )
                validacao = await _validar_cancelamento_carregado(
                    db, execucao, detalhes, bloquear_estado=True
                )
                if not validacao.pode_cancelar:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=validacao.motivo_bloqueio,
                    )

                reversoes: list[dict[str, Any]] = []
                for detalhe in reversed(_detalhes_com_efeito(detalhes)):
                    reversao = await _reverter_detalhe(db, execucao, detalhe)
                    await _registrar_detalhe(db, id_execucao, reversao)
                    reversoes.append(reversao)

                final_result = await db.execute(
                    text(
                        """
                        UPDATE painel_dsr.tb_execucao_aplicacao_revisao
                        SET status = 'cancelado', cancelado_em = NOW(),
                            id_usuario_cancelamento = :id_usuario,
                            motivo_cancelamento = :motivo
                        WHERE id_execucao = :id_execucao AND status = 'sucesso'
                        RETURNING cancelado_em
                        """
                    ),
                    {
                        "id_execucao": id_execucao,
                        "id_usuario": usuario.id_usuario,
                        "motivo": motivo,
                    },
                )
                if final_result.scalar_one_or_none() is None:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="O estado da execução mudou durante o cancelamento.",
                    )
                await _atualizar_views_consolidadas(
                    db,
                    possui_publico_alvo=any(d["entidade"] == "publico_alvo" for d in detalhes),
                    possui_obras=any(d["entidade"] == "obra" for d in detalhes),
                )
                if solicitacao is not None:
                    await db.execute(
                        text(
                            """
                            UPDATE painel_dsr.tb_solicitacao_cancelamento_aplicacao
                            SET status = 'aprovada',
                                id_usuario_resposta = :id_usuario,
                                respondido_em = NOW(),
                                observacao_resposta = :observacao
                            WHERE id_solicitacao = :id_solicitacao AND status = 'pendente'
                            """
                        ),
                        {
                            "id_solicitacao": id_solicitacao,
                            "id_usuario": usuario.id_usuario,
                            "observacao": (observacao_resposta or "").strip() or None,
                        },
                    )
                tipo_notificacao = (
                    "cancelamento_aprovado"
                    if solicitacao is not None
                    else "aplicacao_cancelada"
                )
                await criar_notificacao(
                    db,
                    id_usuario=execucao["id_usuario_revisao"],
                    tipo=tipo_notificacao,
                    chave_evento=(
                        f"cancelamento_aprovado:{id_solicitacao}"
                        if solicitacao is not None
                        else f"aplicacao_cancelada:{id_execucao}"
                    ),
                    id_revisao=execucao["id_revisao"],
                )
    except HTTPException:
        await db.rollback()
        raise
    except (SQLAlchemyError, ValueError, KeyError) as exc:
        await db.rollback()
        logger.exception("Falha ao cancelar a execução %s", id_execucao)
        raise HTTPException(
            status_code=500,
            detail="Não foi possível cancelar a aplicação. Nenhuma alteração foi desfeita.",
        ) from exc

    resposta = await obter_execucao(db, id_execucao)
    if ja_cancelada:
        resposta.mensagem = "Esta aplicação já foi cancelada."
    return resposta


def _solicitacao_response(row: dict[str, Any]) -> SolicitacaoCancelamentoResponse:
    tipo = row.get("tipo_instrumento")
    identificador = _identificador(row) if tipo else None
    return SolicitacaoCancelamentoResponse(
        **row,
        tipo_instrumento_label=TIPOS.get(tipo, {}).get("label", tipo) if tipo else None,
        identificador_instrumento=identificador,
    )


async def obter_solicitacao_relevante(
    db: AsyncSession, id_execucao: int
) -> SolicitacaoCancelamentoResponse | None:
    result = await db.execute(
        text(
            """
            SELECT s.*, e.id_revisao, e.status AS status_execucao, e.cancelado_em,
                   e.motivo_cancelamento, r.tipo_instrumento, r.nr_instrumento,
                   r.nr_proposta, r.nr_ted, r.identificador_busca,
                   us.nome AS usuario_solicitante, ur.nome AS usuario_resposta,
                   uc.nome AS administrador_cancelamento
            FROM painel_dsr.tb_solicitacao_cancelamento_aplicacao s
            JOIN painel_dsr.tb_execucao_aplicacao_revisao e ON e.id_execucao = s.id_execucao
            JOIN painel_dsr.tb_revisao_instrumento r ON r.id_revisao = e.id_revisao
            JOIN painel_dsr.tb_usuario us ON us.id_usuario = s.id_usuario_solicitante
            LEFT JOIN painel_dsr.tb_usuario ur ON ur.id_usuario = s.id_usuario_resposta
            LEFT JOIN painel_dsr.tb_usuario uc ON uc.id_usuario = e.id_usuario_cancelamento
            WHERE s.id_execucao = :id_execucao
            ORDER BY (s.status = 'pendente') DESC, s.solicitado_em DESC, s.id_solicitacao DESC
            LIMIT 1
            """
        ),
        {"id_execucao": id_execucao},
    )
    row = result.mappings().one_or_none()
    return _solicitacao_response(dict(row)) if row else None


async def solicitar_cancelamento(
    db: AsyncSession,
    id_revisao: int,
    usuario: UsuarioAutenticado,
    motivo: str,
) -> SolicitacaoCancelamentoResponse:
    motivo = motivo.strip()
    if not motivo:
        raise HTTPException(status_code=422, detail="O motivo da solicitação é obrigatório.")
    revisao_result = await db.execute(
        text(
            """
            SELECT r.id_revisao, r.id_usuario, r.id_execucao_atualizacao,
                   e.status AS status_execucao
            FROM painel_dsr.tb_revisao_instrumento r
            LEFT JOIN painel_dsr.tb_execucao_aplicacao_revisao e
              ON e.id_execucao = r.id_execucao_atualizacao
            WHERE r.id_revisao = :id_revisao
            """
        ),
        {"id_revisao": id_revisao},
    )
    revisao = revisao_result.mappings().one_or_none()
    if revisao is None:
        raise HTTPException(status_code=404, detail="Revisão não encontrada.")
    if revisao["id_usuario"] != usuario.id_usuario:
        raise HTTPException(status_code=403, detail="Você só pode solicitar o cancelamento de uma revisão enviada por você.")
    id_execucao = revisao["id_execucao_atualizacao"]
    if id_execucao is None:
        raise HTTPException(status_code=409, detail="Esta revisão ainda não possui uma aplicação concluída.")
    if revisao["status_execucao"] != "sucesso":
        raise HTTPException(status_code=409, detail="Somente uma aplicação concluída com sucesso pode ter o cancelamento solicitado.")
    validacao = await validar_cancelamento(db, id_execucao)
    if not validacao.pode_cancelar:
        raise HTTPException(status_code=409, detail=validacao.motivo_bloqueio)
    pendente = await db.execute(
        text(
            """
            SELECT id_solicitacao
            FROM painel_dsr.tb_solicitacao_cancelamento_aplicacao
            WHERE id_execucao = :id_execucao AND status = 'pendente'
            LIMIT 1
            """
        ),
        {"id_execucao": id_execucao},
    )
    if pendente.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Já existe uma solicitação de cancelamento pendente para esta aplicação.")
    try:
        result = await db.execute(
            text(
                """
                INSERT INTO painel_dsr.tb_solicitacao_cancelamento_aplicacao (
                    id_execucao, id_usuario_solicitante, motivo_solicitacao,
                    status, solicitado_em
                ) VALUES (:id_execucao, :id_usuario, :motivo, 'pendente', NOW())
                RETURNING id_solicitacao
                """
            ),
            {"id_execucao": id_execucao, "id_usuario": usuario.id_usuario, "motivo": motivo},
        )
        id_solicitacao = result.scalar_one()
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Já existe uma solicitação de cancelamento pendente para esta aplicação.") from exc
    solicitacao = await obter_solicitacao_relevante(db, id_execucao)
    assert solicitacao is not None and solicitacao.id_solicitacao == id_solicitacao
    solicitacao.cancelamento_permitido = True
    return solicitacao


async def listar_solicitacoes_cancelamento(
    db: AsyncSession, *, page: int = 1, page_size: int = 20, status_solicitacao: str | None = None
) -> SolicitacoesCancelamentoResponse:
    params: dict[str, Any] = {"limit": page_size, "offset": (page - 1) * page_size}
    where = ""
    if status_solicitacao:
        where = "WHERE s.status = :status"
        params["status"] = status_solicitacao
    total_result = await db.execute(text(f"SELECT COUNT(*) FROM painel_dsr.tb_solicitacao_cancelamento_aplicacao s {where}"), params)
    total = int(total_result.scalar_one() or 0)
    result = await db.execute(
        text(
            f"""
            SELECT s.*, e.id_revisao, e.status AS status_execucao, e.cancelado_em,
                   e.motivo_cancelamento, r.tipo_instrumento, r.nr_instrumento,
                   r.nr_proposta, r.nr_ted, r.identificador_busca,
                   us.nome AS usuario_solicitante, ur.nome AS usuario_resposta,
                   uc.nome AS administrador_cancelamento
            FROM painel_dsr.tb_solicitacao_cancelamento_aplicacao s
            JOIN painel_dsr.tb_execucao_aplicacao_revisao e ON e.id_execucao = s.id_execucao
            JOIN painel_dsr.tb_revisao_instrumento r ON r.id_revisao = e.id_revisao
            JOIN painel_dsr.tb_usuario us ON us.id_usuario = s.id_usuario_solicitante
            LEFT JOIN painel_dsr.tb_usuario ur ON ur.id_usuario = s.id_usuario_resposta
            LEFT JOIN painel_dsr.tb_usuario uc ON uc.id_usuario = e.id_usuario_cancelamento
            {where}
            ORDER BY (s.status = 'pendente') DESC, s.solicitado_em DESC
            LIMIT :limit OFFSET :offset
            """
        ), params,
    )
    data = []
    for item in result.mappings().all():
        row = dict(item)
        if row["status"] == "pendente" and row["status_execucao"] == "sucesso":
            validacao = await validar_cancelamento(db, row["id_execucao"])
            row["cancelamento_permitido"] = validacao.pode_cancelar
            row["motivo_bloqueio_cancelamento"] = validacao.motivo_bloqueio
        data.append(_solicitacao_response(row))
    return SolicitacoesCancelamentoResponse(data=data, page=page, page_size=page_size, total=total, total_pages=(total + page_size - 1) // page_size)


async def aprovar_solicitacao_cancelamento(
    db: AsyncSession, id_solicitacao: int, usuario: UsuarioAutenticado, observacao: str | None
) -> SolicitacaoCancelamentoResponse:
    result = await db.execute(text("SELECT id_execucao, motivo_solicitacao FROM painel_dsr.tb_solicitacao_cancelamento_aplicacao WHERE id_solicitacao = :id"), {"id": id_solicitacao})
    row = result.mappings().one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")
    await cancelar_aplicacao(db, row["id_execucao"], usuario, row["motivo_solicitacao"], id_solicitacao=id_solicitacao, observacao_resposta=observacao)
    solicitacao = await obter_solicitacao_relevante(db, row["id_execucao"])
    assert solicitacao is not None
    return solicitacao


async def rejeitar_solicitacao_cancelamento(
    db: AsyncSession, id_solicitacao: int, usuario: UsuarioAutenticado, observacao: str | None
) -> SolicitacaoCancelamentoResponse:
    observacao = (observacao or "").strip()
    if not observacao:
        raise HTTPException(status_code=422, detail="A observação da resposta é obrigatória para rejeitar a solicitação.")
    result = await db.execute(
        text(
            """
            UPDATE painel_dsr.tb_solicitacao_cancelamento_aplicacao
            SET status = 'rejeitada', id_usuario_resposta = :id_usuario,
                respondido_em = NOW(), observacao_resposta = :observacao
            WHERE id_solicitacao = :id_solicitacao AND status = 'pendente'
            RETURNING id_execucao
            """
        ),
        {"id_solicitacao": id_solicitacao, "id_usuario": usuario.id_usuario, "observacao": observacao},
    )
    id_execucao = result.scalar_one_or_none()
    if id_execucao is None:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A solicitação não existe ou já foi respondida.")
    revisao = await dados_revisao_para_notificacao_por_execucao(db, id_execucao)
    if revisao is not None:
        await criar_notificacao(
            db,
            id_usuario=revisao["id_usuario"],
            tipo="cancelamento_rejeitado",
            chave_evento=f"cancelamento_rejeitado:{id_solicitacao}",
            id_revisao=revisao["id_revisao"],
        )
    await db.commit()
    solicitacao = await obter_solicitacao_relevante(db, id_execucao)
    assert solicitacao is not None
    return solicitacao


async def _registrar_falha(
    db: AsyncSession, id_revisao: int, usuario: UsuarioAutenticado, mensagem: str
) -> None:
    try:
        result = await db.execute(
            text(
                """
                INSERT INTO painel_dsr.tb_execucao_aplicacao_revisao (
                    id_revisao, id_usuario_admin, status, iniciado_em,
                    concluido_em, mensagem_erro
                ) VALUES (:id_revisao, :id_usuario, 'falha', NOW(), NOW(), :mensagem)
                RETURNING id_execucao
                """
            ),
            {"id_revisao": id_revisao, "id_usuario": usuario.id_usuario, "mensagem": mensagem[:2000]},
        )
        id_execucao = result.scalar_one()
        revisao = await dados_revisao_para_notificacao(db, id_revisao)
        if revisao is not None:
            await criar_notificacao(
                db,
                id_usuario=revisao["id_usuario"],
                tipo="aplicacao_falhou",
                chave_evento=f"aplicacao_falhou:{id_execucao}",
                id_revisao=id_revisao,
            )
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        logger.exception("Não foi possível persistir a auditoria da falha da revisão %s", id_revisao)


async def aplicar_revisao(
    db: AsyncSession, id_revisao: int, usuario: UsuarioAutenticado
) -> ExecucaoAplicacaoResponse:
    # A autenticação já consultou o banco nesta sessão. Encerramos essa
    # transação somente-leitura antes da transação administrativa explícita.
    await db.rollback()
    try:
        async with db.begin():
            revisao, municipios, localidades, publico, obras = await _carregar_revisao(
                db, id_revisao, bloquear=True
            )
            chave_instrumento = f"{revisao['tipo_instrumento']}:{_identificador(revisao)}"
            await db.execute(
                text("SELECT pg_advisory_xact_lock(:chave)"),
                {"chave": _advisory_key(chave_instrumento)},
            )
            validacao = await _validar(
                db, revisao, municipios, localidades, publico, obras
            )
            if not validacao.aplicavel:
                detalhe = {"mensagem": "Aplicação bloqueada.", "pendencias": validacao.pendencias}
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detalhe)

            exec_result = await db.execute(
                text(
                    """
                    INSERT INTO painel_dsr.tb_execucao_aplicacao_revisao (
                        id_revisao, id_usuario_admin, status, iniciado_em
                    ) VALUES (:id_revisao, :id_usuario, 'em_processamento', NOW())
                    RETURNING id_execucao, iniciado_em
                    """
                ),
                {"id_revisao": id_revisao, "id_usuario": usuario.id_usuario},
            )
            execucao = dict(exec_result.mappings().one())
            detalhes: list[dict[str, Any]] = []

            for item in municipios:
                if item["acao_sugerida"] == "adicionar":
                    detalhes.append(await _aplicar_municipio(db, revisao, item))
            for item in localidades:
                if item["acao_sugerida"] != "manter":
                    detalhes.append(await _aplicar_localidade(db, revisao, item))
            for item in municipios:
                if item["acao_sugerida"] == "remover":
                    detalhes.append(await _aplicar_municipio(db, revisao, item))

            detalhes.extend(_detalhe_publico_alvo(item) for item in publico)
            detalhes.extend(_detalhe_obra(revisao, item) for item in obras)

            for detalhe in detalhes:
                await _registrar_detalhe(db, execucao["id_execucao"], detalhe)
            resumo = _resumir(detalhes)
            revisao_result = await db.execute(
                text(
                    """
                    UPDATE painel_dsr.tb_revisao_instrumento
                    SET aplicado_em = NOW(), id_execucao_atualizacao = :id_execucao
                    WHERE id_revisao = :id_revisao AND aplicado_em IS NULL
                    RETURNING aplicado_em
                    """
                ),
                {"id_execucao": execucao["id_execucao"], "id_revisao": id_revisao},
            )
            aplicado_em = revisao_result.scalar_one_or_none()
            if aplicado_em is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A revisão já foi aplicada por outra execução.",
                )

            final_result = await db.execute(
                text(
                    """
                    UPDATE painel_dsr.tb_execucao_aplicacao_revisao
                    SET status = 'sucesso', concluido_em = NOW(),
                        qtd_municipios = :qtd_municipios,
                        qtd_localidades = :qtd_localidades,
                        qtd_publico_alvo = :qtd_publico_alvo,
                        qtd_obras = :qtd_obras
                    WHERE id_execucao = :id_execucao
                    RETURNING concluido_em
                    """
                ),
                {
                    "id_execucao": execucao["id_execucao"],
                    "qtd_municipios": sum(d["entidade"] == "municipio" for d in detalhes),
                    "qtd_localidades": sum(d["entidade"] == "localidade" for d in detalhes),
                    "qtd_publico_alvo": len(publico),
                    "qtd_obras": len(obras),
                },
            )
            concluido_em = final_result.scalar_one()
            # A view passa a exigir execução com status sucesso. O UPDATE ainda
            # integra a mesma transação: se o refresh falhar, tudo é revertido.
            await _atualizar_views_consolidadas(
                db,
                possui_publico_alvo=bool(publico),
                possui_obras=bool(obras),
            )
            await criar_notificacao(
                db,
                id_usuario=revisao["id_usuario"],
                tipo="revisao_aplicada",
                chave_evento=f"revisao_aplicada:{execucao['id_execucao']}",
                id_revisao=id_revisao,
            )

        return ExecucaoAplicacaoResponse(
            id_execucao=execucao["id_execucao"], id_revisao=id_revisao,
            status="sucesso", iniciado_em=execucao["iniciado_em"],
            concluido_em=concluido_em, aplicado_em=aplicado_em,
            administrador=usuario.nome,
            tipo_instrumento=revisao["tipo_instrumento"],
            tipo_instrumento_label=TIPOS[revisao["tipo_instrumento"]]["label"],
            nr_instrumento=revisao.get("nr_instrumento"),
            nr_proposta=revisao.get("nr_proposta"), nr_ted=revisao.get("nr_ted"),
            identificador_instrumento=_identificador(revisao),
            resumo=resumo, detalhes=[DetalheExecucao(**item) for item in detalhes],
            mensagem="Revisão aplicada com sucesso.",
        )
    except HTTPException:
        await db.rollback()
        raise
    except (SQLAlchemyError, ValueError) as exc:
        await db.rollback()
        logger.exception("Falha ao aplicar a revisão %s", id_revisao)
        mensagem_limite = (
            _mensagem_limite_comunidades(exc)
            if isinstance(exc, SQLAlchemyError)
            else None
        )
        mensagem_auditoria = (
            str(exc)
            if isinstance(exc, ValueError)
            else mensagem_limite
            if mensagem_limite
            else (
                "Falha interna durante a transação ou atualização das bases revisadas; "
                "nenhuma alteração foi confirmada. Detalhes registrados no log do backend."
            )
        )
        await _registrar_falha(db, id_revisao, usuario, mensagem_auditoria)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if isinstance(exc, ValueError) else 500,
            detail=(
                str(exc)
                if isinstance(exc, ValueError)
                else mensagem_limite
                if mensagem_limite
                else "A aplicação ou a atualização das bases revisadas falhou; nenhuma alteração foi confirmada."
            ),
        ) from exc
