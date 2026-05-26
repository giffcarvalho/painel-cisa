"""Todos os endpoints do Mapa"""

import logging
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
import jenkspy
import time
from app.schemas.filtrosMapa import BuscaFiltroResponse, OpcoesFiltros


 
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
            cod_municipio: list[int] | None = Query(None),
            nr_instrumento: list[str] | None = Query(None),
            tipo_instrumento: list[str] | None = Query(None),
            acao_padronizada: list[str] | None = Query(None) 
    ):
        self.cod_uf = cod_uf
        self.cod_municipio = cod_municipio
        self.nr_instrumento = nr_instrumento
        self.tipo_instrumento = tipo_instrumento
        self.acao_padronizada = acao_padronizada
        

def _build_where(filtros: FiltrosMapa) -> tuple[str, dict]:  #--filtros: FiltrosMapa é recebido do frontend via depends. str é a string da cláusula where, dict é o dicionário com os valores dos params
    clauses: list[str] = []                                  #--é list porque é a junção de várias strings que vão ser concatenadas p/ formar a clásula where final
    params: dict = {}                                        #--é o dicionário com os valores dos params que foram recebidos do frontend

    
    
    array_filters = [                                        #--algumas colunas dessa rota são arrays
        ("cod_uf", filtros.cod_uf),
        ("cod_municipio", filtros.cod_municipio),
    ]

    normal_filters = [
        ("nr_instrumento", filtros.nr_instrumento, "nr_instrumento", int),              #--na sequência (coluna do banco, valor recebido, nome do params, cast)
        ("tipo_instrumento", filtros.tipo_instrumento, "tipo_instrumento", None),       #--quando é string no banco, não precisa de cast, pois frontend já entrega string
        ("acao_padronizada", filtros.acao_padronizada, "acao_padronizada", None)
    ]


    for col, values in array_filters:                                                   #--construção das clauses para colunas que são array no banco
        if values:
            clauses.append(f"{col} && :{col}")
            params[col] = values


    for col, values, param_key, cast_python in normal_filters:                          #--construção das clauses para colunas que não são array no banco
        if values:
            placeholder = ", ".join(f":{param_key}_{i}" for i in range(len(values)))    #--gera :cod_uf_0, :cod_uf_1, :cod_uf_2, etc isso vai compor a cláusula where depois
            clauses.append(f"{col} IN ({placeholder})")                                 #--gera um pedaço da clásula where: cod_uf in (:cod_uf_0, :cod_uf_1, :cod_uf_2)

            for i, v in enumerate(values):
                params[f"{param_key}_{i}"] = (cast_python(v) if cast_python else v)     #--cria o dicionário params, por exemplo: params["uf_0"] = "SP", params["uf_1"] = "RJ"

    where = (" AND ".join(clauses)) if clauses else ""                       #--cria a classe where final concatenando as clauses, separando por AND
    return where, params                                                                #--retorno da função -build_where, a clausula WHERE final o dicionário com os valores dos params


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



# box das ufs
@router.get("/ufs_bbox/{cod_uf}", summary="Encaixe das Unidades da Federação na tela")
async def get_ufs_bbox(cod_uf: int, db: AsyncSession = Depends(get_db)):

    
    sql = """
        SELECT
            ST_XMin(ext) AS xmin,
            ST_YMin(ext) AS ymin,
            ST_XMax(ext) AS xmax,
            ST_YMax(ext) AS ymax
        FROM (SELECT ST_Extent(geom) AS ext FROM territorio.tb_uf WHERE cod_uf = :cod_uf) t
    """
    
    result = await _execute_query(db, sql, {"cod_uf": cod_uf}) # transformar esse bloco em uma função e depois só chamar ela nas rotas?
    row = result.mappings().first()
    if not row:
        raise HTTPException(
            status_code=404,
            detail="UF não encontrada."
        )

    return row



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
CACHE_TTL = 3600
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

    
    cache_key = (variavel, classes)
    cached = cache_jenks.get(cache_key)

    if cached:
        data, expires_at = cached

        if time.time() < expires_at:
            return data

        del cache_jenks[cache_key]


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

    cache_jenks[cache_key] = (
        resultado,
        time.time() + CACHE_TTL
    )
    
    return resultado



# empreendimentos DSR
@router.get("/empreendimentos_dsr/{z}/{x}/{y}.pbf", summary="Empreendimentos DSR")
async def get_empreendimentos_dsr(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    
    tile_params = {"z": z, "x": x, "y": y}
    filter_clauses, filter_params = _build_where(filtros)
    spatial_where = """geom && ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326)"""

    where_clauses = [spatial_where]

    if filter_clauses:
        where_clauses.append(filter_clauses)

    where = "WHERE " + " AND ".join(where_clauses)

    params = {**tile_params, **filter_params}

    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom') AS mvt
        FROM (
            SELECT
                cod_uf,
                cod_municipio,
                nr_instrumento,
                tipo_instrumento,
                acao_padronizada,
                ST_AsMVTGeom(ST_Transform(geom, 3857), ST_TileEnvelope(:z, :x, :y), 4096, 256, true) AS geom
            FROM temporario.vw_coordenadas
            {where}
        ) AS tile;
    """
    
    result = await _execute_query(db, sql, params)
    row = result.fetchone()
    return Response(
        content=row.mvt if row and row.mvt else b"",
        media_type="application/x-protobuf",
        headers={"Cache-Control": "public, max-age=300"}
    )