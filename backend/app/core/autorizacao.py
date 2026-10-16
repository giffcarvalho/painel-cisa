from fastapi import HTTPException, status

from app.schemas.auth import UsuarioAutenticado


def exigir_admin(usuario: UsuarioAutenticado) -> UsuarioAutenticado:
    if str(usuario.perfil or "").strip().lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
    return usuario
