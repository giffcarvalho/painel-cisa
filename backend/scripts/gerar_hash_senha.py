"""Gera um hash de senha para cadastro manual de usuário."""

from getpass import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import gerar_hash_senha


def main() -> None:
    senha = getpass("Digite a senha: ")
    confirmacao = getpass("Digite a senha novamente: ")

    if not senha:
        raise SystemExit("A senha não pode ficar vazia.")

    if senha != confirmacao:
        raise SystemExit("As senhas informadas não coincidem.")

    hash_gerado = gerar_hash_senha(senha)

    print("\nHash gerado com sucesso:\n")
    print(hash_gerado)


if __name__ == "__main__":
    main()
