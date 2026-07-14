from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import criar_token_acesso, decodificar_token_acesso, gerar_hash_senha, verificar_senha
from app.schemas.auth import (
    LoginRequest,
    PrimeiroAcessoRequest,
    PrimeiroAcessoResponse,
    TokenResponse,
    UsuarioAutenticado,
)

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


async def obter_usuario_atual(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> UsuarioAutenticado:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente.",
        )

    payload = decodificar_token_acesso(credentials.credentials, settings.AUTH_SECRET_KEY)

    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido ou expirado.",
        )

    result = await db.execute(
        text(
            """
            SELECT id_usuario, nome, email, perfil
            FROM painel_dsr.tb_teste_usuarios
            WHERE id_usuario = :id_usuario
              AND ativo IS TRUE
            LIMIT 1
            """
        ),
        {"id_usuario": int(payload["sub"])},
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
    result = await db.execute(
        text(
            """
            SELECT id_usuario, nome, email, senha_hash, perfil
            FROM painel_dsr.tb_teste_usuarios
            WHERE lower(email) = lower(:email)
              AND ativo IS TRUE
            LIMIT 1
            """
        ),
        {"email": payload.email},
    )

    usuario = result.mappings().one_or_none()

    if usuario is None or not verificar_senha(payload.senha, usuario["senha_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    token = criar_token_acesso(
        {
            "sub": str(usuario["id_usuario"]),
            "email": usuario["email"],
        },
        settings.AUTH_SECRET_KEY,
    )

    return TokenResponse(access_token=token)


@router.post(
    "/primeiro-acesso",
    response_model=PrimeiroAcessoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def primeiro_acesso(
    payload: PrimeiroAcessoRequest,
    db: AsyncSession = Depends(get_db),
):
    nome = payload.nome.strip()
    codigo_verificacao_raw = payload.codigo_verificacao.strip()
    email = payload.email.strip().lower()
    senha = payload.senha

    if not nome:
        raise HTTPException(status_code=400, detail="Nome obrigatório.")

    if not codigo_verificacao_raw:
        raise HTTPException(status_code=400, detail="Código de verificação obrigatório.")

    try:
        codigo_verificacao = int(codigo_verificacao_raw)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Código de verificação inválido.",
        )

    if not email:
        raise HTTPException(status_code=400, detail="E-mail obrigatório.")

    if not senha or not senha.strip():
        raise HTTPException(status_code=400, detail="Senha obrigatória.")

    if len(senha) < 8:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 8 caracteres.")

    try:
        usuario_existente = await db.execute(
            text(
                """
                SELECT id_usuario
                FROM painel_dsr.tb_teste_usuarios
                WHERE lower(email) = lower(:email)
                LIMIT 1
                """
            ),
            {"email": email},
        )

        if usuario_existente.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="Usuário já cadastrado.")

        pre_cadastro_result = await db.execute(
            text(
                """
                SELECT id_pre_cadastro, nome, codigo_verificacao, perfil, ativo, utilizado
                FROM painel_dsr.tb_teste_pre_cadastro_usuarios
                WHERE lower(nome) = lower(:nome)
                  AND codigo_verificacao = :codigo_verificacao
                LIMIT 1
                FOR UPDATE
                """
            ),
            {
                "nome": nome,
                "codigo_verificacao": codigo_verificacao,
            },
        )

        pre_cadastro = pre_cadastro_result.mappings().one_or_none()

        if pre_cadastro is None or pre_cadastro["ativo"] is not True:
            raise HTTPException(
                status_code=400,
                detail="Nome ou código de verificação inválido.",
            )

        if pre_cadastro["utilizado"] is True:
            raise HTTPException(status_code=409, detail="Código já utilizado.")

        perfil = pre_cadastro["perfil"]

        if perfil not in {"tecnico", "admin"}:
            raise HTTPException(status_code=400, detail="Perfil de pré-cadastro inválido.")

        senha_hash = gerar_hash_senha(senha)

        usuario_result = await db.execute(
            text(
                """
                INSERT INTO painel_dsr.tb_teste_usuarios (
                    nome,
                    email,
                    senha_hash,
                    perfil,
                    ativo
                )
                VALUES (
                    :nome,
                    :email,
                    :senha_hash,
                    :perfil,
                    TRUE
                )
                RETURNING id_usuario, email, perfil
                """
            ),
            {
                "nome": nome,
                "email": email,
                "senha_hash": senha_hash,
                "perfil": perfil,
            },
        )

        usuario = usuario_result.mappings().one()

        await db.execute(
            text(
                """
                UPDATE painel_dsr.tb_teste_pre_cadastro_usuarios
                SET utilizado = TRUE,
                    data_utilizacao = NOW()
                WHERE id_pre_cadastro = :id_pre_cadastro
                """
            ),
            {"id_pre_cadastro": pre_cadastro["id_pre_cadastro"]},
        )

        await db.commit()

        return PrimeiroAcessoResponse(
            mensagem="Senha criada com sucesso.",
            id_usuario=usuario["id_usuario"],
            email=usuario["email"],
            perfil=usuario["perfil"],
        )

    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao criar senha de primeiro acesso.",
        )


@router.get("/me", response_model=UsuarioAutenticado)
async def me(usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual)):
    return usuario_atual