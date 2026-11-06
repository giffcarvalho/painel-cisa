"""Consultas administrativas, prévia verificável e aplicação em lote bloqueável."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import obter_admin_atual
from app.core.database import get_db
from app.core.config import settings
from app.schemas.distribuicao_instrumentos import (
    ConsultaDistribuicao,
    ConsultaDistribuicaoResponse,
    FiltrosDistribuicao,
    PreviaDistribuicao,
    AplicarDistribuicao,
)
from app.schemas.auth import UsuarioAutenticado
from app.services import distribuicao_instrumentos as service
from app.services import distribuicao_lote

router = APIRouter(dependencies=[Depends(obter_admin_atual)])


@router.get("/configuracao")
async def configuracao():
    # Controla apenas a aplicação definitiva; consultas e prévia são administrativas.
    return {"habilitada": settings.DISTRIBUICAO_INSTRUMENTOS_HABILITADA}


@router.post("/previa")
async def previa(
    payload: PreviaDistribuicao,
    admin: UsuarioAutenticado = Depends(obter_admin_atual),
    db: AsyncSession = Depends(get_db),
):
    return await distribuicao_lote.previa(db, payload, admin)


@router.post("/aplicar", dependencies=[Depends(distribuicao_lote.exigir_habilitada)])
async def aplicar(
    payload: AplicarDistribuicao,
    admin: UsuarioAutenticado = Depends(obter_admin_atual),
    db: AsyncSession = Depends(get_db),
):
    return await distribuicao_lote.aplicar(db, payload, admin)


class LimiteCorpoDistribuicao:
    """Limita o corpo antes do parser JSON, sem alterar os endpoints existentes."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        protegidos = ("/api/v1/admin/distribuicao-instrumentos/previa",
                      "/api/v1/admin/distribuicao-instrumentos/aplicar")
        if scope["type"] != "http" or scope["path"].rstrip("/") not in protegidos:
            return await self.app(scope, receive, send)
        from starlette.responses import JSONResponse

        limite = 256 * 1024
        partes, tamanho = [], 0
        while True:
            mensagem = await receive()
            if mensagem["type"] == "http.disconnect":
                return
            corpo = mensagem.get("body", b"")
            tamanho += len(corpo)
            if tamanho > limite:
                resposta = JSONResponse(status_code=413, content={
                    "detail": "Requisição muito grande. Selecione no máximo 1.000 instrumentos."})
                return await resposta(scope, receive, send)
            partes.append(corpo)
            if not mensagem.get("more_body", False):
                break
        entregue = False

        async def receber():
            nonlocal entregue
            if not entregue:
                entregue = True
                return {"type": "http.request", "body": b"".join(partes), "more_body": False}
            return await receive()

        return await self.app(scope, receber, send)


@router.get("/catalogo")
async def catalogo(db: AsyncSession = Depends(get_db)):
    return await service.catalogo(db)


@router.get("/municipios")
async def municipios(
    cod_uf: Annotated[int, Query(gt=0)],
    db: AsyncSession = Depends(get_db),
):
    return await service.municipios(db, cod_uf)


@router.get("/opcoes/{campo}")
async def opcoes(
    campo: str,
    q: Annotated[str, Query(min_length=2, max_length=150)],
    db: AsyncSession = Depends(get_db),
):
    return await service.opcoes(db, campo, q)


@router.post("/consulta", response_model=ConsultaDistribuicaoResponse)
async def consultar(
    payload: ConsultaDistribuicao,
    db: AsyncSession = Depends(get_db),
):
    return await service.consultar(db, payload)


@router.post("/opcoes")
async def opcoes_contextuais(
    filtros: FiltrosDistribuicao,
    db: AsyncSession = Depends(get_db),
):
    return await service.opcoes_contextuais(db, filtros)
