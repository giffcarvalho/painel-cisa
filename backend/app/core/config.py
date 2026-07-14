from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from urllib.parse import quote_plus

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int = 5432
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    APP_ENV: str = "development"
    APP_TITLE: str = "Painel DSR – API"
    APP_VERSION: str = "1.0.0"
    AUTH_SECRET_KEY: str = "trocar-esta-chave-em-ambiente-real"

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        senha_segura = quote_plus(self.DB_PASSWORD)

        return f"postgresql+asyncpg://{self.DB_USER}:{senha_segura}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()