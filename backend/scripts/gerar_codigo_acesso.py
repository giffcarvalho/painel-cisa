"""Gera um código temporário e seu hash para cadastro no banco."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import gerar_hash_codigo_acesso
from app.services.codigo_acesso import gerar_codigo_acesso


def main() -> None:
    codigo = gerar_codigo_acesso()
    codigo_hash = gerar_hash_codigo_acesso(codigo)

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
