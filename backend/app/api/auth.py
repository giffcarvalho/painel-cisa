from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    criar_token_acesso,
    decodificar_token_acesso,
    gerar_hash_senha,
    verificar_codigo_acesso,
    verificar_senha,
)
from app.schemas.auth import (
    DefinirSenhaRedefinicaoRequest,
    DefinirSenhaPrimeiroAcessoRequest,
    LoginRequest,
    MensagemResponse,
    TecnicoPrimeiroAcessoResponse,
    TokenResponse,
    UsuarioAutenticado,
    ValidarCodigoPrimeiroAcessoRequest,
    ValidarCodigoRedefinicaoSenhaRequest,
)


router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)

CONTA_NAO_ATIVADA = (
    "Sua conta ainda não foi ativada. Utilize a opção “Primeiro acesso” "
    "para definir sua senha."
)
CODIGO_NAO_DISPONIVEL = "Código de primeiro acesso inválido, expirado ou já utilizado."
CODIGO_REDEFINICAO_NAO_DISPONIVEL = (
    "Código de acesso inválido, expirado ou já utilizado."
)


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
                    conta_ativada,
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

        if usuario is None or usuario["ativo"] is not True:
            raise credenciais_invalidas

        if (
            usuario["conta_ativada"] is False
            and usuario["senha_hash"] is None
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=CONTA_NAO_ATIVADA,
            )

        if usuario["conta_ativada"] is not True or usuario["senha_hash"] is None:
            raise credenciais_invalidas

        if not verificar_senha(payload.senha, usuario["senha_hash"]):
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


async def _buscar_usuario_elegivel_por_codigo(
    codigo_acesso: str,
    db: AsyncSession,
    mensagem_erro: str,
):
    result = await db.execute(
        text(
            """
            SELECT id_usuario, nome, email, setor, codigo_acesso_hash
            FROM painel_dsr.tb_usuario
            WHERE ativo IS TRUE
              AND conta_ativada IS FALSE
              AND senha_hash IS NULL
              AND codigo_acesso_hash IS NOT NULL
              AND codigo_acesso_usado_em IS NULL
              AND (
                    codigo_acesso_expira_em IS NULL
                    OR codigo_acesso_expira_em > NOW()
                  )
            """
        )
    )
    for usuario in result.mappings().all():
        if verificar_codigo_acesso(
            codigo_acesso,
            usuario["codigo_acesso_hash"],
        ):
            return usuario
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=mensagem_erro,
    )


async def _definir_senha_com_codigo(
    codigo_acesso: str,
    senha: str,
    db: AsyncSession,
    mensagem_codigo_invalido: str,
) -> None:
    usuario = await _buscar_usuario_elegivel_por_codigo(
        codigo_acesso,
        db,
        mensagem_codigo_invalido,
    )
    senha_hash = gerar_hash_senha(senha)

    result = await db.execute(
        text(
            """
            UPDATE painel_dsr.tb_usuario
            SET senha_hash = :senha_hash,
                conta_ativada = TRUE,
                codigo_acesso_usado_em = NOW(),
                codigo_acesso_hash = NULL,
                codigo_acesso_expira_em = NULL,
                atualizado_em = NOW()
            WHERE id_usuario = :id_usuario
              AND ativo IS TRUE
              AND conta_ativada IS FALSE
              AND senha_hash IS NULL
              AND codigo_acesso_hash = :codigo_acesso_hash
              AND codigo_acesso_usado_em IS NULL
              AND (
                    codigo_acesso_expira_em IS NULL
                    OR codigo_acesso_expira_em > NOW()
                  )
            """
        ),
        {
            "id_usuario": usuario["id_usuario"],
            "codigo_acesso_hash": usuario["codigo_acesso_hash"],
            "senha_hash": senha_hash,
        },
    )

    if result.rowcount != 1:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=mensagem_codigo_invalido,
        )

    await db.commit()


@router.post(
    "/primeiro-acesso/validar",
    response_model=TecnicoPrimeiroAcessoResponse,
)
async def validar_primeiro_acesso(
    payload: ValidarCodigoPrimeiroAcessoRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        usuario = await _buscar_usuario_elegivel_por_codigo(
            payload.codigo_primeiro_acesso,
            db,
            CODIGO_NAO_DISPONIVEL,
        )
        return TecnicoPrimeiroAcessoResponse(
            nome=usuario["nome"],
            email=usuario["email"],
            setor=usuario["setor"],
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao validar primeiro acesso.",
        )


@router.post(
    "/primeiro-acesso/definir-senha",
    response_model=MensagemResponse,
)
async def definir_senha_primeiro_acesso(
    payload: DefinirSenhaPrimeiroAcessoRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        await _definir_senha_com_codigo(
            payload.codigo_primeiro_acesso,
            payload.senha,
            db,
            CODIGO_NAO_DISPONIVEL,
        )
        return MensagemResponse(
            mensagem="Senha criada com sucesso. Você já pode entrar no Painel DSR."
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao definir a senha.",
        )


@router.post(
    "/redefinicao-senha/validar",
    response_model=TecnicoPrimeiroAcessoResponse,
)
async def validar_codigo_redefinicao(
    payload: ValidarCodigoRedefinicaoSenhaRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        usuario = await _buscar_usuario_elegivel_por_codigo(
            payload.codigo_acesso,
            db,
            CODIGO_REDEFINICAO_NAO_DISPONIVEL,
        )
        return TecnicoPrimeiroAcessoResponse(
            nome=usuario["nome"],
            email=usuario["email"],
            setor=usuario["setor"],
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao validar o código de redefinição.",
        )


@router.post(
    "/redefinicao-senha/definir-senha",
    response_model=MensagemResponse,
)
async def definir_senha_redefinicao(
    payload: DefinirSenhaRedefinicaoRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        await _definir_senha_com_codigo(
            payload.codigo_acesso,
            payload.senha,
            db,
            CODIGO_REDEFINICAO_NAO_DISPONIVEL,
        )
        return MensagemResponse(
            mensagem=(
                "Senha redefinida com sucesso. Você já pode entrar no Painel DSR."
            )
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao redefinir a senha.",
        )
