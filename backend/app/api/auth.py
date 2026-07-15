from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import criar_token_acesso, decodificar_token_acesso, verificar_senha
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioAutenticado


router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def _jwt_secret_key() -> str:
    try:
        return settings.jwt_secret_key
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Configuração de autenticação ausente.",
        ) from exc


async def obter_usuario_atual(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> UsuarioAutenticado:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente.",
        )

    payload = decodificar_token_acesso(
        credentials.credentials,
        _jwt_secret_key(),
        settings.JWT_ALGORITHM,
    )

    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido ou expirado.",
        )

    try:
        id_usuario = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido ou expirado.",
        )

    result = await db.execute(
        text(
            """
            SELECT id_usuario, nome, email, perfil
            FROM painel_dsr.tb_usuario
            WHERE id_usuario = :id_usuario
              AND ativo IS TRUE
            LIMIT 1
            """
        ),
        {"id_usuario": id_usuario},
    )

    row = result.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário autenticado não encontrado ou inativo.",
        )

    return UsuarioAutenticado(**dict(row))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="E-mail ou senha inválidos.",
    )

    try:
        result = await db.execute(
            text(
                """
                SELECT
                    id_usuario,
                    nome,
                    email,
                    senha_hash,
                    perfil,
                    ativo
                FROM painel_dsr.tb_usuario
                WHERE LOWER(BTRIM(email)) = LOWER(BTRIM(:email))
                LIMIT 1
                """
            ),
            {"email": payload.email},
        )
        usuario = result.mappings().one_or_none()

        if (
            usuario is None
            or usuario["ativo"] is not True
            or not verificar_senha(payload.senha, usuario["senha_hash"])
        ):
            raise credenciais_invalidas

        await db.execute(
            text(
                """
                UPDATE painel_dsr.tb_usuario
                SET ultimo_acesso_em = NOW(),
                    atualizado_em = NOW()
                WHERE id_usuario = :id_usuario
                """
            ),
            {"id_usuario": usuario["id_usuario"]},
        )
        await db.commit()

        usuario_autenticado = UsuarioAutenticado(
            id_usuario=usuario["id_usuario"],
            nome=usuario["nome"],
            email=usuario["email"],
            perfil=usuario["perfil"],
        )
        expires_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

        token = criar_token_acesso(
            {
                "sub": str(usuario_autenticado.id_usuario),
                "email": usuario_autenticado.email,
                "perfil": usuario_autenticado.perfil,
            },
            _jwt_secret_key(),
            settings.JWT_ALGORITHM,
            expires_minutes,
        )

        return TokenResponse(
            access_token=token,
            expires_in=expires_minutes * 60,
            usuario=usuario_autenticado,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao autenticar usuário.",
        )


@router.get("/me", response_model=UsuarioAutenticado)
async def me(usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual)):
    return usuario_atual
