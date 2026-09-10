"""Persistência idempotente de eventos pessoais de negócio."""

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def identificador_instrumento(revisao: dict[str, Any]) -> str:
    if revisao.get("tipo_instrumento") == "ted":
        return str(revisao.get("nr_ted") or revisao.get("identificador_busca") or "-")
    return str(
        revisao.get("nr_instrumento")
        or revisao.get("nr_proposta")
        or revisao.get("identificador_busca")
        or "-"
    )


async def criar_notificacao(
    db: AsyncSession,
    *,
    id_usuario: int,
    tipo: str,
    chave_evento: str,
    id_revisao: int,
) -> None:
    """Cria uma notificação na transação corrente, sem efetuar commit próprio."""
    await db.execute(
        text(
            """
            INSERT INTO painel_dsr.tb_notificacao_usuario (
                id_usuario, tipo, chave_evento, id_revisao, criado_em
            ) VALUES (
                :id_usuario, :tipo, :chave_evento, :id_revisao, NOW()
            )
            ON CONFLICT (id_usuario, chave_evento) DO NOTHING
            """
        ),
        {
            "id_usuario": id_usuario,
            "tipo": tipo,
            "chave_evento": chave_evento,
            "id_revisao": id_revisao,
        },
    )


def montar_mensagem_notificacao(tipo: str, revisao: dict[str, Any]) -> str:
    """Monta a mensagem pública sem depender de texto persistido na notificação."""
    numero_revisao = revisao["id_revisao"]
    instrumento = identificador_instrumento(revisao)

    mensagens = {
        "revisao_enviada": (
            f"Revisão {numero_revisao} do instrumento {instrumento} enviada com sucesso."
        ),
        "revisao_aplicada": (
            f"Revisão {numero_revisao} do instrumento {instrumento} foi aplicada ao banco."
        ),
        "aplicacao_cancelada": (
            f"Aplicação da revisão {numero_revisao} do instrumento {instrumento} foi cancelada."
        ),
        "cancelamento_aprovado": (
            f"Solicitação de cancelamento da revisão {numero_revisao} "
            f"do instrumento {instrumento} foi aprovada."
        ),
        "solicitacao_cancelamento_aprovada": (
            f"Solicitação de cancelamento da revisão {numero_revisao} "
            f"do instrumento {instrumento} foi aprovada."
        ),
        "cancelamento_rejeitado": (
            f"Solicitação de cancelamento da revisão {numero_revisao} "
            f"do instrumento {instrumento} foi rejeitada."
        ),
        "solicitacao_cancelamento_rejeitada": (
            f"Solicitação de cancelamento da revisão {numero_revisao} "
            f"do instrumento {instrumento} foi rejeitada."
        ),
        "aplicacao_falhou": (
            f"Não foi possível aplicar a revisão {numero_revisao} "
            f"do instrumento {instrumento}."
        ),
    }
    return mensagens.get(
        tipo,
        f"Há uma atualização na revisão {numero_revisao} do instrumento {instrumento}.",
    )


async def dados_revisao_para_notificacao(
    db: AsyncSession, id_revisao: int
) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT id_revisao, id_usuario, tipo_instrumento, nr_instrumento,
                   nr_proposta, nr_ted, identificador_busca
            FROM painel_dsr.tb_revisao_instrumento
            WHERE id_revisao = :id_revisao
            """
        ),
        {"id_revisao": id_revisao},
    )
    row = result.mappings().one_or_none()
    return dict(row) if row else None


async def dados_revisao_para_notificacao_por_execucao(
    db: AsyncSession, id_execucao: int
) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT r.id_revisao, r.id_usuario, r.tipo_instrumento,
                   r.nr_instrumento, r.nr_proposta, r.nr_ted,
                   r.identificador_busca
            FROM painel_dsr.tb_execucao_aplicacao_revisao e
            JOIN painel_dsr.tb_revisao_instrumento r
              ON r.id_revisao = e.id_revisao
            WHERE e.id_execucao = :id_execucao
            """
        ),
        {"id_execucao": id_execucao},
    )
    row = result.mappings().one_or_none()
    return dict(row) if row else None
