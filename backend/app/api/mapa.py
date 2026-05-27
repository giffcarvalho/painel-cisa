"""Todos os endpoints do Mapa"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
import jenkspy
import time
from threading import Lock
from app.schemas.filtrosMapa import UfItem, OpcoesFiltrosUf, MunicipioItem, OpcoesFiltrosMunicipio


 
router = APIRouter()
logger = logging.getLogger(__name__)



async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None) -> CursorResult: #--Executa a query com tratamento de erro para evitar que exceções brutas do banco vazem.
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno de processamento ao consultar a base de dados."
        )


#--Dependência de filtros
class FiltrosMapa:  #-- Dependência do FastAPI para agrupar todos os Query Parameters. Evita repetição nas assinaturas das funções de rota.
    def __init__(
            self,
            cod_uf: list[int] | None = Query(None), #-- list[] é porque pode ser mais de um, | None diz que é opcional, e Query(None) diz que não tem valor padrão
            cod_municipio: list[int] | None = Query(None)
    ):
        self.cod_uf = cod_uf
        self.cod_municipio = cod_municipio
        

def _build_where(filtros: FiltrosMapa, allowed: set[str] | None = None) -> tuple[str, dict]:  #--filtros: FiltrosMapa é recebido do frontend via depends. str é a string da cláusula where, dict é o dicionário com os valores dos params
    
    clauses: list[str] = []                                                                   #--é list porque é a junção de várias strings que vão ser concatenadas p/ formar a clásula where final
    params: dict = {}                                                                         #--é o dicionário com os valores dos params que foram recebidos do frontend

    list_filters = [                                       
        ("cod_uf", filtros.cod_uf, "cod_uf", int),                          #(coluna do banco, valor da params recebido do frontend, nome do params, cast)
        ("cod_municipio", filtros.cod_municipio, "cod_municipio", int),
    ]

    for col, values, param_key, cast_python in list_filters:
        
        if allowed and col not in allowed:
            continue

        if values:
            clauses.append(f"{col} = ANY(CAST(:{param_key} AS int[]))")
            params[param_key] = [cast_python(v) if cast_python else v for v in values]


    where = (" AND ".join(clauses)) if clauses else ""
    return where, params


# opções do filtro de uf
@router.get("/filtros/ufs", response_model=OpcoesFiltrosUf, summary="Lista de siglas das UFs")
async def get_lista_ufs(response: Response, db: AsyncSession = Depends(get_db)):
    response.headers["Cache-Control"] = "public, max-age=86400"

    sql = """
        SELECT
            cod_uf,
            sigla_uf
        FROM territorio.tb_uf
        ORDER BY sigla_uf
    """

    result = await _execute_query(db, sql)
    return OpcoesFiltrosUf(data=[dict(row) for row in result.mappings().all()])


# opções do filtro de município
@router.get("/filtros/municipios", response_model=OpcoesFiltrosMunicipio, summary="Lista dos nomes dos Municípios")
async def get_lista_municipios(
    response: Response, 
    q: Annotated[str, Query(min_length=2, max_length=100, description="Termo de busca do município.")],  #é um params que contém o texto que a pessoa começa digitando no campo do filtro. É obrigatório e tem o tamanho especificado
    cod_uf: Annotated[int | None, Query(description="Código da UF.")] = None,                            #é um params, nesse caso opcional, valor padrão None
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 50,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=86400"

    sql = """
        SELECT
            cod_municipio,
            nome_municipio
        FROM territorio.tb_municipio
        WHERE nome_municipio ILIKE :termo
    """

    params = {
        "termo": f"%{q.strip()}%",
        "limit": limit
    }

    if cod_uf:
        sql += " AND cod_uf = :cod_uf"
        params["cod_uf"] = cod_uf

    sql += """
        ORDER BY nome_municipio
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosMunicipio(data=[MunicipioItem(**row) for row in result.mappings().all()])


# ufs
@router.get("/ufs/{z}/{x}/{y}.pbf", summary="Unidades da Federação")
async def get_ufs(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"

    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)

    sql = f"""
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
            WHERE {base_where}
        ) AS tile;
    """

        
    result = await _execute_query(db, sql, params) # transformar esse bloco em uma função e depois só chamar ela nas rotas?
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )



# municipios 2025   #--avaliar depois de não é melhor trazer a geom2025 para a vw_base_municipal, pois talvez vão ser necessários dados associados a geometria
@router.get("/municipios_2025/{z}/{x}/{y}.pbf", summary="Municípios 2025")
async def get_municipios_2025(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"

    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)


    sql = f"""
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
            WHERE {base_where}
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
async def get_distritos_2022(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)

    sql = f"""
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
            WHERE {base_where}
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
async def get_setores_censitarios_2022(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)


    sql = f"""
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
            WHERE {base_where}
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
async def get_localidades_2022(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):


    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)


    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_localidade,
                categoria_localidade,
                nome_localidade,
                ST_AsMVTGeom(ST_Transform(geom, 3857), ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM territorio.tb_localidade
            WHERE {base_where}
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
async def get_enderecos_2022(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)


    sql = f"""
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
            WHERE {base_where}
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
async def get_municipios_2022(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom2025 && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)


    sql = f"""
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
            WHERE {base_where}
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
cache_jenks: dict = {}
cache_lock = Lock()
CACHE_TTL = 3600
CACHE_MAXSIZE = 128

# controla intervalo de limpeza
last_cleanup = 0
CLEANUP_INTERVAL = 300  # 5 minutos


def _cleanup_cache():

    now = time.time()

    with cache_lock:

        expired_keys = [
            key
            for key, (_, expires_at) in cache_jenks.items()
            if now >= expires_at
        ]

        for key in expired_keys:
            del cache_jenks[key]

        if len(cache_jenks) > CACHE_MAXSIZE:

            oldest_keys = sorted(
                cache_jenks.items(),
                key=lambda item: item[1][1]
            )

            excess = len(cache_jenks) - CACHE_MAXSIZE

            for key, _ in oldest_keys[:excess]:
                del cache_jenks[key]


COLUNAS = {
    "deficit_agua_rural_ibge": "deficit_agua_rural_ibge",
    "deficit_esgoto_rural_ibge": "deficit_esgoto_rural_ibge",
    "deficit_residuo_rural_ibge": "deficit_residuo_rural_ibge",
    "deficit_banheiro_rural_ibge": "deficit_banheiro_rural_ibge",
    "deficit_agua_urbana_ibge": "deficit_agua_urbana_ibge",
    "deficit_esgoto_urbana_ibge": "deficit_esgoto_urbana_ibge",
    "deficit_residuo_urbana_ibge": "deficit_residuo_urbana_ibge",
    "deficit_banheiro_urbana_ibge": "deficit_banheiro_urbana_ibge",
}
    
@router.get("/classificacao/{variavel}")
async def get_classificacao(response: Response, variavel: str, classes: int = 5, db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=3600"

    
    global last_cleanup
    now = time.time()

    # executa limpeza periódica
    if now - last_cleanup > CLEANUP_INTERVAL:
        _cleanup_cache()
        last_cleanup = now

    
    if classes < 2 or classes > 9:
        raise HTTPException(
            status_code=400,
            detail="Número de classes inválido."
        )


    coluna_sql = COLUNAS.get(variavel)
    if not coluna_sql:
        raise HTTPException(
            status_code=400,
            detail="Variável inválida."
        )

    cache_key = (variavel, classes)
    with cache_lock:
        cached = cache_jenks.get(cache_key)

    if cached:
        data, expires_at = cached
        if now < expires_at:
            return data
        with cache_lock:
            cache_jenks.pop(cache_key, None)

    sql = f"""
        SELECT {coluna_sql} AS valor
        FROM territorio.vw_base_municipal
        WHERE {coluna_sql} IS NOT NULL
    """

    result = await _execute_query(db, sql)

    valores = [
        float(row.valor)
        for row in result.fetchall()
    ]

    if len(valores) < classes:
        raise HTTPException(
            status_code=400,
            detail="Quantidade insuficiente de dados para classificação."
        )

    breaks = jenkspy.jenks_breaks(valores, n_classes=classes)

    resultado = {
        "variavel": variavel,
        "classes": classes,
        "breaks": breaks
    }

    with cache_lock:
        cache_jenks[cache_key] = (resultado, now + CACHE_TTL)

    return resultado