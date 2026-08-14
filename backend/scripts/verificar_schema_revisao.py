"""Verificação somente leitura das tabelas/constraints da revisão."""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import engine


SQL = """
SELECT
    current_database() AS banco,
    to_regclass('painel_dsr.tb_revisao_instrumento')::text AS revisao,
    to_regclass('painel_dsr.tb_revisao_instrumento_publico_alvo')::text AS publico_alvo,
    to_regclass('painel_dsr.tb_revisao_instrumento_municipio')::text AS municipio,
    to_regclass('painel_dsr.tb_revisao_instrumento_localidade')::text AS localidade,
    to_regclass('painel_dsr.tb_revisao_obra_saneamento')::text AS obra
"""

SQL_CONSTRAINTS = """
SELECT
    cls.relname AS tabela,
    con.conname AS constraint,
    pg_get_constraintdef(con.oid) AS definicao
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS nsp ON nsp.oid = cls.relnamespace
WHERE nsp.nspname = 'painel_dsr'
  AND cls.relname IN (
      'tb_revisao_instrumento',
      'tb_revisao_instrumento_publico_alvo',
      'tb_revisao_instrumento_municipio',
      'tb_revisao_instrumento_localidade',
      'tb_revisao_obra_saneamento'
  )
ORDER BY cls.relname, con.conname
"""

SQL_INDEXES = """
SELECT tablename AS tabela, indexname AS indice, indexdef AS definicao
FROM pg_indexes
WHERE schemaname = 'painel_dsr'
  AND tablename IN (
      'tb_revisao_instrumento_publico_alvo',
      'tb_revisao_instrumento_municipio',
      'tb_revisao_instrumento_localidade'
  )
ORDER BY tablename, indexname
"""


async def main() -> None:
    async with engine.connect() as connection:
        row = (await connection.execute(text(SQL))).mappings().one()
        print(dict(row))
        constraints = (
            await connection.execute(text(SQL_CONSTRAINTS))
        ).mappings().all()
        for constraint in constraints:
            print(dict(constraint))
        indexes = (await connection.execute(text(SQL_INDEXES))).mappings().all()
        for index in indexes:
            print(dict(index))
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(asyncio.wait_for(main(), timeout=15))
