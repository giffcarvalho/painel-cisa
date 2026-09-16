from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import obter_admin_atual
from app.core.database import get_db
from app.schemas.admin_usuarios import (
    AlterarSetorRequest, AlterarSetorResponse, AlterarStatusUsuarioRequest,
    AlterarVinculoRequest, CodigoAcessoResponse, CriarUsuarioRequest,
    CriarUsuarioResponse,
    InstrumentoBuscaAdmin, InstrumentoUsuarioAdmin, InstrumentosUsuarioAdminResponse,
    PendenciaInstrumentoDetalheAdmin, PendenciasUsuarioAdmin,
    RascunhosUsuarioAdminResponse, RevisoesUsuarioAdminResponse, SetorAdmin,
    UsuarioAdminDetalhe,
    UsuariosAdminResponse, VincularInstrumentoRequest,
)
from app.schemas.auth import UsuarioAutenticado
from app.services.admin_usuarios import (
    alterar_setor_tecnico, alterar_status_usuario, alterar_vinculo,
    buscar_instrumentos, cancelar_rascunho_usuario, criar_usuario,
    detalhar_pendencias_instrumento, listar_rascunhos_usuario,
    listar_setores_ativos, listar_usuarios,
    listar_instrumentos_usuario, listar_revisoes_usuario, obter_usuario,
    vincular_instrumento, _calcular_pendencias, _usuario_base,
)
from app.services.codigo_acesso import emitir_codigo_acesso


router = APIRouter(dependencies=[Depends(obter_admin_atual)])


@router.get("/setores", response_model=list[SetorAdmin])
async def consultar_setores(db: AsyncSession = Depends(get_db)):
    return await listar_setores_ativos(db)


@router.post(
    "/usuarios", response_model=CriarUsuarioResponse, status_code=status.HTTP_201_CREATED
)
async def adicionar_usuario(
    payload: CriarUsuarioRequest, db: AsyncSession = Depends(get_db)
):
    return await criar_usuario(db, **payload.model_dump())


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


@router.get("/usuarios/{id_usuario}/instrumentos", response_model=InstrumentosUsuarioAdminResponse)
async def consultar_instrumentos_usuario(
    id_usuario: int,
    busca: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 5,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
):
    return await listar_instrumentos_usuario(db, id_usuario, busca=busca, limit=limit, offset=offset)


@router.get("/usuarios/{id_usuario}/revisoes", response_model=RevisoesUsuarioAdminResponse)
async def consultar_revisoes_usuario(
    id_usuario: int,
    busca: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 5,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
):
    return await listar_revisoes_usuario(db, id_usuario, busca=busca, limit=limit, offset=offset)


@router.get("/usuarios/{id_usuario}/pendencias", response_model=PendenciasUsuarioAdmin)
async def consultar_pendencias_usuario(
    id_usuario: int,
    busca: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 5,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
):
    base = await _usuario_base(db, id_usuario)
    if str(base["perfil"]).lower() != "tecnico":
        return PendenciasUsuarioAdmin(total=0, concluidas=0, abertas=0, percentual_concluido=100)
    usuario = UsuarioAutenticado(id_usuario=id_usuario, nome=base["nome"], email=base["email"], perfil=base["perfil"])
    return await _calcular_pendencias(db, usuario, busca=busca, limit=limit, offset=offset)


@router.get(
    "/usuarios/{id_usuario}/pendencias/{identificador}",
    response_model=PendenciaInstrumentoDetalheAdmin,
)
async def consultar_detalhe_pendencias(
    id_usuario: int, identificador: str, db: AsyncSession = Depends(get_db)
):
    return await detalhar_pendencias_instrumento(db, id_usuario, identificador)


@router.get(
    "/usuarios/{id_usuario}/rascunhos", response_model=RascunhosUsuarioAdminResponse
)
async def consultar_rascunhos_usuario(
    id_usuario: int,
    limit: Annotated[int, Query(ge=1, le=100)] = 5,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
):
    return await listar_rascunhos_usuario(db, id_usuario, limit=limit, offset=offset)


@router.delete("/usuarios/{id_usuario}/rascunhos/{id_revisao}")
async def remover_rascunho_usuario(
    id_usuario: int, id_revisao: int, db: AsyncSession = Depends(get_db)
):
    return await cancelar_rascunho_usuario(db, id_usuario, id_revisao)


@router.patch(
    "/usuarios/{id_usuario}/setor", response_model=AlterarSetorResponse
)
async def atualizar_setor_usuario(
    id_usuario: int,
    payload: AlterarSetorRequest,
    db: AsyncSession = Depends(get_db),
):
    return await alterar_setor_tecnico(db, id_usuario, payload.id_setor)


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
