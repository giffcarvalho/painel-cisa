"""Endpoints exclusivos de administração para aplicação de revisões."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import obter_usuario_atual
from app.core.database import get_db
from app.schemas.aplicacao_revisoes import (
    CancelamentoAplicacaoRequest,
    ExecucaoAplicacaoResponse,
    HistoricoAplicacoesResponse,
    RevisaoAplicacaoDetalhe,
    RevisoesPendentesResponse,
    ValidacaoAplicacao,
    ValidacaoCancelamento,
    RespostaSolicitacaoCancelamentoRequest,
    SolicitacaoCancelamentoResponse,
    SolicitacoesCancelamentoResponse,
)
from app.schemas.auth import UsuarioAutenticado
from app.services.aplicacao_revisoes import (
    aplicar_revisao,
    cancelar_aplicacao,
    exigir_admin,
    listar_pendentes,
    listar_historico,
    obter_execucao,
    obter_detalhe,
    validar_aplicacao,
    validar_cancelamento,
    aprovar_solicitacao_cancelamento,
    listar_solicitacoes_cancelamento,
    rejeitar_solicitacao_cancelamento,
)


router = APIRouter()


@router.get("/solicitacoes-cancelamento", response_model=SolicitacoesCancelamentoResponse)
async def consultar_solicitacoes_cancelamento(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 20,
    status_solicitacao: Annotated[
        Literal["pendente", "aprovada", "rejeitada"] | None, Query(alias="status")
    ] = None,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await listar_solicitacoes_cancelamento(
        db, page=page, page_size=page_size, status_solicitacao=status_solicitacao
    )


@router.post(
    "/solicitacoes-cancelamento/{id_solicitacao}/aprovar",
    response_model=SolicitacaoCancelamentoResponse,
)
async def aprovar_solicitacao(
    id_solicitacao: int,
    payload: RespostaSolicitacaoCancelamentoRequest,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await aprovar_solicitacao_cancelamento(
        db, id_solicitacao, usuario, payload.observacao_resposta
    )


@router.post(
    "/solicitacoes-cancelamento/{id_solicitacao}/rejeitar",
    response_model=SolicitacaoCancelamentoResponse,
)
async def rejeitar_solicitacao(
    id_solicitacao: int,
    payload: RespostaSolicitacaoCancelamentoRequest,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await rejeitar_solicitacao_cancelamento(
        db, id_solicitacao, usuario, payload.observacao_resposta
    )


@router.get("/pendentes", response_model=RevisoesPendentesResponse)
async def listar_revisoes_pendentes(
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await listar_pendentes(db)


@router.get("/historico", response_model=HistoricoAplicacoesResponse)
async def consultar_historico(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
    busca: Annotated[str | None, Query(max_length=100)] = None,
    status_execucao: Annotated[
        Literal["em_processamento", "sucesso", "falha", "cancelado"] | None,
        Query(alias="status"),
    ] = None,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await listar_historico(
        db, page=page, page_size=page_size, busca=busca,
        status_execucao=status_execucao,
    )


@router.get("/execucoes/{id_execucao}", response_model=ExecucaoAplicacaoResponse)
async def detalhar_execucao(
    id_execucao: int,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await obter_execucao(db, id_execucao)


@router.post(
    "/execucoes/{id_execucao}/validar-cancelamento",
    response_model=ValidacaoCancelamento,
)
async def pre_validar_cancelamento_execucao(
    id_execucao: int,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await validar_cancelamento(db, id_execucao)


@router.post(
    "/execucoes/{id_execucao}/cancelar",
    response_model=ExecucaoAplicacaoResponse,
)
async def cancelar_execucao_aplicacao(
    id_execucao: int,
    payload: CancelamentoAplicacaoRequest,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await cancelar_aplicacao(db, id_execucao, usuario, payload.motivo)


@router.get("/{id_revisao}", response_model=RevisaoAplicacaoDetalhe)
async def detalhar_revisao(
    id_revisao: int,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await obter_detalhe(db, id_revisao)


@router.post("/{id_revisao}/validar", response_model=ValidacaoAplicacao)
async def pre_validar_revisao(
    id_revisao: int,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await validar_aplicacao(db, id_revisao)


@router.post("/{id_revisao}/aplicar", response_model=ExecucaoAplicacaoResponse)
async def confirmar_aplicacao_revisao(
    id_revisao: int,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    exigir_admin(usuario)
    return await aplicar_revisao(db, id_revisao, usuario)
