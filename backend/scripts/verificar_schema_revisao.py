"""Verificação somente leitura das tabelas/constraints da revisão."""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import AsyncSessionFactory, engine
from app.services.aplicacao_revisoes import listar_pendentes, obter_detalhe


SQL = """
SELECT
    current_database() AS banco,
    to_regclass('painel_dsr.tb_revisao_instrumento')::text AS revisao,
    to_regclass('painel_dsr.tb_revisao_instrumento_publico_alvo')::text AS publico_alvo,
    to_regclass('painel_dsr.tb_revisao_instrumento_municipio')::text AS municipio,
    to_regclass('painel_dsr.tb_revisao_instrumento_localidade')::text AS localidade,
    to_regclass('painel_dsr.tb_revisao_obra_saneamento')::text AS obra,
    to_regclass('obrasgov.vw_publico_alvo_revisado')::text AS view_publico_alvo_revisado,
    to_regclass('instrumento.vw_obra_saneamento_revisada')::text AS view_obra_revisada
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

SQL_COLUNAS_APLICACAO = """
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE (table_schema, table_name) IN (
    ('painel_dsr', 'tb_revisao_instrumento'),
    ('painel_dsr', 'tb_revisao_instrumento_municipio'),
    ('painel_dsr', 'tb_revisao_instrumento_localidade'),
    ('instrumento', 'tb_contrato_repasse'),
    ('instrumento', 'tb_termo_de_compromisso'),
    ('instrumento', 'tb_ted'),
    ('instrumento', 'tb_contrato_repasse_municipio'),
    ('instrumento', 'tb_termo_de_compromisso_municipio'),
    ('instrumento', 'tb_ted_municipio'),
    ('instrumento', 'tb_contrato_repasse_comunidade_rural'),
    ('instrumento', 'tb_termo_de_compromisso_comunidade_rural'),
    ('territorio', 'tb_comunidade_rural')
)
ORDER BY table_schema, table_name, ordinal_position
"""

SQL_CONSTRAINTS_APLICACAO = """
SELECT
    nsp.nspname AS esquema,
    cls.relname AS tabela,
    con.conname AS constraint,
    pg_get_constraintdef(con.oid) AS definicao
FROM pg_constraint AS con
JOIN pg_class AS cls ON cls.oid = con.conrelid
JOIN pg_namespace AS nsp ON nsp.oid = cls.relnamespace
WHERE (nsp.nspname, cls.relname) IN (
    ('instrumento', 'tb_contrato_repasse_municipio'),
    ('instrumento', 'tb_termo_de_compromisso_municipio'),
    ('instrumento', 'tb_ted_municipio'),
    ('instrumento', 'tb_contrato_repasse_comunidade_rural'),
    ('instrumento', 'tb_termo_de_compromisso_comunidade_rural'),
    ('territorio', 'tb_comunidade_rural')
)
ORDER BY nsp.nspname, cls.relname, con.conname
"""

SQL_PRE_VALIDACAO_APLICACAO = """
SELECT
    to_regclass('instrumento.tb_ted_comunidade_rural')::text
        AS tabela_localidade_ted,
    to_regprocedure('territorio.fn_proximo_cod_comunidade_rural(integer)')::text
        AS funcao_proximo_codigo_comunidade,
    (
        SELECT COUNT(*)
        FROM (
            SELECT cod_municipio, LOWER(BTRIM(nome_comunidade_rural))
            FROM territorio.tb_comunidade_rural
            WHERE NULLIF(BTRIM(nome_comunidade_rural), '') IS NOT NULL
            GROUP BY cod_municipio, LOWER(BTRIM(nome_comunidade_rural))
            HAVING COUNT(*) > 1
        ) duplicidades
    ) AS grupos_comunidades_ambiguas,
    (
        SELECT COUNT(*)
        FROM (
            SELECT tipo_instrumento,
                   COALESCE(NULLIF(BTRIM(nr_instrumento), ''), nr_ted::text)
            FROM painel_dsr.tb_revisao_instrumento
            WHERE status = 'enviado' AND aplicado_em IS NULL
            GROUP BY tipo_instrumento,
                     COALESCE(NULLIF(BTRIM(nr_instrumento), ''), nr_ted::text)
            HAVING COUNT(*) > 1
        ) pendencias_multiplas
    ) AS instrumentos_com_multiplas_revisoes_pendentes
"""

SQL_DEFINICOES_VIEWS_REVISADAS = """
SELECT schemaname, matviewname, matviewowner, definition
FROM pg_matviews
WHERE (schemaname, matviewname) IN (
    ('obrasgov', 'vw_publico_alvo_revisado'),
    ('instrumento', 'vw_obra_saneamento_revisada')
)
ORDER BY schemaname, matviewname
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
        columns = (
            await connection.execute(text(SQL_COLUNAS_APLICACAO))
        ).mappings().all()
        for column in columns:
            print(dict(column))
        application_constraints = (
            await connection.execute(text(SQL_CONSTRAINTS_APLICACAO))
        ).mappings().all()
        for constraint in application_constraints:
            print(dict(constraint))
        pre_validation = (
            await connection.execute(text(SQL_PRE_VALIDACAO_APLICACAO))
        ).mappings().one()
        print(dict(pre_validation))
        view_definitions = (
            await connection.execute(text(SQL_DEFINICOES_VIEWS_REVISADAS))
        ).mappings().all()
        for view_definition in view_definitions:
            print(dict(view_definition))
    async with AsyncSessionFactory() as session:
        pendentes = await listar_pendentes(session)
        print({"revisoes_pendentes_aplicacao": pendentes.total})
        for item in pendentes.data:
            detalhe = await obter_detalhe(session, item.id_revisao)
            print(
                {
                    "id_revisao": item.id_revisao,
                    "aplicavel": detalhe.validacao.aplicavel,
                    "pendencias": detalhe.validacao.pendencias,
                }
            )
        await session.rollback()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(asyncio.wait_for(main(), timeout=15))
