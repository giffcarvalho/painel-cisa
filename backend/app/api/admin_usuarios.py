from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import obter_admin_atual
from app.core.database import get_db
from app.schemas.admin_usuarios import (
    AlterarStatusUsuarioRequest, AlterarVinculoRequest, CodigoAcessoResponse,
    InstrumentoBuscaAdmin, InstrumentoUsuarioAdmin, UsuarioAdminDetalhe,
    UsuariosAdminResponse, VincularInstrumentoRequest,
)
from app.schemas.auth import UsuarioAutenticado
from app.services.admin_usuarios import (
    alterar_status_usuario, alterar_vinculo, buscar_instrumentos, listar_usuarios,
    obter_usuario, vincular_instrumento,
)
from app.services.codigo_acesso import emitir_codigo_acesso


router = APIRouter(dependencies=[Depends(obter_admin_atual)])


@router.get("/usuarios", response_model=UsuariosAdminResponse)
async def consultar_usuarios(
    busca: Annotated[str | None, Query(max_length=150)] = None,
    ativo: bool | None = None,
    conta_ativada: bool | None = None,
    perfil: Literal["tecnico", "admin"] | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await listar_usuarios(db, busca=busca, ativo=ativo, conta_ativada=conta_ativada, perfil=perfil)


@router.get("/usuarios/{id_usuario}", response_model=UsuarioAdminDetalhe)
async def consultar_usuario(id_usuario: int, db: AsyncSession = Depends(get_db)):
    return await obter_usuario(db, id_usuario)


@router.patch("/usuarios/{id_usuario}/status", status_code=204)
async def atualizar_status(
    id_usuario: int, payload: AlterarStatusUsuarioRequest,
    admin: UsuarioAutenticado = Depends(obter_admin_atual), db: AsyncSession = Depends(get_db),
):
    await alterar_status_usuario(db, id_usuario, payload.ativo, admin.id_usuario)


@router.post("/usuarios/{id_usuario}/codigo-acesso", response_model=CodigoAcessoResponse)
async def gerar_codigo(id_usuario: int, db: AsyncSession = Depends(get_db)):
    codigo, expira_em = await emitir_codigo_acesso(db, id_usuario)
    return CodigoAcessoResponse(codigo=codigo, expira_em=expira_em)


@router.get("/instrumentos/busca", response_model=list[InstrumentoBuscaAdmin])
async def pesquisar_instrumentos(q: Annotated[str, Query(min_length=2, max_length=100)], db: AsyncSession = Depends(get_db)):
    return await buscar_instrumentos(db, q)


@router.post("/usuarios/{id_usuario}/instrumentos", response_model=InstrumentoUsuarioAdmin)
async def adicionar_instrumento(id_usuario: int, payload: VincularInstrumentoRequest, db: AsyncSession = Depends(get_db)):
    return await vincular_instrumento(db, id_usuario, payload.nr_instrumento)


@router.patch("/usuarios/{id_usuario}/instrumentos/{nr_instrumento}", response_model=InstrumentoUsuarioAdmin)
async def atualizar_vinculo(id_usuario: int, nr_instrumento: str, payload: AlterarVinculoRequest, db: AsyncSession = Depends(get_db)):
    return await alterar_vinculo(db, id_usuario, nr_instrumento, payload.ativo)
