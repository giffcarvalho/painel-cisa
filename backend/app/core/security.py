import base64
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any

from pwdlib import PasswordHash


TOKEN_ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()


def gerar_hash_senha(senha: str) -> str:
    return password_hash.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        return password_hash.verify(senha, senha_hash)
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def criar_token_acesso(
    payload: dict[str, Any],
    secret_key: str,
    algorithm: str = TOKEN_ALGORITHM,
    expires_minutes: int = 60,
) -> str:
    if algorithm != TOKEN_ALGORITHM:
        raise ValueError("Algoritmo JWT não suportado.")

    agora = datetime.now(timezone.utc)
    expira_em = agora + timedelta(minutes=expires_minutes)

    header = {"alg": algorithm, "typ": "JWT"}
    body = {
        **payload,
        "iat": int(agora.timestamp()),
        "exp": int(expira_em.timestamp()),
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    body_b64 = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    unsigned = f"{header_b64}.{body_b64}"

    assinatura = hmac.new(
        secret_key.encode("utf-8"),
        unsigned.encode("utf-8"),
        "sha256",
    ).digest()

    return f"{unsigned}.{_b64url_encode(assinatura)}"


def decodificar_token_acesso(
    token: str,
    secret_key: str,
    algorithm: str = TOKEN_ALGORITHM,
) -> dict[str, Any] | None:
    try:
        header_b64, body_b64, assinatura_b64 = token.split(".", 2)
        unsigned = f"{header_b64}.{body_b64}"
        header = json.loads(_b64url_decode(header_b64))

        if header.get("alg") != algorithm or algorithm != TOKEN_ALGORITHM:
            return None

        assinatura_esperada = hmac.new(
            secret_key.encode("utf-8"),
            unsigned.encode("utf-8"),
            "sha256",
        ).digest()

        if not hmac.compare_digest(_b64url_encode(assinatura_esperada), assinatura_b64):
            return None

        payload = json.loads(_b64url_decode(body_b64))
        exp = payload.get("exp")

        if not isinstance(exp, int) or exp < int(datetime.now(timezone.utc).timestamp()):
            return None

        return payload
    except (ValueError, json.JSONDecodeError):
        return None
