"""Gera um hash de senha para cadastro manual de usuário."""

from getpass import getpass

from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def main() -> None:
    senha = getpass("Digite a senha: ")
    confirmacao = getpass("Digite a senha novamente: ")

    if not senha:
        raise SystemExit("A senha não pode ficar vazia.")

    if senha != confirmacao:
        raise SystemExit("As senhas informadas não coincidem.")

    hash_gerado = password_hash.hash(senha)

    print("\nHash gerado com sucesso:\n")
    print(hash_gerado)


if __name__ == "__main__":
    main()