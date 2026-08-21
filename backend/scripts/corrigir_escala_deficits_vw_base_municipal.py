"""Normaliza os deficits IBGE/SINISA da view municipal para pontos percentuais."""

from __future__ import annotations

import asyncio
import re

from sqlalchemy import text

from app.core.database import engine
from app.services.extrator_catalogo import CAMPOS_CATALOGADOS


VIEW_NAME = "territorio.vw_base_municipal"
DIRECT_DEPENDENTS = {
    "temporario.mvw_cisa_tabelao",
    "territorio.vw_aglomerado_rural",
}
DEPENDENT_MATERIALIZED_VIEWS = (
    "temporario.mvw_cisa_tabelao",
    "territorio.vw_aglomerado_setor_censitario",
    "territorio.vw_aglomerado_municipio",
    "territorio.vw_aglomerado_rural",
)


def _deficits_catalogados() -> set[str]:
    return {
        column
        for fields in CAMPOS_CATALOGADOS["municipio"].values()
        for column, label in fields
        if label.startswith("Déficit ") and label.endswith(("— IBGE", "— SINISA"))
    }


def _normalizar_deficits(definition: str) -> str:
    deficits = _deficits_catalogados()
    encontrados = set(re.findall(r"\bAS (deficit_[a-z0-9_]+)", definition))

    if encontrados != deficits:
        raise RuntimeError(
            "A lista de deficits da view diverge do catalogo: "
            f"somente_view={sorted(encontrados - deficits)}, "
            f"somente_catalogo={sorted(deficits - encontrados)}"
        )

    updated = definition
    for column in sorted(deficits):
        pattern = re.compile(
            rf"round\((?P<ratio>[^\n]+), 4\) AS {re.escape(column)}(?P<suffix>,?)"
        )
        updated, replacements = pattern.subn(
            rf"round((\g<ratio>) * 100, 2) AS {column}\g<suffix>",
            updated,
        )
        already_normalized = re.search(
            rf"round\([^\n]+\* 100(?:::numeric)?, 2\) AS {re.escape(column)}",
            updated,
        )
        if replacements == 0 and already_normalized:
            continue
        if replacements != 1:
            raise RuntimeError(
                f"Esperada uma expressao para {column}; encontradas {replacements}."
            )

    return updated


async def main() -> None:
    async with engine.begin() as connection:
        metadata_result = await connection.execute(
            text(
                """
                SELECT
                    format('%I.%I', n.nspname, c.relname) AS name,
                    c.relkind,
                    pg_get_userbyid(c.relowner) AS owner,
                    current_user AS current_user,
                    c.relacl,
                    obj_description(c.oid, 'pg_class') AS comment,
                    pg_get_viewdef(c.oid, true) AS definition,
                    COALESCE((
                        SELECT array_agg(pg_get_indexdef(i.indexrelid) ORDER BY i.indexrelid)
                        FROM pg_index i
                        WHERE i.indrelid = c.oid
                    ), ARRAY[]::text[]) AS indexes
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE format('%I.%I', n.nspname, c.relname) = ANY(:names)
                """
            ),
            {"names": [VIEW_NAME, *DEPENDENT_MATERIALIZED_VIEWS]},
        )
        metadata = {
            row["name"]: dict(row) for row in metadata_result.mappings()
        }

        expected_names = {VIEW_NAME, *DEPENDENT_MATERIALIZED_VIEWS}
        if set(metadata) != expected_names:
            raise RuntimeError(
                f"Objetos esperados nao encontrados: {sorted(expected_names - set(metadata))}"
            )

        for name, item in metadata.items():
            if item["relkind"] != b"m":
                raise RuntimeError(f"{name} nao e uma view materializada.")
            if item["owner"] != item["current_user"]:
                raise RuntimeError(f"O usuario atual nao e proprietario de {name}.")
            if item["relacl"] is not None:
                raise RuntimeError(
                    f"{name} possui permissoes explicitas que precisam ser migradas."
                )

        dependents_result = await connection.execute(
            text(
                """
                SELECT DISTINCT
                    format('%I.%I', dependent_ns.nspname, dependent.relname) AS name
                FROM pg_depend d
                JOIN pg_rewrite r ON r.oid = d.objid
                JOIN pg_class dependent ON dependent.oid = r.ev_class
                JOIN pg_namespace dependent_ns
                  ON dependent_ns.oid = dependent.relnamespace
                WHERE d.refobjid = CAST(:base AS regclass)
                  AND dependent.oid <> CAST(:base AS regclass)
                """
            ),
            {"base": VIEW_NAME},
        )
        actual_dependents = {row[0] for row in dependents_result}
        if actual_dependents != DIRECT_DEPENDENTS:
            raise RuntimeError(
                "Dependencias da view municipal mudaram: "
                f"{sorted(actual_dependents)}"
            )

        current_definition = metadata[VIEW_NAME]["definition"].rstrip().removesuffix(";")
        updated_definition = _normalizar_deficits(current_definition)

        if updated_definition == current_definition:
            return

        for name in DEPENDENT_MATERIALIZED_VIEWS:
            await connection.execute(text(f"DROP MATERIALIZED VIEW {name}"))
        await connection.execute(text(f"DROP MATERIALIZED VIEW {VIEW_NAME}"))

        await connection.execute(
            text(f"CREATE MATERIALIZED VIEW {VIEW_NAME} AS\n{updated_definition} WITH DATA")
        )
        for index in metadata[VIEW_NAME]["indexes"]:
            await connection.execute(text(index))

        for name in reversed(DEPENDENT_MATERIALIZED_VIEWS):
            await connection.execute(
                text(
                    f"CREATE MATERIALIZED VIEW {name} AS\n"
                    f"{metadata[name]['definition'].rstrip().removesuffix(';')} WITH DATA"
                )
            )
            for index in metadata[name]["indexes"]:
                await connection.execute(text(index))

        for name, item in metadata.items():
            if item["comment"] is not None:
                await connection.execute(
                    text(f"COMMENT ON MATERIALIZED VIEW {name} IS :comment"),
                    {"comment": item["comment"]},
                )

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
