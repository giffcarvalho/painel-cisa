"""Endpoints das Pontos de Controle"""

import logging
from typing import Annotated
from fastapi import (APIRouter, Depends, Query, Response, HTTPException, status)
from sqlalchemy import text, CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.api.auth import obter_usuario_atual
from app.core.database import get_db
from app.schemas.pontos_controle import (
    PontosControleOpcoesFiltroResponse,
    PontosControleListaResponse,
    PontosControleDataDados,
    PontosControleDadosAdicionaisItem,
    PlanoAcaoEnviadoResponse,
    PlanoAcaoCreate,
    PlanoAcaoBusca,
    PlanoAcaoBuscaItem,
    ContatoEnviadoResponse,
    ContatoCreate,
    ContatoBusca,
    ContatoBuscaItem,
    PlanoAcaoHistorico,
    PlanoAcaoHistoricoItem,
    ContatoMandatariaBuscaItem,
    ContatoMandatariaBusca,
)

router = APIRouter()
logger = logging.getLogger(__name__)

MV = "instrumento.vw_monitoramento_instrumento"
MV_MUNICIPIOS = "instrumento.vw_instrumento_municipio"



COLUNAS_COM_FILTRO = {
    "nr_instrumento",
    "proponente",
    "municipios_beneficiados",
    "uf",
    "carteira_ativa",
    "possui_aio",
    "projeto_aprovado",
    "acao",
    "nivel",
    "coordenacao",
    "monitor",
    "prazo_clausulas_suspensivas",
    "prazo_emissao_lae",
    "prazo_inicio_licitacao",
    "prazo_conclusao_licitacao",
    "prazo_vrpl",
    "prazo_contratacao",
    "prazo_solicitacao_aio",
    "prazo_analise_tecnica_aio",
    "prazo_analise_executiva_aio",
    "prazo_registro_aio",
    "prazo_emissao_os",
    "prazo_inicio_execucao_fisica",
    "prazo_progresso_fisico",
    "prazo_indicio_paralisacao",
    "status_paralisacao_obra",
    "vistoria_in_loco_parciais",
    "prazo_vistoria_final",
    "obras_proximas_conclusao",
    "registro_conclusao",
    "vigencia",
    "status_de_execucao_da_obra",
}


class FiltrosPontosControle:
    def __init__(
        self,
        nr_instrumento: list[str] | None = Query(None),
        proponente: list[str] | None = Query(None),
        municipios_beneficiados: list[str] | None = Query(None),
        uf: list[str] | None = Query(None),
        carteira_ativa: list[str] | None = Query(None),
        projeto_aprovado: list[str] | None = Query(None),
        possui_aio: list[str] | None = Query(None),
        coordenacao: list[str] | None = Query(None),
        acao: list[str] | None = Query(None),
        nivel: list[str] | None = Query(None),
        monitor: list[str] | None = Query(None),
        prazo_clausulas_suspensivas: list[str] | None = Query(None),
        prazo_emissao_lae: list[str] | None = Query(None),
        prazo_inicio_licitacao: list[str] | None = Query(None),
        prazo_conclusao_licitacao: list[str] | None = Query(None),
        prazo_vrpl: list[str] | None = Query(None),
        prazo_contratacao: list[str] | None = Query(None),
        prazo_solicitacao_aio: list[str] | None = Query(None),
        prazo_analise_tecnica_aio: list[str] | None = Query(None),
        prazo_analise_executiva_aio: list[str] | None = Query(None),
        prazo_registro_aio: list[str] | None = Query(None),
        prazo_emissao_os: list[str] | None = Query(None),
        prazo_inicio_execucao_fisica: list[str] | None = Query(None),
        prazo_progresso_fisico: list[str] | None = Query(None),
        prazo_indicio_paralisacao: list[str] | None = Query(None),
        status_paralisacao_obra: list[str] | None = Query(None),
        vistoria_in_loco_parciais: list[str] | None = Query(None),
        prazo_vistoria_final: list[str] | None = Query(None),
        obras_proximas_conclusao: list[str] | None = Query(None),
        registro_conclusao: list[str] | None = Query(None),
        vigencia: list[str] | None = Query(None),
        status_de_execucao_da_obra: list[str] | None = Query(None),
    ):
        self.nr_instrumento = nr_instrumento
        self.proponente = proponente
        self.municipios_beneficiados = municipios_beneficiados
        self.uf = uf
        self.carteira_ativa = carteira_ativa
        self.projeto_aprovado = projeto_aprovado
        self.possui_aio = possui_aio
        self.coordenacao = coordenacao
        self.acao = acao
        self.nivel = nivel
        self.monitor = monitor
        self.prazo_clausulas_suspensivas = prazo_clausulas_suspensivas
        self.prazo_emissao_lae = prazo_emissao_lae
        self.prazo_inicio_licitacao = prazo_inicio_licitacao
        self.prazo_conclusao_licitacao = prazo_conclusao_licitacao
        self.prazo_vrpl = prazo_vrpl
        self.prazo_contratacao = prazo_contratacao
        self.prazo_solicitacao_aio = prazo_solicitacao_aio
        self.prazo_analise_tecnica_aio = prazo_analise_tecnica_aio
        self.prazo_analise_executiva_aio = prazo_analise_executiva_aio
        self.prazo_registro_aio = prazo_registro_aio
        self.prazo_emissao_os = prazo_emissao_os
        self.prazo_inicio_execucao_fisica = prazo_inicio_execucao_fisica
        self.prazo_progresso_fisico = prazo_progresso_fisico
        self.prazo_indicio_paralisacao = prazo_indicio_paralisacao
        self.status_paralisacao_obra = status_paralisacao_obra
        self.vistoria_in_loco_parciais = vistoria_in_loco_parciais
        self.prazo_vistoria_final = prazo_vistoria_final
        self.obras_proximas_conclusao = obras_proximas_conclusao
        self.registro_conclusao = registro_conclusao
        self.vigencia = vigencia
        self.status_de_execucao_da_obra = status_de_execucao_da_obra


async def _execute_query(
    db: AsyncSession,
    sql: str,
    params: dict | None = None,
) -> CursorResult:
    try:
        return await db.execute(
            text(sql),
            params or {},
        )
    except SQLAlchemyError as e:
        logger.exception(
            "Erro no banco de dados ao executar SQL:\n%s\nParâmetros: %s",
            sql,
            params,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Erro interno de processamento "
                "ao consultar a base de dados."
            ),
        )


def _build_where(
    filtros: FiltrosPontosControle,
    coluna_atual: str | None = None,
) -> tuple[str, dict]:

    clauses: list[str] = []
    params: dict = {}

    
    if filtros.municipios_beneficiados and coluna_atual != "municipios_beneficiados":
        municipio_clauses = []
        for i, value in enumerate(filtros.municipios_beneficiados):
            value = str(value).strip()
            if not value:
                continue
            try:
                cod_municipio = int(value)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Código de município inválido: {value}")

            key = f"cod_municipio_{i}"
            municipio_clauses.append(f"""
                EXISTS (
                    SELECT 1
                    FROM {MV_MUNICIPIOS} m_filtro
                    WHERE m_filtro.nr_instrumento = mv.nr_instrumento
                    AND m_filtro.cod_municipio = :{key}
                )
            """)
            params[key] = cod_municipio

        if municipio_clauses:
            clauses.append("(" + " OR ".join(municipio_clauses) + ")")

    

    if filtros.uf and coluna_atual != "uf":
        uf_clauses = []
        for i, value in enumerate(filtros.uf):
            value = str(value).strip()
            if not value:
                continue
            try:
                cod_uf = int(value)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Código de UF inválido: {value}")

            key = f"cod_uf_{i}"
            uf_clauses.append(f"""
                EXISTS (
                    SELECT 1
                    FROM {MV_MUNICIPIOS} m_filtro
                    WHERE m_filtro.nr_instrumento = mv.nr_instrumento
                    AND m_filtro.cod_uf = :{key}
                )
            """)
            params[key] = cod_uf

        if uf_clauses:
            clauses.append("(" + " OR ".join(uf_clauses) + ")")

    
    if filtros.monitor and coluna_atual != "monitor":
        monitor_clauses = []
        for i, value in enumerate(filtros.monitor):
            value = str(value).strip()
            if not value:
                continue

            key = f"monitor_{i}"
            monitor_clauses.append(f"""
                EXISTS (
                    SELECT 1
                    FROM painel_dsr.tb_usuario_instrumento_monitoramento ui_f
                    JOIN painel_dsr.tb_usuario u_f ON u_f.id_usuario = ui_f.id_usuario
                    WHERE ui_f.nr_instrumento = mv.nr_instrumento
                    AND ui_f.ordem_prioridade = 1
                    AND ui_f.ativo IS TRUE
                    AND u_f.nome ILIKE :{key}
                )
            """)
            params[key] = f"%{value}%"

        if monitor_clauses:
            clauses.append("(" + " OR ".join(monitor_clauses) + ")")

    
    list_filters = [
        ("nr_instrumento", filtros.nr_instrumento, "nr_instrumento", "text"),
        ("proponente", filtros.proponente, "proponente", None),
        ("carteira_ativa", filtros.carteira_ativa, "carteira_ativa", None),
        ("projeto_aprovado", filtros.projeto_aprovado, "projeto_aprovado", None),
        ("possui_aio", filtros.possui_aio, "possui_aio", None),
        ("coordenacao", filtros.coordenacao, "coordenacao", None),
        ("acao", filtros.acao, "acao", None),
        ("nivel", filtros.nivel, "nivel", None),
        ("prazo_clausulas_suspensivas", filtros.prazo_clausulas_suspensivas, "prazo_clausulas_suspensivas", None),
        ("prazo_emissao_lae", filtros.prazo_emissao_lae, "prazo_emissao_lae", None),
        ("prazo_inicio_licitacao", filtros.prazo_inicio_licitacao, "prazo_inicio_licitacao", None),
        ("prazo_conclusao_licitacao", filtros.prazo_conclusao_licitacao, "prazo_conclusao_licitacao", None),
        ("prazo_vrpl", filtros.prazo_vrpl, "prazo_vrpl", None),
        ("prazo_contratacao", filtros.prazo_contratacao, "prazo_contratacao", None),
        ("prazo_solicitacao_aio", filtros.prazo_solicitacao_aio, "prazo_solicitacao_aio", None),
        ("prazo_analise_tecnica_aio", filtros.prazo_analise_tecnica_aio, "prazo_analise_tecnica_aio", None),
        ("prazo_analise_executiva_aio", filtros.prazo_analise_executiva_aio, "prazo_analise_executiva_aio", None),
        ("prazo_registro_aio", filtros.prazo_registro_aio, "prazo_registro_aio", None),
        ("prazo_emissao_os", filtros.prazo_emissao_os, "prazo_emissao_os", None),
        ("prazo_inicio_execucao_fisica", filtros.prazo_inicio_execucao_fisica, "prazo_inicio_execucao_fisica", None),
        ("prazo_progresso_fisico", filtros.prazo_progresso_fisico, "prazo_progresso_fisico", None),
        ("prazo_indicio_paralisacao", filtros.prazo_indicio_paralisacao, "prazo_indicio_paralisacao", None),
        ("status_paralisacao_obra", filtros.status_paralisacao_obra, "status_paralisacao_obra", None),
        ("vistoria_in_loco_parciais", filtros.vistoria_in_loco_parciais, "vistoria_in_loco_parciais", None),
        ("prazo_vistoria_final", filtros.prazo_vistoria_final, "prazo_vistoria_final", None),
        ("obras_proximas_conclusao", filtros.obras_proximas_conclusao, "obras_proximas_conclusao", None),
        ("registro_conclusao", filtros.registro_conclusao, "registro_conclusao", None),
        ("vigencia", filtros.vigencia, "vigencia", None),
        ("status_de_execucao_da_obra", filtros.status_de_execucao_da_obra, "status_de_execucao_da_obra", None),
    ]

    for col, values, param_key, cast_type in list_filters:
        
        if not values or col == coluna_atual:
            continue

        clean_values = [str(v).strip() for v in values if str(v).strip()]
        if not clean_values:
            continue

        placeholder_parts = []
        for i, val in enumerate(clean_values):
            key = f"{param_key}_{i}"
            placeholder_parts.append(f":{key}")
            params[key] = val

        placeholder = ", ".join(placeholder_parts)
        sql_col = f"{col}::{cast_type}" if cast_type else col

        clauses.append(f"{sql_col} IN ({placeholder})")

    where = "WHERE " + " AND ".join(clauses) if clauses else "WHERE TRUE"
    return where, params




@router.get(
    "/opcoes_filtros/{nome_coluna}",
    response_model=PontosControleOpcoesFiltroResponse,
    summary="Busca as opções dos filtros dos Pontos de Controle",
)
async def buscar_opcoes_filtro(
    nome_coluna: str,
    response: Response,
    filtros: FiltrosPontosControle = Depends(),
    db: AsyncSession = Depends(get_db),
):
    
    where, params = _build_where(filtros, coluna_atual=nome_coluna)

    response.headers["Cache-Control"] = ("private, max-age=300" if params else "public, max-age=3600")

    if nome_coluna == "municipios_beneficiados":
        sql = f"""
            SELECT DISTINCT
                mu.cod_municipio::text AS valor,
                mu.nome AS rotulo
            FROM {MV} mv
            JOIN {MV_MUNICIPIOS} mu ON mu.nr_instrumento = mv.nr_instrumento
            {where} AND mu.nome IS NOT NULL
            ORDER BY mu.nome
        """

    elif nome_coluna == "uf":
        sql = f"""
            SELECT DISTINCT
                mu.cod_uf::text AS valor, 
                mu.sigla_uf AS rotulo
            FROM {MV} mv
            JOIN {MV_MUNICIPIOS} mu ON mu.nr_instrumento = mv.nr_instrumento
            {where} AND mu.sigla_uf IS NOT NULL
            ORDER BY mu.sigla_uf
        """

    elif nome_coluna == "monitor":
        sql = f"""
            SELECT DISTINCT 
                u.id_usuario::text AS valor,
                u.nome AS rotulo
            FROM {MV} mv
            JOIN painel_dsr.tb_usuario_instrumento_monitoramento ui ON ui.nr_instrumento = mv.nr_instrumento
            JOIN painel_dsr.tb_usuario u ON u.id_usuario = ui.id_usuario
            {where} AND ui.ordem_prioridade = 1 AND ui.ativo IS TRUE AND u.nome IS NOT NULL
            ORDER BY u.nome
        """

    elif nome_coluna in COLUNAS_COM_FILTRO:
        sql = f"""
            SELECT DISTINCT 
                {nome_coluna}::text AS valor, 
                {nome_coluna}::text AS rotulo
            FROM {MV} mv
            {where} AND {nome_coluna} IS NOT NULL
            ORDER BY rotulo
        """
    
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Coluna '{nome_coluna}' inválida ou não suportada."
        )

    result = await _execute_query(db, sql, params)

    lista_opcoes = [
        {"valor": str(row.valor), "rotulo": str(row.rotulo)} 
        for row in result.mappings().all()
    ]

    return {"lista": lista_opcoes}




@router.get(
    "/instrumentos",
    response_model=PontosControleListaResponse,
    summary="Lista instrumentos dos Pontos de Controle",
)
async def get_instrumentos(
    response: Response,
    filtros: FiltrosPontosControle = Depends(),
    pagina: Annotated[
        int,
        Query(
            ge=1,
            description=(
                "Número da página, "
                "começando em 1."
            ),
        ),
    ] = 1,
    tamanho_pagina: Annotated[
        int,
        Query(
            ge=1,
            le=500,
            description="Itens por página.",
        ),
    ] = 100,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = (
        "private, max-age=300"
    )

    where, params = _build_where(filtros)
    offset = ((pagina - 1) * tamanho_pagina)

    data_params = {
        **params,
        "limit": tamanho_pagina,
        "offset": offset,
    }

    count_sql = f"""
        SELECT COUNT(*)
        FROM {MV} mv
        {where}
    """

    data_sql = f"""
        SELECT

            mv.nr_instrumento::text AS nr_instrumento,
            mv.cod_tci,
            mv.id_proponente as id_recebedor,
            mv.proponente,
            EXISTS (SELECT 1 FROM painel_dsr.tb_contato_recebedor c WHERE c.id_recebedor = mv.id_proponente AND c.nome IS NOT NULL) AS tem_contato,
            mv.municipios_beneficiados,
            mv.uf,
            mv.link_transferegov,
            mv.carteira_ativa,
            mv.projeto_aprovado,
            mv.possui_aio,
            mv.coordenacao,
            mv.acao,
            mv.nivel,
            mv.monitor,
            EXISTS (SELECT 1 FROM painel_dsr.tb_ponto_controle_acao a WHERE a.nr_instrumento = mv.nr_instrumento) AS tem_acao,
            mv.prazo_clausulas_suspensivas,
            mv.prazo_emissao_lae,
            mv.prazo_inicio_licitacao,
            mv.prazo_conclusao_licitacao,
            mv.prazo_vrpl,
            mv.prazo_contratacao,
            mv.prazo_solicitacao_aio,
            mv.prazo_analise_tecnica_aio,
            mv.prazo_analise_executiva_aio,
            mv.prazo_registro_aio,
            mv.prazo_emissao_os,
            mv.prazo_inicio_execucao_fisica,
            mv.prazo_progresso_fisico,
            mv.prazo_indicio_paralisacao,
            mv.status_paralisacao_obra,
            mv.vistoria_in_loco_parciais,
            mv.prazo_vistoria_final,
            mv.obras_proximas_conclusao,
            mv.registro_conclusao,
            mv.vigencia,
            mv.status_de_execucao_da_obra
        FROM {MV} mv

        {where}

        ORDER BY
            nr_instrumento::text

        LIMIT :limit
        OFFSET :offset
    """

    count_result = await _execute_query(
        db,
        count_sql,
        params,
    )

    data_result = await _execute_query(
        db,
        data_sql,
        data_params,
    )

    return PontosControleListaResponse(
        total=count_result.scalar_one(),
        pagina=pagina,
        tamanho_pagina=tamanho_pagina,
        data=[
            dict(r)
            for r in data_result.mappings().all()
        ],
    )


@router.get(
    "/data_dados",
    response_model=PontosControleDataDados,
    summary=("Informa a data dos dados que alimenta os pontos de controle"),
)
async def get_data_dados(
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = (
        "private, max-age=300"
    )

    sql = """
        SELECT
            fonte,
            data_dados
        FROM public.tb_data_dados
        WHERE fonte IN ('transferegov', 'caixa')
    """

    result = await _execute_query(db, sql)

    return PontosControleDataDados(
        data=[
            dict(r)
            for r in result.mappings().all()
        ]
    )



@router.get(
    "/dados_adicionais/{nr_instrumento}",
    response_model=PontosControleDadosAdicionaisItem,
    summary="Retorna dados adicionais de um instrumento especifico"
)
async def get_dados_adicionais(
    nr_instrumento: str,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    
    response.headers["Cache-Control"] = ("private, max-age=300")

    sql = """
        SELECT
            nr_instrumento,
            nr_proposta,
            operacao,
            cod_tci,
            nr_proposta_selecao_pac,
            tipo_instrumento,
            acao_orcamentaria,
            componente,
            dia_fim_vigenc_conv,
            situacao_contrato,
            situacao_projeto,
            situacao_obra,
            valor_repasse,
            valor_contrapartida,
            valor_empenhado,
            valor_desembolsado,
            valor_desbloqueado,
            valor_pago,
            percentual_fisico_informado,
            percentual_fisico_aferido,
            data_ultimo_bm
        FROM instrumento.vw_carteira_dsr
        WHERE nr_instrumento = :nr_instrumento
    """

    result = await _execute_query(db, sql, {"nr_instrumento": nr_instrumento})
    item = result.mappings().first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dados adicionais não encontrados para o instrumento {nr_instrumento}"
        )

    
    return PontosControleDadosAdicionaisItem(**dict(item))
    


# Envia os dados do plano de ação para o banco
@router.post(
    "/envio_plano_acao",
    response_model=PlanoAcaoEnviadoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Realiza o envio do formulário do plano de ação para o banco",
)
async def salvar_plano_acao(
    dadosFormulario: PlanoAcaoCreate,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    try:
        # 1. Converte os dados do formulário para dicionário
        payload = dadosFormulario.model_dump()

        # 2. Injeta o id_usuario obtido com segurança a partir do token
        payload["id_usuario"] = usuario_atual.id_usuario

        result = await db.execute(
            text(
                """
                INSERT INTO painel_dsr.tb_ponto_controle_acao (
                    nr_instrumento,
                    id_usuario,
                    ponto_controle,
                    status_ponto_controle,
                    confirmacao,
                    coordenacao,
                    mandataria,
                    recebedor,
                    descricao_acao,
                    prazo_pactuado
                ) 
                VALUES (
                    :nr_instrumento,
                    :id_usuario,
                    :ponto_controle,
                    :status_ponto_controle,
                    :confirmacao,
                    :coordenacao,
                    :mandataria,
                    :recebedor,
                    :descricao_acao,
                    :prazo_pactuado
                )
                RETURNING
                    id_acao,
                    criado_em
                """
            ),
            payload,
        )

        # Captura a primeira linha retornada pelo cláusula RETURNING
        linha_inserida = result.mappings().first()

        await db.commit()

        
        return {
            "id_acao": linha_inserida["id_acao"],
            "criado_em": linha_inserida["criado_em"],
            "mensagem": "Ação salva com sucesso!",
        }

    except Exception:
        
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao salvar o plano de ação.",
        )




@router.get("/busca_plano_acao", response_model=PlanoAcaoBusca, summary=("Busca o histórico de Planos de Ação"))
async def get_plano_acao(response: Response, db: AsyncSession = Depends(get_db)):
    
    # Estou testando essa linha abaixo de no-cache, para ver se resolve o bug do plano de ação vir antigo quando o usuario salva e reabre logo em seguida
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    # Para voltar com o cahe, descomente linha abaixo e apague a linha de cima
    #response.headers["Cache-Control"] = ("private, max-age=300")

    sql = """
        SELECT
            p.id_acao,
            p.nr_instrumento,
            u.nome as usuario,
            p.ponto_controle,
            p.status_ponto_controle,
            p.confirmacao,
            p.coordenacao,
            p.mandataria,
            p.recebedor,
            p.descricao_acao,
            p.prazo_pactuado,
            p.criado_em
        FROM painel_dsr.tb_ponto_controle_acao p
        LEFT JOIN painel_dsr.tb_usuario u ON u.id_usuario = p.id_usuario
        ORDER BY p.nr_instrumento, p.ponto_controle, p.id_acao DESC
    """

    result = await _execute_query(db, sql)


    
    return PlanoAcaoBusca(
      data=[PlanoAcaoBuscaItem(**r) for r in result.mappings().all()]
    )
    



# Envia os dados dos contatos para o banco
@router.post(
    "/envio_contato",
    response_model=ContatoEnviadoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Realiza o envio do formulário dos contatos para o banco",
)
async def salvar_contato(
    contatosParaEnviar: ContatoCreate,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Prepara a lista de dicionários injetando id_usuario
        payload = [
            {**contato.model_dump(), "id_usuario": usuario_atual.id_usuario}
            for contato in contatosParaEnviar.data
        ]

        # UPSERT: Insere novos ou atualiza existentes se já houver registro com mesmo (id_recebedor, nr_contato)
        query = text("""
            INSERT INTO painel_dsr.tb_contato_recebedor (
                id_usuario,
                id_recebedor,
                nr_contato,
                nome,
                cargo,
                telefone,
                email,
                observacao
            ) 
            VALUES (
                :id_usuario,
                :id_recebedor,
                :nr_contato,
                :nome,
                :cargo,
                :telefone,
                :email,
                :observacao
            )
            ON CONFLICT (id_recebedor, nr_contato) DO UPDATE SET
                id_usuario = EXCLUDED.id_usuario,
                nome = EXCLUDED.nome,
                cargo = EXCLUDED.cargo,
                telefone = EXCLUDED.telefone,
                email = EXCLUDED.email,
                observacao = EXCLUDED.observacao,
                alterado_em = NOW();
        """)

        # Executa para todos os itens do payload
        await db.execute(query, payload)
        await db.commit()

        return {
            "sucesso": True,
            "mensagem": "Contatos salvos com sucesso!",
            "total_salvos": len(payload)
        }

    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao salvar os contatos.",
        )





@router.get(
    "/busca_contato",
    response_model=ContatoBusca,
    summary=("Busca os contatos do recebedor, se houver")
)
async def get_contato(
    id_recebedor: int = Query(..., description="ID do recebedor para filtrar"),
    response: Response = None,
    db: AsyncSession = Depends(get_db)
):
    
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    
    sql = text( """
        SELECT
            c.id_recebedor,
            u.nome as usuario,
            c.nr_contato,
            c.nome,
            c.cargo,
            c.telefone,
            c.email,
            c.observacao,
            c.alterado_em
        FROM painel_dsr.tb_contato_recebedor c
        LEFT JOIN painel_dsr.tb_usuario u ON u.id_usuario = c.id_usuario
        WHERE c.id_recebedor = :id_recebedor
        ORDER BY c.nr_contato ASC
    """)

    result = await db.execute(sql, {"id_recebedor": id_recebedor})


    
    return ContatoBusca(
      data=[ContatoBuscaItem(**r) for r in result.mappings().all()]
    )




@router.get(
    "/busca_historico_acao/{nr_instrumento}",
    response_model=PlanoAcaoHistorico,
    summary="Busca o histórico completo de Planos de Ação de um Instrumento",
)
async def get_historico_acao_instrumento(
    nr_instrumento: str,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Desativa cache para garantir a entrega imediata de registros recém-salvos
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

    sql = """
        SELECT
            p.id_acao,
            p.nr_instrumento,
            u.nome AS usuario,
            p.ponto_controle,
            p.status_ponto_controle,
            p.confirmacao,
            p.coordenacao,
            p.mandataria,
            p.recebedor,
            p.descricao_acao,
            p.prazo_pactuado,
            p.criado_em
        FROM painel_dsr.tb_ponto_controle_acao p
        LEFT JOIN painel_dsr.tb_usuario u ON u.id_usuario = p.id_usuario
        WHERE p.nr_instrumento = :nr_instrumento
        ORDER BY p.id_acao DESC
    """

    result = await _execute_query(db, sql, {"nr_instrumento": nr_instrumento})

    return PlanoAcaoHistorico(
        data=[
            PlanoAcaoHistoricoItem(**r) for r in result.mappings().all()
        ]
    )



@router.get(
    "/busca_contato_mandataria",
    response_model=ContatoMandatariaBusca,
    summary=("Busca os contatos da mandatária")
)
async def get_contato_mandataria(
    cod_uf: int = Query(..., description="Código da UF da mandatária para filtrar"),
    response: Response = None,
    db: AsyncSession = Depends(get_db)
):
    
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    
    sql = text( """
        SELECT
            c.cod_uf,
            u.nome as usuario,
            c.nome,
            c.cargo,
            c.tipo_setor,
            c.setor,
            c.telefone,
            c.email,
            c.observacao,
            c.alterado_em
        FROM painel_dsr.tb_contato_mandataria c
        LEFT JOIN painel_dsr.tb_usuario u ON u.id_usuario = c.id_usuario
        WHERE c.cod_uf = :cod_uf
        ORDER BY c.id_contato ASC
    """)

    result = await db.execute(sql, {"cod_uf": cod_uf})


    
    return ContatoMandatariaBusca(
      data=[ContatoMandatariaBuscaItem(**r) for r in result.mappings().all()]
    )
