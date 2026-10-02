"""Aplica a migration idempotente do fluxo de devolutivas."""

import asyncio
from pathlib import Path
import sys

import asyncpg

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings


async def main() -> None:
    sql_path = Path(__file__).resolve().parents[1] / "sql" / "20260930_criar_tb_devolutiva_revisao.sql"
    connection = await asyncpg.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )
    try:
        await connection.execute(sql_path.read_text(encoding="utf-8"))
        existe = await connection.fetchval(
            "SELECT to_regclass('painel_dsr.tb_devolutiva_revisao')::text"
        )
        if existe != "painel_dsr.tb_devolutiva_revisao":
            raise RuntimeError("A tabela de devolutivas não foi criada.")
        print("Migration de devolutivas aplicada e verificada.")
    finally:
        await connection.close()


if __name__ == "__main__":
    asyncio.run(main())
