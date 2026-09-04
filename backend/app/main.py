from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.api import carteira_dsr
from app.api import mapa
from app.api import pesquisa_instrumento
from app.core.database import lifespan_db
from app.api import extrator_dados
from app.api import auth
from app.api import revisao_instrumento
from app.api import aplicacao_revisoes
from app.api import pontos_controle
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⏳ Iniciando a aplicação e testando o banco de dados...")
    async with lifespan_db():
        print("✅ Conexão com o banco estabelecida com sucesso.")
        yield
    print("🔌 Aplicação encerrada. Pool de conexões fechado.")
 
 
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)
 

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
 
app.include_router(
    carteira_dsr.router,
    prefix="/api/v1/carteira-dsr",
    tags=["Carteira DSR"],
)

app.include_router(
    mapa.router,
    prefix="/api/v1/mapa",
    tags=["Mapa"],
)

app.include_router(
    pesquisa_instrumento.router,
    prefix="/api/v1/pesquisa-instrumento",
    tags=["Pesquisa Instrumento"],
)

app.include_router(
    extrator_dados.router,
    prefix="/api/v1/extrator-dados",
    tags=["Extrator de Dados"],
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Auth"]
)

app.include_router(
    revisao_instrumento.router,
    prefix="/api/v1/revisao-instrumento",
    tags=["Revisão Instrumento"],
)

app.include_router(
    aplicacao_revisoes.router,
    prefix="/api/v1/aplicacao-revisoes",
    tags=["Aplicação de Revisões"],
)

app.include_router(
    pontos_controle.router,
    prefix="/api/v1/pontos-controle",
    tags=["Pontos Controle"],
)


@app.get("/health", tags=["Infra"])
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
