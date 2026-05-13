from contextlib import asynccontextmanager
from typing import AsyncGenerator
 
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
 
from app.core.config import settings
 
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  
)

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)
 
 
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
 
 
@asynccontextmanager
async def lifespan_db():
    async with engine.begin() as conn:
        await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
    yield
    await engine.dispose()