"""Gera um código temporário e seu hash para cadastro no banco."""

import secrets

from pwdlib import PasswordHash


ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
password_hash = PasswordHash.recommended()


def gerar_codigo() -> str:
    blocos = [
        "".join(secrets.choice(ALFABETO) for _ in range(4))
        for _ in range(3)
    ]
    return f"DSR-{'-'.join(blocos)}"


def main() -> None:
    codigo = gerar_codigo()
    codigo_hash = password_hash.hash(codigo)

    print("Código para enviar ao técnico:")
    print(codigo)
    print("\nHash para cadastrar no banco:")
    print(codigo_hash)
    print(
        """

Script SQL para atualizar banco:

UPDATE painel_dsr.tb_usuario
SET
    senha_hash = NULL,
    conta_ativada = FALSE,
    codigo_acesso_hash = '<HASH_GERADO>',
    codigo_acesso_expira_em = NOW() + INTERVAL '7 days',
    codigo_acesso_usado_em = NULL,
    atualizado_em = NOW()
WHERE codigo_tecnico = 12103
  AND ativo = TRUE;
""".strip()
    )


if __name__ == "__main__":
    main()
