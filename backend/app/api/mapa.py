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
from app.schemas.filtrosMapa import (
    UfItem, OpcoesFiltrosUf, 
    MunicipioItem, OpcoesFiltrosMunicipio,
    NrPropostaItem, OpcoesFiltrosNrProposta,
    NrInstrumentoItem, OpcoesFiltrosNrInstrumento,
    CodTciItem, OpcoesFiltrosCodTci,
    ModalidadeItem, OpcoesFiltrosModalidade,
    LocalidadeItem, OpcoesFiltrosLocalidade,
    LocalidadeEnderecoItem, OpcoesFiltrosLocalidadeEndereco,
    CategoriaMetropolitanaItem, OpcoesFiltrosCategoriaMetropolitana,
    InvestimentoSaneamentoItem, ListaInvestimentoSaneamento,
    DadosMunicipiosItem, ListaDadosMunicipios,
)

 
router = APIRouter()
logger = logging.getLogger(__name__)



#-----------------------------------------------------------------------------------------------------------------
# Criação da seção de conexão com o banco
#-----------------------------------------------------------------------------------------------------------------

async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None) -> CursorResult: 
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno de processamento ao consultar a base de dados."
        )





#-----------------------------------------------------------------------------------------------------------------
# Construção da cláusula WHERE de forma dinâmica. A construção é feita a partir dos params recebidos do frontend
#-----------------------------------------------------------------------------------------------------------------

#--Dependência de filtros
class FiltrosMapa:  #-- Dependência do FastAPI para agrupar todos os Query Parameters. Evita repetição nas assinaturas das funções de rota.
    def __init__(
            self,
            cod_uf: list[int] | None = Query(None), 
            cod_municipio: list[int] | None = Query(None),
            nr_proposta: list[str] | None = Query(None),
            nr_instrumento: list[int] | None = Query(None),
            cod_tci: list[str] | None = Query(None),
            modalidade: list[str] | None = Query(None),
            cod_localidade: list[int] | None = Query(None),
            cod_dsc_localidade: list[int] | None = Query(None),
            cod_catmetropol: list[int] | None = Query(None),
            semiarido_2022: list[bool] | None = Query(None),
            amazonia_legal: list[bool] | None = Query(None),
            vale_jequetinhonha: list[bool] | None = Query(None),
    ):
        self.cod_uf = cod_uf
        self.cod_municipio = cod_municipio
        self.nr_proposta = nr_proposta
        self.nr_instrumento = nr_instrumento
        self.cod_tci = cod_tci
        self.modalidade = modalidade
        self.cod_localidade = cod_localidade
        self.cod_dsc_localidade = cod_dsc_localidade
        self.cod_catmetropol = cod_catmetropol
        self.semiarido_2022 = semiarido_2022
        self.amazonia_legal = amazonia_legal
        self.vale_jequetinhonha = vale_jequetinhonha
        

def _build_where(filtros: FiltrosMapa, allowed: set[str] | None = None) -> tuple[str, dict]: 
    
    clauses: list[str] = []                                                                   #--é list porque é a junção de várias strings que vão ser concatenadas p/ formar a clásula where final
    params: dict = {}                                                                         #--é o dicionário com os valores dos params que foram recebidos do frontend
    
    # coluna do banco, valor do param recebido do frontend, nome do params, cast, sql_type, operador
    list_filters = [                                       
        ("cod_uf", filtros.cod_uf, "cod_uf", int, "int[]", "scalar"),                          
        ("cod_municipio", filtros.cod_municipio, "cod_municipio", int, "int[]", "scalar"),
        ("nr_proposta", filtros.nr_proposta, "nr_proposta", None, "text[]", "scalar"),
        ("nr_instrumento", filtros.nr_instrumento, "nr_instrumento", int, "int[]", "scalar"),
        ("cod_tci", filtros.cod_tci, "cod_tci", None, "text[]", "scalar"),
        ("modalidade", filtros.modalidade, "modalidade", None, "text[]", "scalar"),
        ("cod_localidade", filtros.cod_localidade, "cod_localidade", int, "bigint[]", "scalar"),
        ("cod_dsc_localidade", filtros.cod_dsc_localidade, "cod_dsc_localidade", int, "bigint[]", "scalar"),
        ("cod_catmetropol", filtros.cod_catmetropol, "cod_catmetropol", int, "int[]", "scalar"),
        ("semiarido_2022", filtros.semiarido_2022, "semiarido_2022", bool, "boolean[]", "scalar"),
        ("amazonia_legal", filtros.amazonia_legal, "amazonia_legal", bool, "boolean[]", "scalar"),
        ("vale_jequetinhonha", filtros.vale_jequetinhonha, "vale_jequetinhonha", bool, "boolean[]", "scalar"),
    ]

    for col, values, param_key, cast_python, sql_array_type, tipo in list_filters:
        
        if allowed and col not in allowed:
            continue

        if not values:
            continue
        
        params[param_key] = [cast_python(v) if cast_python else v for v in values]

        if tipo == "scalar":
            clauses.append(
                f"{col} = ANY(CAST(:{param_key} AS {sql_array_type}))"
            )
        elif tipo == "array_overlap":
            clauses.append(
                f"{col} && CAST(:{param_key} AS {sql_array_type})"
            )

    where = (" AND ".join(clauses)) if clauses else ""
    return where, params






#--------------------------------------------------------------------------------------------------------------
# Endpoints das listas de opções dos filtros
#--------------------------------------------------------------------------------------------------------------

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
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca do município.")] = None,  
    cod_uf: Annotated[int | None, Query(description="Código da UF.")] = None,                            
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=86400"

    sql = """
        SELECT
            cod_municipio,
            nome
        FROM territorio.vw_base_municipal
        WHERE 1=1
    """

    params = {"limit": limit}

    if cod_uf:
        sql += " AND cod_uf = :cod_uf"
        params["cod_uf"] = cod_uf


    texto = (q or "").strip()
    if texto:
        sql += " AND nome ILIKE :termo"
        params["termo"] = f"%{texto}%"


    sql += """
        ORDER BY nome
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosMunicipio(data=[MunicipioItem(**row) for row in result.mappings().all()])


# opções do filtro de nr_proposta
@router.get("/filtros/nr_propostas", response_model=OpcoesFiltrosNrProposta, summary="Lista dos números de proposta")
async def get_lista_nr_propostas(
    response: Response,
    filtros: FiltrosMapa = Depends(),
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca do número da proposta.")] = None,  
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"
    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_instrumento", "cod_tci", "modalidade"})


    sql = """
        WITH uniao AS (
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_dsr
        WHERE nr_proposta IS NOT NULL
        UNION
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_drf
        WHERE nr_proposta IS NOT NULL
        )
        SELECT DISTINCT(nr_proposta) FROM uniao
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []

    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("nr_proposta ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY nr_proposta
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosNrProposta(data=[NrPropostaItem(**row) for row in result.mappings().all()])



# opções do filtro de nr_instrumento
@router.get("/filtros/nr_instrumentos", response_model=OpcoesFiltrosNrInstrumento, summary="Lista dos números de instrumento")
async def get_lista_nr_instrumentos(
    response: Response,
    filtros: FiltrosMapa = Depends(), 
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca do número do instrumento.")] = None,  
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_proposta", "cod_tci", "modalidade"})

    sql = """
        WITH uniao AS (
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_dsr
        WHERE nr_instrumento IS NOT NULL
        UNION
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_drf
        WHERE nr_instrumento IS NOT NULL
        )
        SELECT DISTINCT(nr_instrumento) FROM uniao
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []
    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("nr_instrumento::text ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY nr_instrumento
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosNrInstrumento(data=[NrInstrumentoItem(**row) for row in result.mappings().all()])



# opções do filtro de cod_tci
@router.get("/filtros/cod_tci", response_model=OpcoesFiltrosCodTci, summary="Lista dos números de Códigos TCI. Identificador dos instrumentos no SACI")
async def get_lista_cod_tci(
    response: Response,
    filtros: FiltrosMapa = Depends(),
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca do código TCI.")] = None,  
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"
    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_proposta", "nr_instrumento", "modalidade"})


    sql = """
        WITH uniao AS (
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_dsr
        WHERE cod_tci IS NOT NULL
        UNION
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_drf
        WHERE cod_tci IS NOT NULL
        )
        SELECT DISTINCT(cod_tci) FROM uniao
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []

    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("cod_tci ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY cod_tci
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosCodTci(data=[CodTciItem(**row) for row in result.mappings().all()])


# opções do filtro de modalidade
@router.get("/filtros/modalidade", response_model=OpcoesFiltrosModalidade, summary="Lista das modalidades dos instrumentos de repasse")
async def get_lista_modalidade(
    response: Response,
    filtros: FiltrosMapa = Depends(),
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca da modalidade.")] = None,  
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"
    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_proposta", "nr_instrumento", "cod_tci", })


    sql = """
        WITH uniao AS (
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_dsr
        WHERE modalidade IS NOT NULL
        UNION
        SELECT
            nr_proposta,
            nr_instrumento,
            cod_tci,
            modalidade,
            cod_uf,
            cod_municipio
        FROM instrumento.vw_geometrias_carteira_drf
        WHERE modalidade IS NOT NULL
        )
        SELECT DISTINCT(modalidade) FROM uniao
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []

    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("modalidade ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY modalidade
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosModalidade(data=[ModalidadeItem(**row) for row in result.mappings().all()])



# opções do filtro de localidade
@router.get("/filtros/localidades", response_model=OpcoesFiltrosLocalidade, summary="Lista das localidades")
async def get_lista_localidades(
    response: Response,
    filtros: FiltrosMapa = Depends(), 
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca do nome da localidade.")] = None,  
    limit: Annotated[int, Query(ge=1, le=50, description="Quantidade máxima de resultados.")] = 50,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})

    sql = """
        SELECT DISTINCT
            cod_localidade,
            nome_localidade            
        FROM territorio.vw_base_localidade
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []
    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("nome_localidade ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY nome_localidade
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosLocalidade(data=[LocalidadeItem(**row) for row in result.mappings().all()])



# opções do filtro de localidade dos enderecos
@router.get("/filtros/localidade_enderecos", response_model=OpcoesFiltrosLocalidadeEndereco, summary="Lista das descrições de localidade dos enderecos")
async def get_lista_localidade_enderecos(
    response: Response,
    filtros: FiltrosMapa = Depends(), 
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca do nome da localidade do endereco.")] = None,  
    limit: Annotated[int, Query(ge=1, le=30, description="Quantidade máxima de resultados.")] = 30,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})

    sql = """
        SELECT
            cod_uf,
            cod_municipio,
            cod_dsc_localidade,
            dsc_localidade            
        FROM territorio.vw_localidade_endereco
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []
    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("dsc_localidade ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY dsc_localidade
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosLocalidadeEndereco(data=[LocalidadeEnderecoItem(**row) for row in result.mappings().all()])




# opções do filtro de categorias metropolitanas
@router.get("/filtros/categorias_metropolitanas", response_model=OpcoesFiltrosCategoriaMetropolitana, summary="Lista das categorias metropolitanas")
async def get_lista_categorias_metropolitanas(
    response: Response,
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca das categorias metropolitanas.")] = None,  
    limit: Annotated[int, Query(ge=1, le=50, description="Quantidade máxima de resultados.")] = 40,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"

    sql = """
        SELECT
            cod_catmetropol,
            label_catmetropol            
        FROM territorio.tb_categoria_metropolitana
    """

    params = {"limit": limit}
    
    texto = (q or "").strip()

    if texto:
        sql += """
            WHERE label_catmetropol ILIKE :termo
        """
        params["termo"] = f"%{texto}%"

    sql += """
        ORDER BY label_catmetropol
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return OpcoesFiltrosCategoriaMetropolitana(data=[CategoriaMetropolitanaItem(**row) for row in result.mappings().all()])



#--------------------------------------------------------------------------------------------------------------
# Endpoints das bounding box das geometrias filtradas
#--------------------------------------------------------------------------------------------------------------

# bounding box das UFS. Busca para cada UF filtrada os limites de sua geometria. Informação usada para o mapa fazer o fly e enquadrar na UF selecionada
@router.get("/bbox_ufs", summary="Bounding box das Unidades da Federação")
async def get_bbox_ufs(filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf"})

    sql = f"""
        SELECT
            ST_XMin(ext) AS xmin,
            ST_YMin(ext) AS ymin,
            ST_XMax(ext) AS xmax,
            ST_YMax(ext) AS ymax
        FROM (
            SELECT ST_Extent(ST_Transform(geom, 4326)) AS ext
            FROM territorio.vw_base_uf
    """
    if where_filtro:
        sql += f"""
            WHERE {where_filtro}
        """

    sql += """) t"""

        
    result = await _execute_query(db, sql, params_filtro)
    row = result.mappings().first()
    return row



# bounding box dos Municípios. Busca para cada Município filtrado os limites de sua geometria. Informação usada para o mapa fazer o fly e enquadrar no Município selecionado
@router.get("/bbox_municipios", summary="Bounding box dos Municípios")
async def get_bbox_municipios(filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_municipio"})

    sql = f"""
        SELECT
            ST_XMin(ext) AS xmin,
            ST_YMin(ext) AS ymin,
            ST_XMax(ext) AS xmax,
            ST_YMax(ext) AS ymax
        FROM (
            SELECT ST_Extent(ST_Transform(geom_2022, 4326)) AS ext
            FROM territorio.vw_base_municipal
    """
    if where_filtro:
        sql += f"""
            WHERE {where_filtro}
        """

    sql += """) t"""

        
    result = await _execute_query(db, sql, params_filtro)
    row = result.mappings().first()
    return row


# bounding box da carteira_dsr
@router.get("/bbox_carteira_dsr", summary="Bounding box das coordenadas da Carteira DSR")
async def get_bbox_carteira_dsr(filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_proposta", "nr_instrumento", "cod_tci"})

    sql = f"""
        WITH 
        uniao AS (
            SELECT cod_tci, nr_proposta, nr_instrumento, modalidade, cod_uf, cod_municipio, geom
            FROM instrumento.vw_geometrias_carteira_dsr
            UNION
            SELECT cod_tci, nr_proposta, nr_instrumento, modalidade, cod_uf, cod_municipio, geom
            FROM instrumento.vw_geometrias_carteira_drf
        ),
        filtrado AS (
            SELECT *
            FROM uniao
            {f"WHERE {where_filtro}" if where_filtro else ""}
        ),
        bbox AS (
            SELECT ST_Extent(ST_Transform(geom, 4326)) AS box
            FROM filtrado
        )
        SELECT
            ST_XMin(box) AS xmin,
            ST_YMin(box) AS ymin,
            ST_XMax(box) AS xmax,
            ST_YMax(box) AS ymax
        FROM bbox
    """

            
    result = await _execute_query(db, sql, params_filtro)
    row = result.mappings().first()
    return row

 

# bounding box das localidades
@router.get("/bbox_localidades", summary="Bounding box das localidades")
async def get_bbox_localidades(filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "cod_localidade"})

    sql = f"""
        SELECT
            ST_XMin(ext) AS xmin,
            ST_YMin(ext) AS ymin,
            ST_XMax(ext) AS xmax,
            ST_YMax(ext) AS ymax
        FROM (
            SELECT ST_Extent(ST_Transform(geom, 4326)) AS ext
            FROM territorio.vw_base_localidade
    """
    if where_filtro:
        sql += f"""
            WHERE {where_filtro}
        """

    sql += """) t"""

        
    result = await _execute_query(db, sql, params_filtro)
    row = result.mappings().first()
    return row


# bounding box dos enderecos
@router.get("/bbox_enderecos", summary="Bounding box dos enderecos")
async def get_bbox_enderecos(filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "cod_dsc_localidade"})

    sql = f"""
        SELECT
            ST_XMin(ext) AS xmin,
            ST_YMin(ext) AS ymin,
            ST_XMax(ext) AS xmax,
            ST_YMax(ext) AS ymax
        FROM (
            SELECT ST_Extent(ST_Transform(geom, 4326)) AS ext
            FROM territorio.vw_base_endereco
    """
    if where_filtro:
        sql += f"""
            WHERE {where_filtro}
        """

    sql += """) t"""

        
    result = await _execute_query(db, sql, params_filtro)
    row = result.mappings().first()
    return row



# bounding box das categorias metropolitanas
@router.get("/bbox_categorias_metropolitanas", summary="Bounding box das categorias metropolitanas")
async def get_bbox_categorias_metropolitanas(filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    clauses = []
    
    if where_filtro:
        clauses.append(where_filtro)

    if filtros.cod_catmetropol:
        params_filtro["cod_catmetropol"] = filtros.cod_catmetropol
        clauses.append("""
            EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = territorio.vw_base_municipal.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        """)

    sql = f"""
        SELECT
            ST_XMin(ext) AS xmin,
            ST_YMin(ext) AS ymin,
            ST_XMax(ext) AS xmax,
            ST_YMax(ext) AS ymax
        FROM (
            SELECT ST_Extent(ST_Transform(geom_2022, 4326)) AS ext
            FROM territorio.vw_base_municipal
    """
    
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
        sql += """
            ) t
        """
            
    result = await _execute_query(db, sql, params_filtro)
    row = result.mappings().first()
    return row



#--------------------------------------------------------------------------------------------------------------
# Endpoints das geometrias
#--------------------------------------------------------------------------------------------------------------

# geometria das ufs
@router.get("/ufs/{z}/{x}/{y}.pbf", summary="Unidades da Federação")
async def get_ufs(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"

    params = {"z": z, "x": x, "y": y}
    params.update(params_filtro)

    sql = f"""
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom', 'cod_uf') AS mvt
        FROM (
            SELECT
                cod_uf,
                ST_AsMVTGeom(
                    ST_Simplify(
                        geom,
                        CASE
                            WHEN :z <= 6 THEN 2000
                            WHEN :z <= 7 THEN 1200
                            WHEN :z <= 8 THEN 700
                            WHEN :z <= 9 THEN 400
                            ELSE 100
                        END,
                        false
                    ),
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_uf
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



# municipios 2025   
@router.get("/municipios_2025/{z}/{x}/{y}.pbf", summary="Municípios 2025")
async def get_municipios_2025(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio"})
    
    base_where = """
        geom_2025 && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = mp.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"

    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)


    sql = f"""
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom', 'cod_municipio') AS mvt
        FROM (
            SELECT
                cod_municipio,
                ST_AsMVTGeom(
                    ST_Simplify(
                        geom_2025,
                        CASE
                            WHEN :z <= 7 THEN 1200
                            WHEN :z <= 8 THEN 700
                            WHEN :z <= 9 THEN 400
                            ELSE 100
                        END,
                        false
                    ),
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_municipal mp
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

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = bd.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)

    sql = f"""
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom', 'cod_distrito') AS mvt
        FROM (
            SELECT
                cod_distrito,
                ST_AsMVTGeom(
                    ST_Simplify(
                        geom,
                        CASE
                            WHEN :z <= 8 THEN 700 
                            WHEN :z <= 9 THEN 400
                            ELSE 100
                        END,
                        false
                    ),
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_distrito bd
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

    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = cs.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)


    sql = f"""
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom', 'cod_setor') AS mvt
        FROM (
            SELECT
                cod_setor,
                cod_sit,
                situacao,
                cod_sit::char(1) || ' - ' || situacao_detalhada as situacao_detalhada,
                cod_municipio,
                nome_municipio || '/' || sigla_uf as nome_municipio,
                total_pessoas,
                total_domicilios,
                dppo_domicilios_particulares_permanentes_ocupados,
                jenks_perc_agua_forma_nao_adequada,
                jenks_perc_esgoto_tipo_nao_adequado,
                jenks_perc_lixo_destino_nao_adequado,
                jenks_perc_ban_sem_ban_exclusivo,
                perc_agua_forma_nao_adequada,
                perc_esgoto_tipo_nao_adequado,
                perc_lixo_destino_nao_adequado,
                perc_ban_sem_ban_exclusivo,
                ST_AsMVTGeom(
                    ST_Simplify(
                        geom,
                        CASE
                            WHEN :z <= 8 THEN 700 
                            WHEN :z <= 9 THEN 400
                            ELSE 0
                        END,
                        false
                    ),
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM censo.vw_base_setor_censitario cs
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


    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "cod_localidade"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = lc.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)


    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom', 'cod_localidade') AS mvt
        FROM (
            SELECT
                cod_localidade,
                categoria_localidade,
                nome_localidade,
                ST_AsMVTGeom(
                    geom,
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_localidade lc
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

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "cod_dsc_localidade"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = ed.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)


    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom', 'cod_endereco') AS mvt
        FROM (
            SELECT
                cod_endereco,
                cod_especie,
                dsc_localidade,
                especie,
                ST_AsMVTGeom(
                    geom,
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_endereco ed
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


# Cidades
@router.get("/cidades/{z}/{x}/{y}.pbf", summary="Cidades")
async def get_cidades(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha"})
    
    base_where = """
        geom_sede && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = bm.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)


    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom', 'cod_municipio') AS mvt
        FROM (
            SELECT
                cod_municipio,
                nome,
                ST_AsMVTGeom(
                    geom_sede,
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_municipal bm
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

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha"})
    
    base_where = """
        geom_2022 && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = bm.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)
    
    sql = f"""
        SELECT ST_AsMVT(tile, 'poligonos', 4096, 'geom', 'cod_municipio') AS mvt
        FROM (
            SELECT
                cod_municipio,
                cod_municipio as cod_ibge,
                nome,
                jenks_deficit_agua_rural_ibge,
                jenks_deficit_esgoto_rural_ibge,
                jenks_deficit_residuo_rural_ibge,
                jenks_deficit_banheiro_rural_ibge,
                jenks_deficit_agua_urbana_ibge,
                jenks_deficit_esgoto_urbana_ibge,
                jenks_deficit_residuo_urbana_ibge,
                jenks_deficit_banheiro_urbana_ibge,
                deficit_agua_rural_ibge,
                deficit_esgoto_rural_ibge,
                deficit_residuo_rural_ibge,
                deficit_banheiro_rural_ibge,
                deficit_agua_urbana_ibge,
                deficit_esgoto_urbana_ibge,
                deficit_residuo_urbana_ibge,
                deficit_banheiro_urbana_ibge,
                subgrupo,
                tipo_catmetropol,
                label_catmetropol,
                rm_prioritaria,
                populacao_total_censo_2022,
                populacao_total_censo_2022_maior_50000,
                sinisa_adimplencia_gestao_municipal,
                sinisa_adimplencia_agua,
                sinisa_adimplencia_esgoto,
                sinisa_declarou_possuir_pmsb,
                ST_AsMVTGeom(
                    ST_Simplify(
                        geom_2022,
                        CASE
                            WHEN :z <= 7 THEN 1200
                            WHEN :z <= 8 THEN 700
                            WHEN :z <= 9 THEN 400
                            ELSE 100
                        END,
                        false
                    ),
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM territorio.vw_base_municipal bm
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




# geometrias da carteira dsr
@router.get("/geometrias_carteira_dsr/{z}/{x}/{y}.pbf", summary="Geometrias da Carteira DSR")
async def get_geometrias_carteira_dsr(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_proposta", "nr_instrumento", "cod_tci", "modalidade", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = ct.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)

    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom', 'cod_tci_num') AS mvt
        FROM (
            SELECT
                cod_tci_num,
                cod_tci,
                nr_instrumento,
                nr_proposta,
                tipo_instrumento,
                modalidade,
                componente,
                objeto,
                valor_global,
                valor_repasse,
                situacao_projeto,
                situacao_obra,
                link_transferegov,
                link_saci,
                ST_AsMVTGeom(
                    geom,
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM instrumento.vw_geometrias_carteira_dsr ct
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



# geometrias da carteira drf
@router.get("/geometrias_carteira_drf/{z}/{x}/{y}.pbf", summary="Geometrias da Carteira DRF")
async def get_geometrias_carteira_drf(z: int, x: int, y: int, filtros: FiltrosMapa = Depends(), db: AsyncSession = Depends(get_db)):

    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_uf", "cod_municipio", "nr_proposta", "nr_instrumento", "cod_tci", "modalidade", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha"})
    
    base_where = """
        geom && ST_TileEnvelope(:z, :x, :y)
        AND (
            CAST(:cod_catmetropol AS int[]) IS NULL
            OR EXISTS (
                SELECT 1
                FROM territorio.vw_categoria_metropolitana_municipio cm
                WHERE cm.cod_municipio = ct.cod_municipio
                AND cm.cod_catmetropol = ANY(CAST(:cod_catmetropol AS int[]))
            )
        )
    """

    if where_filtro:
        base_where += f" AND {where_filtro}"
    
    params = {"z": z, "x": x, "y": y, "cod_catmetropol": filtros.cod_catmetropol}
    params.update(params_filtro)

    sql = f"""
        SELECT ST_AsMVT(tile, 'pontos', 4096, 'geom', 'cod_tci_num') AS mvt
        FROM (
            SELECT
                cod_tci_num,
                cod_tci,
                nr_instrumento,
                nr_proposta,
                tipo_instrumento,
                modalidade,
                objeto,
                link_transferegov,
                link_saci,
                ST_AsMVTGeom(
                    geom,
                    ST_TileEnvelope(:z, :x, :y),
                    4096,
                    256,
                    true
                ) AS geom
            FROM instrumento.vw_geometrias_carteira_drf ct
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




# investimentos em saneamento
@router.get("/investimento_saneamento", response_model=ListaInvestimentoSaneamento, summary="Lista dos instrumentos de saneamento")
async def get_investimento_saneamento(
    response: Response,
    filtros: FiltrosMapa = Depends(),
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca.")] = None,  
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"
    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_municipio"})


    sql = """
        SELECT
            id,
            cod_municipio,
            descricao,
            orgao,
            link_transferegov,
            link_obrasgov            
        FROM instrumento.vw_investimento_saneamento
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []

    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("orgao ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY orgao
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return ListaInvestimentoSaneamento(data=[InvestimentoSaneamentoItem(**row) for row in result.mappings().all()])



# dados dos municipios
@router.get("/dados_municipios", response_model=ListaDadosMunicipios, summary="Dados gerais dos municipios")
async def get_dados_municipios(
    response: Response,
    filtros: FiltrosMapa = Depends(),
    q: Annotated[str | None, Query(max_length=100, description="Termo de busca.")] = None,  
    limit: Annotated[int, Query(ge=1, le=100, description="Quantidade máxima de resultados.")] = 100,
    db: AsyncSession = Depends(get_db)):

    response.headers["Cache-Control"] = "public, max-age=600"
    
    where_filtro, params_filtro = _build_where(filtros, allowed={"cod_municipio"})


    sql = """
        SELECT
            cod_municipio,
            nome,
            label_catmetropol,
            CASE
	            WHEN rm_prioritaria IS NULL OR rm_prioritaria IS FALSE THEN 'Não'
	            WHEN rm_prioritaria IS TRUE THEN 'Sim'
	            ELSE 'verificar'
	        END AS rm_prioritaria,
            subgrupo,
            populacao_total_censo_2022
        FROM territorio.vw_base_municipal
    """

    params = {"limit": limit}
    params.update(params_filtro)
    clauses = []

    
    if where_filtro: clauses.append(where_filtro)

    texto = (q or "").strip()

    if texto:
        clauses.append("nome ILIKE :termo")
        params["termo"] = f"%{texto}%"

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)


    sql += """
        ORDER BY cod_municipio
        LIMIT :limit
    """

    result = await _execute_query(db, sql, params)
    return ListaDadosMunicipios(data=[DadosMunicipiosItem(**row) for row in result.mappings().all()])