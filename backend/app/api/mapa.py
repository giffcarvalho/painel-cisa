"""Todos os endpoints do Mapa"""

import logging
from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
import jenkspy


router = APIRouter()
logger = logging.getLogger(__name__)



def _parse_list_param(param: list[str] | None) -> list[str] | None:  #--Garante que parâmetros passados como string separada por vírgula no frontend sejam convertidos em uma lista válida.
    if not param:
        return None
    parsed = []
    for item in param:
        if "," in item:
            parsed.extend([p.strip() for p in item.split(",") if p.strip()])
        else:
            if item.strip():
                parsed.append(item.strip())
    return parsed if parsed else None


async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None) -> CursorResult: #--Executa a query com tratamento de erro para evitar que exceções brutas do banco vazem.
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno de processamento ao consultar a base de dados."
        )



# ufs
@router.get("/ufs/{z}/{x}/{y}.pbf", summary="Unidades da Federação")
async def get_ufs(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_uf,
                sigla_uf,
                nome_uf,
                ST_AsMVTGeom(
                    ST_Simplify(
                        ST_Transform(geom, 3857),
                        CASE
                            WHEN :z <= 6 THEN 2000
                            WHEN :z <= 7 THEN 1000
                            WHEN :z <= 8 THEN 500
                            WHEN :z <= 9 THEN 300
                            ELSE 0
                        END
                    ),
                    ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.tb_uf
            WHERE geom && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params) # transformar esse bloco em uma função e depois só chamar ela nas rotas?
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )


# municipios 2025
@router.get("/municipios_2025/{z}/{x}/{y}.pbf", summary="Municípios 2025")
async def get_municipios_2025(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_municipio,
                nome_municipio,
                ST_AsMVTGeom(
                    ST_Simplify(
                        ST_Transform(geom2025, 3857),
                        CASE
                            WHEN :z <= 7 THEN 1000
                            WHEN :z <= 8 THEN 500
                            WHEN :z <= 9 THEN 300
                            ELSE 0
                        END
                    ),
                    ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.tb_municipio
            WHERE geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )


# distritos 2022
@router.get("/distritos_2022/{z}/{x}/{y}.pbf", summary="Distritos 2022")
async def get_distritos_2022(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_distrito,
                ST_AsMVTGeom(
                    ST_Simplify(
                        ST_Transform(geom, 3857),
                        CASE
                            WHEN :z <= 8 THEN 500 
                            WHEN :z <= 9 THEN 300
                            ELSE 0
                        END
                    ),
                    ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.tb_distrito
            WHERE geom && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )


# setores censitarios 2022
@router.get("/setores_censitarios_2022/{z}/{x}/{y}.pbf", summary="Setores Censitários 2022")
async def get_setores_censitarios_2022(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_setor,
                cod_sit,
                situacao,
                cod_sit::char(1) || ' - ' || situacao_detalhada as situacao_detalhada,
                nome_municipio || '/' || sigla_uf as nome_municipio,
                ST_AsMVTGeom(
                    ST_Simplify(
                        ST_Transform(geom, 3857),
                        CASE
                            WHEN :z <= 8 THEN 500 
                            WHEN :z <= 9 THEN 300
                            ELSE 0
                        END
                    ),
                    ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM censo.vw_base_setor_censitario
            WHERE geom && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )


# localidades 2022
@router.get("/localidades_2022/{z}/{x}/{y}.pbf", summary="Localidades 2022")
async def get_localidades_2022(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_localidade,
                categoria_localidade,
                nome_localidade,
                ST_AsMVTGeom(ST_Transform(geom, 3857), ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.tb_localidade
            WHERE geom && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )


# enderecos 2022
@router.get("/enderecos_2022/{z}/{x}/{y}.pbf", summary="Enderecos 2022")
async def get_enderecos_2022(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_endereco,
                cod_especie,
                dsc_localidade,
                CASE
                    WHEN cod_especie = 1 then '1 - Domicílio particular'
                    WHEN cod_especie = 2 then '2 - Domicílio coletivo'
                    WHEN cod_especie = 3 then '3 - Estabelecimento agropecuário'
                    WHEN cod_especie = 4 then '4 - Estabelecimento de ensino'
                    WHEN cod_especie = 5 then '5 - Estabelecimento de saúde'
                    WHEN cod_especie = 6 then '6 - Estabelecimento de outras finalidades'
                    WHEN cod_especie = 7 then '7 - Edificação em construção ou reforma'
                    WHEN cod_especie = 8 then '8 - Estabelecimento religioso'
                    ELSE 'verificar'
                END as especie,
                ST_AsMVTGeom(ST_Transform(geom, 3857), ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.tb_endereco
            WHERE geom && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )


# municipios 2022
@router.get("/municipios_2022/{z}/{x}/{y}.pbf", summary="Municípios 2022")
async def get_municipios_2022(z: int, x: int, y: int, db: AsyncSession = Depends(get_db)):

    
    params = {"z": z, "x": x, "y": y}

    sql = """
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_municipio,
                nome_municipio,
                populacao_total_censo_2022,
                categoria_metropolitana,
                subgrupo,
                semiarido_2022,
                amazonia_legal,
                vale_jequetinhonha,
                idhm_2010,
                indice_firjan_2016,
                deficit_agua_rural_ibge,
                deficit_esgoto_rural_ibge,
                deficit_residuo_rural_ibge,
                deficit_banheiro_rural_ibge,
                deficit_agua_urbana_ibge,
                deficit_esgoto_urbana_ibge,
                deficit_residuo_urbana_ibge,
                deficit_banheiro_urbana_ibge,
                ST_AsMVTGeom(
                    ST_Simplify(
                        ST_Transform(geom2022, 3857),
                        CASE
                            WHEN :z <= 7 THEN 1000
                            WHEN :z <= 8 THEN 500
                            WHEN :z <= 9 THEN 300
                            ELSE 0
                        END
                    ),
                    ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.vw_base_municipal
            WHERE geom2022 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )



# classificação das classes cloropléticas do mapa usando quebra Jenks (lib jenkspy)
cache_jenks = {}
colunas_permitidas = [
    "populacao_total_censo_2022",
    "categoria_metropolitana",
    "subgrupo",
    "semiarido_2022",
    "amazonia_legal",
    "vale_jequetinhonha",
    "idhm_2010",
    "indice_firjan_2016",
    "deficit_agua_rural_ibge",
    "deficit_esgoto_rural_ibge",
    "deficit_residuo_rural_ibge",
    "deficit_banheiro_rural_ibge",
    "deficit_agua_urbana_ibge",
    "deficit_esgoto_urbana_ibge",
    "deficit_residuo_urbana_ibge",
    "deficit_banheiro_urbana_ibge",
]

@router.get("/classificacao/{variavel}")
async def get_classificacao(variavel: str, classes: int = 5, db: AsyncSession = Depends(get_db)):

    cache_key = f"{variavel}_{classes}"

    if cache_key in cache_jenks:
        return cache_jenks[cache_key]


    if classes < 2 or classes > 9:
        raise HTTPException(
            status_code=400,
            detail="Número de classes inválido."
        )

    if variavel not in colunas_permitidas:
        raise HTTPException(
            status_code=400,
            detail="Variável inválida."
        )

    sql = f"""
        SELECT {variavel} AS valor
        FROM territorio.vw_base_municipal
        WHERE {variavel} IS NOT NULL
    """

    result = await _execute_query(db, sql)
    rows = result.fetchall()
    valores = [float(row.valor) for row in rows]
    breaks = jenkspy.jenks_breaks(valores, n_classes=classes)

    resultado = {
        "variavel": variavel,
        "classes": classes,
        "breaks": breaks
    }

    cache_jenks[cache_key] = resultado
    return resultado
