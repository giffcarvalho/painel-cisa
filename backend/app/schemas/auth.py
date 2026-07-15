from pydantic import BaseModel, Field, field_validator


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
