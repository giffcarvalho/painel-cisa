from pydantic import BaseModel, Field, field_validator, model_validator


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=150)
    senha: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalizar_email(cls, value: str) -> str:
        email = value.strip()

        if not email:
            raise ValueError("E-mail obrigatório.")

        return email


class UsuarioAutenticado(BaseModel):
    id_usuario: int
    nome: str
    email: str
    perfil: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UsuarioAutenticado


class ValidarCodigoPrimeiroAcessoRequest(BaseModel):
    codigo_primeiro_acesso: str = Field(..., min_length=1, max_length=100)

    @field_validator("codigo_primeiro_acesso")
    @classmethod
    def normalizar_codigo(cls, value: str) -> str:
        codigo = value.strip().upper()
        if not codigo:
            raise ValueError("Código de primeiro acesso obrigatório.")
        return codigo


class TecnicoPrimeiroAcessoResponse(BaseModel):
    nome: str
    email: str
    setor: str | None = None


class DefinirSenhaPrimeiroAcessoRequest(BaseModel):
    codigo_primeiro_acesso: str = Field(..., min_length=1, max_length=100)
    senha: str = Field(..., min_length=8)
    confirmacao_senha: str = Field(..., min_length=1)

    @field_validator("codigo_primeiro_acesso")
    @classmethod
    def normalizar_codigo(cls, value: str) -> str:
        codigo = value.strip().upper()
        if not codigo:
            raise ValueError("Código de primeiro acesso obrigatório.")
        return codigo

    @field_validator("senha")
    @classmethod
    def validar_senha_nao_vazia(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("A senha não pode ser vazia.")
        return value

    @model_validator(mode="after")
    def validar_confirmacao(self):
        if self.senha != self.confirmacao_senha:
            raise ValueError("A senha e a confirmação devem ser iguais.")
        return self


class MensagemResponse(BaseModel):
    mensagem: str


class ValidarCodigoRedefinicaoSenhaRequest(BaseModel):
    codigo_acesso: str = Field(..., min_length=1, max_length=100)

    @field_validator("codigo_acesso")
    @classmethod
    def normalizar_codigo(cls, value: str) -> str:
        codigo = value.strip().upper()
        if not codigo:
            raise ValueError("Código de acesso obrigatório.")
        return codigo


class DefinirSenhaRedefinicaoRequest(ValidarCodigoRedefinicaoSenhaRequest):
    senha: str = Field(..., min_length=8)
    confirmacao_senha: str = Field(..., min_length=1)

    @field_validator("senha")
    @classmethod
    def validar_senha_nao_vazia(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("A senha não pode ser vazia.")
        return value

    @model_validator(mode="after")
    def validar_confirmacao(self):
        if self.senha != self.confirmacao_senha:
            raise ValueError("A senha e a confirmação devem ser iguais.")
        return self
