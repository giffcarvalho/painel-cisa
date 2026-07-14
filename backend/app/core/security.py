import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

HASH_ALGORITHM = "pbkdf2_sha256"
HASH_ITERATIONS = 600_000
TOKEN_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def gerar_hash_senha(senha: str) -> str:
    salt = secrets.token_urlsafe(16)
    senha_hash = hashlib.pbkdf2_hmac(
        "sha256",
        senha.encode("utf-8"),
        salt.encode("utf-8"),
        HASH_ITERATIONS,
    )
    hash_b64 = base64.urlsafe_b64encode(senha_hash).decode("utf-8")
    return f"{HASH_ALGORITHM}${HASH_ITERATIONS}${salt}${hash_b64}"


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        algoritmo, iteracoes, salt, hash_b64 = senha_hash.split("$", 3)
        if algoritmo != HASH_ALGORITHM:
            return False

        novo_hash = hashlib.pbkdf2_hmac(
            "sha256",
            senha.encode("utf-8"),
            salt.encode("utf-8"),
            int(iteracoes),
        )
        novo_hash_b64 = base64.urlsafe_b64encode(novo_hash).decode("utf-8")
        return hmac.compare_digest(novo_hash_b64, hash_b64)
    except (AttributeError, TypeError, ValueError):
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def criar_token_acesso(payload: dict[str, Any], secret_key: str) -> str:
    agora = datetime.now(timezone.utc)
    expira_em = agora + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    header = {"alg": TOKEN_ALGORITHM, "typ": "JWT"}
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
        hashlib.sha256,
    ).digest()

    return f"{unsigned}.{_b64url_encode(assinatura)}"


def decodificar_token_acesso(token: str, secret_key: str) -> dict[str, Any] | None:
    try:
        header_b64, body_b64, assinatura_b64 = token.split(".", 2)
        unsigned = f"{header_b64}.{body_b64}"

        assinatura_esperada = hmac.new(
            secret_key.encode("utf-8"),
            unsigned.encode("utf-8"),
            hashlib.sha256,
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