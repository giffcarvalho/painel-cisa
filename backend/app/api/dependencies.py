from typing import Annotated

from fastapi import Depends

from app.api.auth import obter_usuario_atual
from app.core.autorizacao import exigir_admin
from app.schemas.auth import UsuarioAutenticado


async def obter_admin_atual(
    usuario: Annotated[UsuarioAutenticado, Depends(obter_usuario_atual)],
) -> UsuarioAutenticado:
    return exigir_admin(usuario)
