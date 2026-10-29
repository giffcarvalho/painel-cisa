"""Consultas administrativas somente leitura para a preparação de distribuição.

Não valida nem executa operações. Usa a fonte operacional de vínculos e as
relações territoriais oficiais, sem inferir municípios a partir de nomes.
"""

from sqlalchemy import text

from app.schemas.distribuicao_instrumentos import ConsultaDistribuicao, FiltrosDistribuicao


CAMPOS = {
    "nr_instrumento": "Número do instrumento",
    "nr_proposta": "Número da proposta",
    "tipo_instrumento": "Tipo de instrumento",
    "situacao_atual": "Situação atual",
    "carteira_ativa": "Carteira ativa",
    "novo_pac": "Novo PAC",
    "ano_proposta": "Ano da proposta",
    "operacao": "Operação",
    "nome_proponente": "Proponente",
}

# A view é a fonte principal. TEDs ausentes nela são incluídos pela tabela oficial.
# O namespace evita confundir um TED com um instrumento de mesmo número.
# Alias é a chave textual efetivamente usada na tabela operacional, não um ID novo.
BASE = r"""
WITH fontes AS (
    SELECT to_jsonb(v) AS dados, 0 AS origem,
           CASE WHEN lower(v.tipo_instrumento) LIKE '%ted%'
                     OR (lower(v.tipo_instrumento) LIKE '%execu%' AND lower(v.tipo_instrumento) LIKE '%descentralizada%')
                THEN 'ted:' || COALESCE(NULLIF(ltrim(regexp_replace(v.nr_instrumento::text, '\D', '', 'g'), '0'), ''), v.nr_instrumento::text)
                WHEN NULLIF(btrim(v.nr_instrumento::text), '') IS NOT NULL
                THEN 'instrumento:' || btrim(v.nr_instrumento::text)
                ELSE 'proposta:' || v.nr_proposta::text END AS chave,
           btrim(v.nr_instrumento::text) AS alias
    FROM instrumento.vw_carteira_dsr v
    UNION ALL
    SELECT to_jsonb(t) || jsonb_build_object('tipo_instrumento', 'TED',
             'nr_instrumento', t.nr_ted::text), 1, 'ted:' || t.nr_ted::text, t.nr_ted::text
    FROM instrumento.tb_ted t
), aliases AS (
    SELECT chave, array_agg(DISTINCT alias) FILTER (WHERE alias IS NOT NULL) AS numeros
    FROM fontes WHERE chave IS NOT NULL GROUP BY chave
), universo AS (
    SELECT DISTINCT ON (f.chave) f.chave, f.dados,
           split_part(f.chave, ':', 2) AS numero, a.numeros,
           EXISTS (SELECT 1 FROM aliases outro WHERE outro.chave <> f.chave
                   AND outro.numeros && a.numeros) AS identidade_ambigua
    FROM fontes f JOIN aliases a USING (chave)
    ORDER BY f.chave, f.origem, f.dados::text
), territorios AS (
    SELECT 'ted:' || nr_ted::text AS chave, cod_municipio
    FROM instrumento.tb_ted_municipio
    UNION
    SELECT u.chave, m.cod_municipio FROM universo u
    JOIN instrumento.tb_contrato_repasse_municipio m
      ON m.nr_proposta::text = u.dados->>'nr_proposta'
    WHERE u.chave NOT LIKE 'ted:%'
      AND (lower(u.dados->>'tipo_instrumento') LIKE '%contrato%'
           OR lower(u.dados->>'tipo_instrumento') LIKE '%repasse%')
    UNION
    SELECT u.chave, m.cod_municipio FROM universo u
    JOIN instrumento.tb_termo_de_compromisso_municipio m
      ON m.nr_proposta::text = u.dados->>'nr_proposta'
    WHERE u.chave NOT LIKE 'ted:%'
      AND (lower(u.dados->>'tipo_instrumento') LIKE '%termo%'
           OR lower(u.dados->>'tipo_instrumento') LIKE '%compromisso%')
)
"""


def montar_filtro(filtros: FiltrosDistribuicao, params: dict, prefixo: str) -> str:
    """Listas são OR; categorias AND; responsabilidade num único EXISTS."""
    partes = []

    def conjunto(coluna, campo, valores, tipo="text"):
        chave = f"{prefixo}_{campo}"
        params[chave] = valores
        return f"{coluna} = ANY(CAST(:{chave} AS {tipo}[]))"

    for campo in CAMPOS:
        valores = getattr(filtros, campo)
        if valores:
            coluna = "u.numero" if campo == "nr_instrumento" else f"u.dados->>'{campo}'"
            condicao = conjunto(coluna, campo, valores)
            if campo == "nr_instrumento":
                condicao = (
                    f"({condicao} OR u.dados->>'nr_instrumento' = "
                    f"ANY(CAST(:{prefixo}_{campo} AS text[])))"
                )
            partes.append(condicao)

    territorial = []
    if filtros.ufs:
        territorial.append(conjunto("m.cod_uf", "ufs", filtros.ufs, "integer"))
    if filtros.municipios:
        territorial.append(
            conjunto("t.cod_municipio", "municipios", filtros.municipios, "integer")
        )
    if territorial:
        # UF inteira OU municípios específicos, inclusive de outras UFs.
        partes.append(
            "EXISTS (SELECT 1 FROM territorios t JOIN territorio.tb_municipio m "
            "ON m.cod_municipio = t.cod_municipio WHERE t.chave = u.chave AND ("
            + " OR ".join(territorial)
            + "))"
        )

    vinculo = []
    for campo, coluna, valores in (
        ("monitores", "i.id_usuario", filtros.monitores),
        ("setores", "p.id_setor", filtros.setores),
        ("posicoes", "i.ordem_prioridade", filtros.posicoes),
    ):
        if valores:
            vinculo.append(conjunto(coluna, campo, valores, "integer"))
    origem = (
        "SELECT 1 FROM painel_dsr.tb_usuario_instrumento_monitoramento i "
        "LEFT JOIN painel_dsr.tb_usuario p ON p.id_usuario = i.id_usuario "
        "WHERE i.nr_instrumento = ANY(u.numeros) AND i.ativo IS TRUE"
    )
    if vinculo:
        partes.append("EXISTS (" + origem + " AND " + " AND ".join(vinculo) + ")")
    if filtros.sem_monitor:
        partes.append("NOT EXISTS (" + origem + ")")
    return " AND ".join(partes) or "TRUE"


def montar_selecao(selecao, params):
    consulta = (
        montar_filtro(selecao.filtros, params, "s")
        if selecao.filtros is not None
        else "FALSE"
    )
    params.update(incluidos=selecao.incluidos, excluidos=selecao.excluidos)
    return (
        f"(({consulta}) OR u.chave = ANY(CAST(:incluidos AS text[]))) "
        "AND NOT (u.chave = ANY(CAST(:excluidos AS text[])))"
    )


def diagnosticar(item):
    """Sinaliza o estado lido; não constitui prévia definitiva de alterações."""
    monitores = item["monitores"]
    ordens = [m["ordem_prioridade"] for m in monitores]
    alertas = []
    if item.get("chave", "").startswith("proposta:"):
        alertas.append("Instrumento sem número operacional; apenas proposta identificada.")
    if item.pop("identidade_ambigua"):
        alertas.append("Identidade operacional ambígua entre instrumentos/TEDs.")
    if len(monitores) > 3:
        alertas.append("Mais de três monitores ativos.")
    if any(p not in (1, 2, 3) for p in ordens) or len(set(ordens)) != len(ordens):
        alertas.append("Prioridades repetidas ou inválidas.")
    if any(p in (2, 3) for p in ordens) and 1 not in ordens:
        alertas.append("Reservas ativos sem principal.")
    if ordens and sorted(p for p in ordens if p is not None) != list(
        range(1, len(ordens) + 1)
    ):
        alertas.append("Prioridades não sequenciais.")
    if len({m["id_usuario"] for m in monitores}) != len(monitores):
        alertas.append("Monitor com vínculos ativos duplicados entre aliases.")
    if any(m.get("cadastro_encontrado") is False for m in monitores):
        alertas.append(
            "Vínculo ativo com cadastro de usuário inexistente; "
            "corrija a integridade antes de redistribuir."
        )
    if any(
        m.get("cadastro_encontrado") is not False
        and str(m.get("perfil") or "").strip().lower() != "tecnico"
        for m in monitores
    ):
        alertas.append(
            "Vínculo atual com perfil incompatível; "
            "a distribuição final deve conter somente técnicos."
        )
    if any(m.get("ativo") is False for m in monitores):
        alertas.append(
            "Usuário atual com cadastro desativado "
            "(aviso administrativo; não impede a redistribuição)."
        )
    if item["rascunhos"]:
        alertas.append("Possíveis rascunhos de revisão em andamento.")
    item["alertas"] = alertas
    return item


async def consultar(db, payload: ConsultaDistribuicao):
    params = {"limit": payload.limit, "offset": payload.offset}
    filtro = montar_filtro(payload.filtros, params, "f")
    selecao = montar_selecao(payload.selecao, params)
    resultado = await db.execute(
        text(
            BASE + f"""
    , marcados AS (
        SELECT u.*, ({filtro}) AS no_filtro, ({selecao}) AS selecionado FROM universo u
    ), pagina AS (
        SELECT * FROM marcados WHERE {'selecionado' if payload.somente_selecao else 'no_filtro'}
        ORDER BY chave LIMIT :limit OFFSET :offset
    ), itens AS (
        SELECT u.chave, u.numero, u.dados->>'nr_proposta' AS nr_proposta,
               u.dados->>'tipo_instrumento' AS tipo_instrumento,
               COALESCE((SELECT jsonb_agg(jsonb_build_object(
                   'cod_municipio', local.cod_municipio, 'municipio', local.nome_municipio,
                   'uf', btrim(local.sigla_uf)) ORDER BY local.sigla_uf, local.nome_municipio)
                   FROM (SELECT DISTINCT m.cod_municipio, m.nome_municipio, uf.sigla_uf
                         FROM territorios t JOIN territorio.tb_municipio m USING (cod_municipio)
                         JOIN territorio.tb_uf uf USING (cod_uf)
                         WHERE t.chave = u.chave) local), '[]'::jsonb) AS territorios,
               jsonb_build_object('situacao_atual', u.dados->>'situacao_atual',
                   'nome_proponente', COALESCE(u.dados->>'nome_proponente',
                       u.dados->>'nome_tomador', u.dados->>'tomador')) AS atributos,
               u.selecionado, u.identidade_ambigua,
               COALESCE(mon.lista, '[]'::jsonb) AS monitores,
               (SELECT count(*) FROM painel_dsr.tb_revisao_instrumento r
                WHERE r.status = 'rascunho' AND (
                  (u.chave LIKE 'ted:%' AND r.tipo_instrumento = 'ted' AND r.nr_ted::text = u.numero)
                  OR (u.chave NOT LIKE 'ted:%' AND r.tipo_instrumento <> 'ted'
                      AND (r.nr_instrumento = ANY(u.numeros)
                           OR r.identificador_busca = ANY(u.numeros))))) AS rascunhos
        FROM pagina u LEFT JOIN LATERAL (
            SELECT jsonb_agg(jsonb_build_object('id_usuario', i.id_usuario,
                   'nome', COALESCE(p.nome, 'Usuário não encontrado (#' || i.id_usuario::text || ')'),
                   'ativo', p.ativo, 'perfil', p.perfil, 'conta_ativada', p.conta_ativada,
                   'cadastro_encontrado', p.id_usuario IS NOT NULL,
                   'id_setor', p.id_setor, 'ordem_prioridade', i.ordem_prioridade)
                   ORDER BY i.ordem_prioridade NULLS LAST, i.id_usuario) AS lista
            FROM painel_dsr.tb_usuario_instrumento_monitoramento i
            LEFT JOIN painel_dsr.tb_usuario p ON p.id_usuario = i.id_usuario
            WHERE i.nr_instrumento = ANY(u.numeros) AND i.ativo IS TRUE
        ) mon ON TRUE
    )
    SELECT (SELECT count(*) FROM marcados WHERE {'selecionado' if payload.somente_selecao else 'no_filtro'}) AS total,
           count(*) FILTER (WHERE no_filtro) AS total_no_filtro,
           count(*) FILTER (WHERE selecionado) AS selecionados,
           count(*) FILTER (WHERE selecionado AND no_filtro) AS selecionados_no_filtro,
           COALESCE((SELECT jsonb_agg(to_jsonb(itens) ORDER BY chave) FROM itens), '[]'::jsonb) AS items
    FROM marcados
    """
        ),
        params,
    )
    dados = dict(resultado.mappings().one())
    dados["items"] = [diagnosticar(item) for item in dados["items"]]
    return {**dados, "limit": payload.limit, "offset": payload.offset}


async def catalogo(db):
    # Somente domínios pequenos; números/proponentes são pesquisados sob demanda.
    campos = [
        c for c in CAMPOS
        if c not in ("nr_instrumento", "nr_proposta", "nome_proponente")
    ]
    resultado = await db.execute(
        text(
            BASE + " SELECT " + ", ".join(
                f"array_agg(DISTINCT dados->>'{c}') "
                f"FILTER (WHERE NULLIF(dados->>'{c}', '') IS NOT NULL) AS {c}"
                for c in campos
            ) + " FROM universo"
        )
    )
    dominios = dict(resultado.mappings().one())
    ufs = (
        await db.execute(
            text(
                "SELECT cod_uf, btrim(sigla_uf) AS sigla, nome_uf AS nome "
                "FROM territorio.tb_uf ORDER BY sigla_uf"
            )
        )
    ).mappings().all()
    monitores = (
        await db.execute(
            text("""
        SELECT p.id_usuario, p.nome, p.ativo, p.perfil, p.conta_ativada, p.id_setor, s.nome AS setor
        FROM painel_dsr.tb_usuario p LEFT JOIN instrumento.tb_tecnico_setor s USING (id_setor)
        WHERE lower(btrim(p.perfil)) = 'tecnico' OR EXISTS (
          SELECT 1 FROM painel_dsr.tb_usuario_instrumento_monitoramento i
          WHERE i.id_usuario = p.id_usuario AND i.ativo IS TRUE)
        ORDER BY p.nome, p.id_usuario
    """)
        )
    ).mappings().all()
    return {
        "campos": [
            {
                "campo": c,
                "label": label,
                "opcoes": sorted(dominios.get(c) or []),
                "busca": c not in campos,
            }
            for c, label in CAMPOS.items()
        ],
        "ufs": [dict(r) for r in ufs],
        "monitores": [dict(r) for r in monitores],
    }


async def municipios(db, cod_uf):
    rows = await db.execute(
        text("""SELECT cod_municipio AS value, nome_municipio AS label
        FROM territorio.tb_municipio WHERE cod_uf = :uf ORDER BY nome_municipio"""),
        {"uf": cod_uf},
    )
    return [dict(r) for r in rows.mappings().all()]


async def opcoes(db, campo, termo):
    # Whitelist fechada: o cliente nunca fornece nomes de colunas livres.
    if campo not in CAMPOS:
        from fastapi import HTTPException

        raise HTTPException(422, "Campo de filtro indisponível.")
    rows = await db.execute(
        text(BASE + f"""
        SELECT DISTINCT dados->>'{campo}' AS value FROM universo
        WHERE dados->>'{campo}' ILIKE :termo ORDER BY value LIMIT 50
    """),
        {"termo": f"%{termo.strip()}%"},
    )
    return [{"value": r["value"], "label": r["value"]} for r in rows.mappings().all()]


# UF e município compõem a mesma categoria (união territorial).
CATEGORIAS_OPCOES = {
    **{c: (c,) for c in CAMPOS},
    "ufs": ("ufs", "municipios"),
    "municipios": ("ufs", "municipios"),
    **{c: (c,) for c in ("setores", "monitores", "posicoes", "sem_monitor")},
}


def montar_consulta_opcoes(filtros: FiltrosDistribuicao):
    """Facetas disjuntivas em uma execução, sem paginação ou seleção da tabela.

    Cada contagem retira apenas a própria categoria. As facetas de vínculo
    restringem também a linha agregada, para não contar outro monitor/posição
    do mesmo instrumento. DISTINCT evita duplicações por municípios e aliases.
    """
    params, contextos, contagens, consultas = {}, [], [], []
    origem_vinculos = (
        "JOIN painel_dsr.tb_usuario_instrumento_monitoramento i "
        "ON i.nr_instrumento = ANY(u.numeros) AND i.ativo IS TRUE "
        "LEFT JOIN painel_dsr.tb_usuario p ON p.id_usuario = i.id_usuario"
    )
    for categoria, ignorados in CATEGORIAS_OPCOES.items():
        outros = filtros.model_copy(
            update={c: False if c == "sem_monitor" else [] for c in ignorados}
        )
        condicao = montar_filtro(outros, params, categoria)
        contextos.append(f"({condicao}) AS f_{categoria}")
        selecionados = (
            ([True] if filtros.sem_monitor else [])
            if categoria == "sem_monitor"
            else getattr(filtros, categoria)
        )
        params[f"selecionados_{categoria}"] = selecionados
        vinculos = []
        for campo, coluna in (
            ("setores", "p.id_setor"),
            ("monitores", "i.id_usuario"),
            ("posicoes", "i.ordem_prioridade"),
        ):
            if campo != categoria and getattr(outros, campo):
                vinculos.append(f"{coluna} = ANY(CAST(:{categoria}_{campo} AS integer[]))")
        extra = (
            " AND " + " AND ".join(vinculos)
            if vinculos and categoria in ("setores", "monitores", "posicoes")
            else ""
        )
        if categoria in CAMPOS:
            coluna = "n.numero" if categoria == "nr_instrumento" else f"u.dados->>'{categoria}'"
            # A consulta aceita tanto o número canônico quanto o textual da
            # fonte (por exemplo, TED com zeros). Ambos precisam contar igual.
            fonte = (
                "CROSS JOIN LATERAL (SELECT u.numero UNION "
                "SELECT u.dados->>'nr_instrumento') n(numero)"
                if categoria == "nr_instrumento"
                else ""
            )
            dominio = (
                f"SELECT valor AS value, valor AS label, '{{}}'::jsonb AS meta "
                f"FROM (SELECT unnest(CAST(:selecionados_{categoria} AS text[])) "
                f"AS valor UNION SELECT value FROM c_{categoria}) d"
            )
            tipo = "text"
        elif categoria in ("ufs", "municipios"):
            coluna = "m.cod_uf" if categoria == "ufs" else "m.cod_municipio"
            fonte = (
                "JOIN territorios t ON t.chave = u.chave "
                "JOIN territorio.tb_municipio m USING (cod_municipio)"
            )
            tipo = "integer"
            if categoria == "ufs":
                dominio = f"""SELECT d.id AS value, COALESCE(btrim(uf.sigla_uf), d.id::text) AS label,
                    jsonb_build_object('sigla', btrim(uf.sigla_uf), 'nome', uf.nome_uf) AS meta
                    FROM (SELECT value AS id FROM c_ufs UNION SELECT unnest(CAST(:selecionados_ufs AS integer[]))) d
                    LEFT JOIN territorio.tb_uf uf ON uf.cod_uf = d.id"""
            else:
                dominio = """SELECT d.id AS value, COALESCE(m.nome_municipio, d.id::text) AS label,
                    jsonb_build_object('cod_uf', m.cod_uf, 'sigla', btrim(uf.sigla_uf)) AS meta
                    FROM (SELECT value AS id FROM c_municipios UNION SELECT unnest(CAST(:selecionados_municipios AS integer[]))) d
                    LEFT JOIN territorio.tb_municipio m ON m.cod_municipio = d.id
                    LEFT JOIN territorio.tb_uf uf ON uf.cod_uf = m.cod_uf"""
        elif categoria in ("setores", "monitores", "posicoes"):
            coluna = {
                "setores": "p.id_setor",
                "monitores": "i.id_usuario",
                "posicoes": "i.ordem_prioridade",
            }[categoria]
            fonte, tipo = origem_vinculos, "integer"
            ids = (
                f"(SELECT value AS id FROM c_{categoria} "
                f"UNION SELECT unnest(CAST(:selecionados_{categoria} AS integer[]))) d"
            )
            if categoria == "setores":
                dominio = (
                    f"SELECT d.id AS value, COALESCE(s.nome, d.id::text) AS label, "
                    f"'{{}}'::jsonb AS meta FROM {ids} "
                    f"LEFT JOIN instrumento.tb_tecnico_setor s ON s.id_setor = d.id"
                )
            elif categoria == "monitores":
                dominio = f"""SELECT d.id AS value, COALESCE(p.nome, d.id::text) AS label,
                    jsonb_build_object('id_setor', p.id_setor, 'setor', s.nome, 'ativo', p.ativo) AS meta
                    FROM {ids} LEFT JOIN painel_dsr.tb_usuario p ON p.id_usuario = d.id
                    LEFT JOIN instrumento.tb_tecnico_setor s ON s.id_setor = p.id_setor"""
            else:
                dominio = f"""SELECT d.id AS value, CASE d.id WHEN 1 THEN 'Principal' WHEN 2 THEN 'Reserva 1' ELSE 'Reserva 2' END AS label,
                    '{{}}'::jsonb AS meta FROM {ids} WHERE d.id IN (1, 2, 3)"""
        else:
            coluna, fonte, tipo = "TRUE", "", "boolean"
            extra = (
                " AND NOT EXISTS (SELECT 1 FROM painel_dsr.tb_usuario_instrumento_monitoramento i "
                "LEFT JOIN painel_dsr.tb_usuario p ON p.id_usuario = i.id_usuario "
                "WHERE i.nr_instrumento = ANY(u.numeros) AND i.ativo IS TRUE)"
            )
            dominio = "SELECT TRUE AS value, 'Sem monitor ativo' AS label, '{}'::jsonb AS meta"
        contagens.append(
            f"""c_{categoria} AS (
            SELECT {coluna} AS value, count(DISTINCT u.chave) AS total
            FROM contextos u {fonte} WHERE u.f_{categoria}{extra}
            GROUP BY 1)"""
        )
        consultas.append(
            f"""SELECT '{categoria}' AS categoria,
            d.meta || jsonb_build_object('value', d.value, 'label', d.label,
                'total', COALESCE(c.total, 0)) AS opcao
            FROM ({dominio}) d LEFT JOIN c_{categoria} c USING (value)
            WHERE d.value IS NOT NULL AND d.value::text <> '' AND
                (c.total > 0 OR d.value = ANY(CAST(:selecionados_{categoria} AS {tipo}[])))"""
        )
    sql = (
        BASE + ", contextos AS MATERIALIZED (SELECT u.*, " + ", ".join(contextos)
        + " FROM universo u), " + ", ".join(contagens) + " " + " UNION ALL ".join(consultas)
    )
    return sql, params


async def opcoes_contextuais(db, filtros: FiltrosDistribuicao):
    sql, params = montar_consulta_opcoes(filtros)
    resultado = await db.execute(text(sql), params)
    opcoes = {c: [] for c in CATEGORIAS_OPCOES}
    for linha in resultado.mappings().all():
        opcoes[linha["categoria"]].append(linha["opcao"])
    for lista in opcoes.values():
        lista.sort(key=lambda o: (str(o["label"]).casefold(), str(o["value"])))
    return opcoes
