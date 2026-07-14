from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(..., min_length=1)

class PrimeiroAcessoRequest(BaseModel):
    nome: str = ""
    codigo_verificacao: str = ""
    email: str = ""
    senha: str = ""


class PrimeiroAcessoResponse(BaseModel):
    mensagem: str
    id_usuario: int
    email: str
    perfil: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioAutenticado(BaseModel):
    id_usuario: int
    nome: str
    email: EmailStr
    perfil: str