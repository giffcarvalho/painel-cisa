from contextlib import asynccontextmanager
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.core.config import settings
from app.core.database import engine
from app.api import carteira_dsr
from app.core.database import lifespan_db
 
 
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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(
    carteira_dsr.router,
    prefix="/api/v1/carteira-dsr",
    tags=["Carteira DSR"],
)
 
 
@app.get("/health", tags=["Infra"])
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}