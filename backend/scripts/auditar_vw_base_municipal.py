import asyncio

from sqlalchemy import text

from app.core.database import engine


async def main() -> None:
    async with engine.connect() as connection:
        view_result = await connection.execute(
            text("SELECT pg_get_viewdef('territorio.vw_base_municipal'::regclass, true)")
        )
        view_definition = view_result.scalar_one()

        metadata_result = await connection.execute(
            text(
                """
                SELECT
                    c.relkind,
                    pg_get_userbyid(c.relowner) AS owner,
                    current_user AS current_user,
                    c.relispopulated,
                    c.relacl,
                    COALESCE((
                        SELECT json_agg(pg_get_indexdef(i.indexrelid))
                        FROM pg_index i
                        WHERE i.indrelid = c.oid
                    ), '[]'::json) AS indexes,
                    COALESCE((
                        SELECT json_agg(DISTINCT jsonb_build_object(
                            'name', format('%I.%I', dependent_ns.nspname, dependent.relname),
                            'relkind', dependent.relkind
                        ))
                        FROM pg_depend d
                        JOIN pg_rewrite r ON r.oid = d.objid
                        JOIN pg_class dependent ON dependent.oid = r.ev_class
                        JOIN pg_namespace dependent_ns
                          ON dependent_ns.oid = dependent.relnamespace
                        WHERE d.refobjid = c.oid
                          AND dependent.oid <> c.oid
                    ), '[]'::json) AS dependents
                FROM pg_class c
                WHERE c.oid = 'territorio.vw_base_municipal'::regclass
                """
            )
        )
        print("=== METADADOS DA VIEW MUNICIPAL ===")
        print(dict(metadata_result.mappings().one()))

        print("=== EXPRESSOES DE DEFICIT NA VIEW MUNICIPAL ===")
        for line in view_definition.splitlines():
            if " AS deficit_" in line:
                print(line.strip())

        print("\n=== ORIGEM SINISA (VIEW INTERMEDIARIA) ===")
        source_result = await connection.execute(
            text(
                """
                SELECT n.nspname AS schemaname, c.relkind, pg_get_viewdef(
                    c.oid,
                    true
                ) AS definition
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = 'vw_calculos_atendimento_adequado_nao_adequado_sinisa'
                """
            )
        )
        source = source_result.mappings().one_or_none()
        if source:
            print(f"schema={source['schemaname']} relkind={source['relkind']}")
            print(source["definition"])
        else:
            print("Objeto de origem nao visivel no catalogo para o usuario configurado.")

        print("\n=== FAIXAS OBSERVADAS ===")
        stats_result = await connection.execute(
            text(
                """
                SELECT
                    min(deficit_agua_rural_ibge) AS min_agua_rural_ibge,
                    max(deficit_agua_rural_ibge) AS max_agua_rural_ibge,
                    min(deficit_esgoto_rural_ibge) AS min_esgoto_rural_ibge,
                    max(deficit_esgoto_rural_ibge) AS max_esgoto_rural_ibge,
                    min(deficit_residuo_rural_ibge) AS min_residuo_rural_ibge,
                    max(deficit_residuo_rural_ibge) AS max_residuo_rural_ibge,
                    min(deficit_banheiro_rural_ibge) AS min_banheiro_rural_ibge,
                    max(deficit_banheiro_rural_ibge) AS max_banheiro_rural_ibge,
                    min(deficit_agua_urbana_ibge) AS min_agua_urbana_ibge,
                    max(deficit_agua_urbana_ibge) AS max_agua_urbana_ibge,
                    min(deficit_esgoto_urbana_ibge) AS min_esgoto_urbana_ibge,
                    max(deficit_esgoto_urbana_ibge) AS max_esgoto_urbana_ibge,
                    min(deficit_residuo_urbana_ibge) AS min_residuo_urbana_ibge,
                    max(deficit_residuo_urbana_ibge) AS max_residuo_urbana_ibge,
                    min(deficit_banheiro_urbana_ibge) AS min_banheiro_urbana_ibge,
                    max(deficit_banheiro_urbana_ibge) AS max_banheiro_urbana_ibge,
                    min(deficit_agua_rural_sinisa) AS min_agua_rural_sinisa,
                    max(deficit_agua_rural_sinisa) AS max_agua_rural_sinisa,
                    min(deficit_esgoto_rural_sinisa) AS min_esgoto_rural_sinisa,
                    max(deficit_esgoto_rural_sinisa) AS max_esgoto_rural_sinisa,
                    min(deficit_residuo_rural_sinisa) AS min_residuo_rural_sinisa,
                    max(deficit_residuo_rural_sinisa) AS max_residuo_rural_sinisa,
                    min(percentual_familias_pobreza_baixa_renda_rural)
                        AS min_percentual_referencia,
                    max(percentual_familias_pobreza_baixa_renda_rural)
                        AS max_percentual_referencia
                FROM territorio.vw_base_municipal
                """
            )
        )
        print(dict(stats_result.mappings().one()))

        print("\n=== AMOSTRAS IBGE: ORIGEM, CALCULO E SAIDA ATUAL ===")
        samples_result = await connection.execute(
            text(
                """
                WITH candidatos AS (
                    SELECT
                        cod_municipio,
                        nome_municipio,
                        dppo_agua_nao_adequado_rural AS numerador_origem,
                        dppo_rural AS denominador_origem,
                        round(
                            dppo_agua_nao_adequado_rural::numeric
                            / NULLIF(dppo_rural, 0)::numeric,
                            4
                        ) AS proporcao_calculada,
                        deficit_agua_rural_ibge AS saida_view,
                        alvo
                    FROM territorio.vw_base_municipal
                    CROSS JOIN (VALUES (0.05::numeric), (0.30), (0.70), (0.98)) AS a(alvo)
                    WHERE dppo_rural > 0
                      AND dppo_agua_nao_adequado_rural IS NOT NULL
                ), ordenados AS (
                    SELECT *, row_number() OVER (
                        PARTITION BY alvo
                        ORDER BY abs(proporcao_calculada - alvo), cod_municipio
                    ) AS posicao
                    FROM candidatos
                )
                SELECT * FROM ordenados WHERE posicao = 1 ORDER BY alvo
                """
            )
        )
        for row in samples_result.mappings():
            print(dict(row))

        print("\n=== AMOSTRAS SINISA: ORIGEM, CALCULO E SAIDA ATUAL ===")
        samples_result = await connection.execute(
            text(
                """
                WITH candidatos AS (
                    SELECT
                        cod_municipio,
                        nome_municipio,
                        sinisa_agua_nao_adequado_rural AS numerador_origem,
                        sinisa_agua_adequado_rural + sinisa_agua_nao_adequado_rural
                            AS denominador_origem,
                        round(
                            sinisa_agua_nao_adequado_rural::numeric
                            / NULLIF(
                                sinisa_agua_adequado_rural
                                + sinisa_agua_nao_adequado_rural,
                                0
                            )::numeric,
                            4
                        ) AS proporcao_calculada,
                        deficit_agua_rural_sinisa AS saida_view,
                        alvo
                    FROM territorio.vw_base_municipal
                    CROSS JOIN (VALUES (0.05::numeric), (0.30), (0.70), (0.98)) AS a(alvo)
                    WHERE sinisa_agua_nao_adequado_rural IS NOT NULL
                ), ordenados AS (
                    SELECT *, row_number() OVER (
                        PARTITION BY alvo
                        ORDER BY abs(proporcao_calculada - alvo), cod_municipio
                    ) AS posicao
                    FROM candidatos
                    WHERE denominador_origem > 0
                )
                SELECT * FROM ordenados WHERE posicao = 1 ORDER BY alvo
                """
            )
        )
        for row in samples_result.mappings():
            print(dict(row))

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
