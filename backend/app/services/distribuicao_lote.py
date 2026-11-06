"""Prévia verificável e substituição atômica dos vínculos, sem histórico permanente.

xmin participa somente da assinatura efêmera (15 minutos), como na gestão
individual. Nenhum token, execução ou dado de auditoria é gravado no banco.
"""

import hashlib
import hmac
import json
from collections import defaultdict
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.core.autorizacao import exigir_admin
from app.core.config import settings
from app.core.seguranca import criar_token_acesso, decodificar_token_acesso
from app.services.distribuicao_instrumentos import BASE

TABELA = "painel_dsr.tb_usuario_instrumento_monitoramento"
CONSTRAINT = "painel_dsr.uq_instrumento_prioridade_ativa_diferivel"
CONCORRENCIA = (
    "Os dados foram alterados ou estão sendo utilizados por outra operação. "
    "Atualize os dados e faça uma nova conferência. Nenhuma alteração deste lote foi aplicada."
)
CONTAGENS = ("preservar", "criar", "reativar", "alterar_prioridade", "desativar")


def exigir_habilitada():
    if not settings.DISTRIBUICAO_INSTRUMENTOS_HABILITADA:
        raise HTTPException(403, "Distribuição de Instrumentos aguarda liberação administrativa.")


def _hash(valor):
    return hashlib.sha256(json.dumps(valor, sort_keys=True, ensure_ascii=False,
                                     separators=(",", ":")).encode()).hexdigest()


def _chave_assinatura():
    # Domínio separado: uma prévia nunca pode ser usada como token de login.
    return hmac.new(settings.jwt_secret_key.encode(), b"distribuicao-instrumentos:v1",
                    hashlib.sha256).hexdigest()


def _pedido(payload):
    return {"instrumentos": sorted(payload.instrumentos),
            "distribuicao": payload.distribuicao.model_dump()}


def _estado(instrumentos, vinculos, usuarios):
    return _hash({
        "instrumentos": sorted([
            {k: v for k, v in i.items() if k != "rascunhos"} for i in instrumentos
        ], key=lambda i: i["chave"]),
        "vinculos": sorted([
            {k: v for k, v in vinculo.items() if k != "conta_ativada"}
            for vinculo in vinculos
        ], key=lambda v: v["id_usuario_instrumento"]),
        # Conta aguardando ativação não invalida um destino técnico.
        "destinos": sorted([
            {k: u[k] for k in ("id_usuario", "nome", "perfil", "ativo")}
            for u in usuarios
        ], key=lambda u: u["id_usuario"]),
    })


def _tecnico(usuario):
    return (usuario is not None
            and str(usuario.get("perfil") or "").strip().lower() == "tecnico"
            and type(usuario.get("ativo")) is bool)


def _monitor(vinculo):
    return {"id_usuario": vinculo["id_usuario"],
            "nome": vinculo.get("nome") or f"Usuário #{vinculo['id_usuario']}",
            "perfil": vinculo.get("perfil"), "ativo": vinculo.get("usuario_ativo"),
            "conta_ativada": vinculo.get("conta_ativada"),
            "cadastro_encontrado": vinculo.get("cadastro_encontrado", True),
            "ordem_prioridade": vinculo["ordem_prioridade"]}


def _tipo_valido(instrumento):
    tipo = str(instrumento.get("tipo_instrumento") or "").strip().lower()
    ted = "ted" in tipo or ("execu" in tipo and "descentralizada" in tipo)
    if instrumento["chave"].startswith("ted:"):
        numero = instrumento.get("numero", "")
        return (ted and numero.isascii() and numero.isdigit() and int(numero) > 0
                and str(int(numero)) == numero and instrumento.get("ted_existe", False))
    return (instrumento["chave"].startswith("instrumento:") and not ted
            and any(p in tipo for p in ("contrato", "repasse", "compromisso")))


def definir_plano(instrumentos, vinculos, usuarios, distribuicao, erros_estrutura=()):
    """Calcula o estado final e ações sem acesso ao banco nem mutação das entradas."""
    destino = {p: u for p, u in enumerate(
        (distribuicao.principal, distribuicao.reserva_1, distribuicao.reserva_2), 1
    ) if u is not None}
    por_usuario = {u["id_usuario"]: u for u in usuarios}
    erros = list(erros_estrutura)
    for uid in destino.values():
        if uid not in por_usuario:
            erros.append(f"Monitor de destino #{uid} não encontrado.")
        elif not _tecnico(por_usuario[uid]):
            erros.append(f"Monitor de destino #{uid} possui perfil incompatível ou cadastro inconsistente.")
    por_numero = defaultdict(list)
    for vinculo in vinculos:
        por_numero[vinculo["nr_instrumento"]].append(vinculo)
    linhas, acoes = [], []
    contagens = dict.fromkeys(CONTAGENS, 0)
    for instrumento in instrumentos:
        problemas = list(erros)
        if instrumento.get("encontrado", True) is False:
            problemas.append("Instrumento não encontrado. Atualize a seleção.")
        if not _tipo_valido(instrumento):
            problemas.append("Tipo ou referência operacional indisponível para redistribuição; TED exige cadastro oficial.")
        numeros = instrumento.get("numeros") or []
        if (instrumento.get("identidade_ambigua") or not numeros
                or any(not n or len(n) > 50 for n in numeros)):
            problemas.append("Identidade operacional ambígua ou inválida. Corrija a referência antes de redistribuir.")
        rows = [v for n in numeros for v in por_numero[n]]
        if len({v["id_usuario"] for v in rows}) != len(rows):
            problemas.append("Vínculos duplicados entre referências do instrumento; corrija a integridade.")
        if any(not v.get("cadastro_encontrado", True) for v in rows):
            problemas.append("Vínculo com usuário inexistente; corrija a integridade antes de redistribuir.")
        ativos = sorted([v for v in rows if v["ativo"]],
                        key=lambda v: (v["ordem_prioridade"] or 99, v["id_usuario"]))
        atual = [_monitor(v) for v in ativos]
        proposta, avisos, resolvidas, alteracoes, locais = [], [], [], [], []
        if instrumento.get("rascunhos"):
            avisos.append(f"{instrumento['rascunhos']} rascunho(s) de revisão em andamento. Confira os responsáveis.")
        if not problemas:
            por_id = {v["id_usuario"]: v for v in rows}
            for prioridade, uid in destino.items():
                usuario = por_usuario[uid]
                proposta.append({**usuario, "ordem_prioridade": prioridade,
                                 "cadastro_encontrado": True})
                if not usuario["ativo"]:
                    avisos.append(f"Cadastro desativado: {usuario['nome']}. O cadastro permanecerá desativado.")
                anterior = por_id.get(uid)
                if anterior is None:
                    acao = "criar"
                elif not anterior["ativo"]:
                    acao = "reativar"
                elif anterior["ordem_prioridade"] != prioridade:
                    acao = "alterar_prioridade"
                else:
                    acao = "preservar"
                locais.append({"acao": acao, "id_usuario": uid,
                    "id_usuario_instrumento": anterior["id_usuario_instrumento"] if anterior else None,
                    "nr_instrumento": anterior["nr_instrumento"] if anterior else instrumento["numero"],
                    "ordem_prioridade": prioridade})
            for vinculo in ativos:
                if vinculo["id_usuario"] not in destino.values():
                    locais.append({"acao": "desativar", **{
                        k: vinculo[k] for k in ("id_usuario_instrumento", "id_usuario",
                                                "nr_instrumento", "ordem_prioridade")}})
            ordens = [v["ordem_prioridade"] for v in ativos]
            if (len(ativos) > 3 or sorted(p for p in ordens if p is not None)
                    != list(range(1, len(ativos) + 1))):
                resolvidas.append("As prioridades atuais serão corrigidas pela distribuição final.")
            if any(str(v.get("perfil") or "").strip().lower() != "tecnico" for v in ativos):
                resolvidas.append("Vínculos atuais com perfil incompatível serão desativados.")
            for p in (1, 2, 3):
                antes = next((m for m in atual if m["ordem_prioridade"] == p), None)
                depois = next((m for m in proposta if m["ordem_prioridade"] == p), None)
                if (antes or {}).get("id_usuario") != (depois or {}).get("id_usuario"):
                    alteracoes.append({"posicao": p, "atual": antes, "proposto": depois,
                        "situacao": "Substituição" if antes and depois else "Inclusão" if depois else "Remoção",
                        "detalhes": f"{(antes or {}).get('nome', 'Sem monitor')} → {(depois or {}).get('nome', 'Sem monitor')}"})
            for acao in locais:
                contagens[acao["acao"]] += 1
            acoes.extend(locais)
        mudou = any(a["acao"] != "preservar" for a in locais)
        linhas.append({**instrumento, "atual": atual, "proposta": proposta,
            "monitores": atual, "problemas": list(dict.fromkeys(problemas)), "avisos": avisos,
            "alertas": [], "rascunhos": instrumento.get("rascunhos", 0), "inconsistenciasResolvidas": resolvidas,
            "alteracoes": alteracoes,
            "status": "com impedimento" if problemas else "com alteração" if mudou else "sem alteração"})
    return {"linhas": linhas, "total": len(linhas),
            "alterados": sum(l["status"] == "com alteração" for l in linhas),
            "semMudancas": sum(l["status"] == "sem alteração" for l in linhas),
            "impedidos": sum(l["status"] == "com impedimento" for l in linhas),
            "comAvisos": sum(bool(l["avisos"]) for l in linhas),
            "erros": list(dict.fromkeys(erros)), "avisos": [],
            "contagens": contagens, "_acoes": acoes}


async def _validar_estrutura(db):
    """Inspeciona definições instaladas; não cria nem migra estruturas."""
    def normalizar_definicao(valor):
        # pg_get_constraintdef acrescenta parênteses conforme a versão do PG.
        return "".join(str(valor or "").lower().split()).replace("(", "").replace(")", "")

    constraints = (await db.execute(text("""
        SELECT c.conname, c.contype::text AS tipo, c.condeferrable, c.convalidated,
               pg_get_constraintdef(c.oid) AS definicao,
               ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(num, ordem)
                     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.num
                     ORDER BY k.ordem) AS colunas,
               c.confrelid = to_regclass('painel_dsr.tb_usuario') AS referencia_usuario,
               ARRAY(SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY k(num, ordem)
                     JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.num
                     ORDER BY k.ordem) AS colunas_referenciadas
        FROM pg_constraint c
        WHERE c.conrelid = to_regclass('painel_dsr.tb_usuario_instrumento_monitoramento')
    """))).mappings().all()
    por_nome = {c["conname"]: c for c in constraints}
    esperadas = {
        "uq_usuario_instrumento": ("u", ["id_usuario", "nr_instrumento"]),
        "uq_instrumento_prioridade_ativa_diferivel": ("u", ["nr_instrumento", "prioridade_ativa"]),
        "chk_usuario_instrumento_ordem_prioridade": ("c", ["ordem_prioridade"]),
        "chk_usuario_instrumento_ativo_com_prioridade": ("c", ["ativo", "ordem_prioridade"]),
        "fk_usuario_instrumento_usuario": ("f", ["id_usuario"]),
    }
    for nome, (tipo, colunas) in esperadas.items():
        c = por_nome.get(nome)
        if (not c or c["tipo"] != tipo or not c["convalidated"]
                or set(c["colunas"]) != set(colunas)
                or (tipo == "u" and c["colunas"] != colunas)):
            return ["Estrutura de vínculos incompatível. Solicite verificação das constraints à equipe responsável."]
    primarias = [c for c in constraints if c["tipo"] == "p"]
    if (len(primarias) != 1 or not primarias[0]["convalidated"]
            or primarias[0]["colunas"] != ["id_usuario_instrumento"]):
        return ["Chave primária de vínculos incompatível com a redistribuição."]
    checks = {
        "chk_usuario_instrumento_ordem_prioridade":
            "checkordem_prioridadeisnullorordem_prioridade=anyarray[1,2,3]",
        "chk_usuario_instrumento_ativo_com_prioridade":
            "checkativo=falseorordem_prioridadeisnotnull",
    }
    if any(normalizar_definicao(por_nome[nome]["definicao"]) != definicao
           for nome, definicao in checks.items()):
        return ["Regras de prioridade instaladas são incompatíveis com a redistribuição."]
    if (not por_nome["uq_instrumento_prioridade_ativa_diferivel"]["condeferrable"]
            or por_nome["uq_usuario_instrumento"]["condeferrable"]
            or not por_nome["fk_usuario_instrumento_usuario"]["referencia_usuario"]
            or por_nome["fk_usuario_instrumento_usuario"]["colunas_referenciadas"] != ["id_usuario"]):
        return ["Constraints de vínculos incompatíveis com a redistribuição transacional."]
    colunas = (await db.execute(text("""
        SELECT a.attname::text AS nome, a.attgenerated::text AS gerada, a.attnotnull,
               format_type(a.atttypid, a.atttypmod) AS tipo,
               a.attidentity::text AS identidade,
               pg_get_expr(d.adbin, d.adrelid) AS expressao
        FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE a.attrelid = to_regclass('painel_dsr.tb_usuario_instrumento_monitoramento')
          AND a.attnum > 0 AND NOT a.attisdropped
    """))).mappings().all()
    por_coluna = {c["nome"]: c for c in colunas}
    tipos = {
        "id_usuario_instrumento": "bigint", "id_usuario": "integer",
        "nr_instrumento": "character varying(50)", "ativo": "boolean",
        "ordem_prioridade": "integer", "prioridade_ativa": "integer",
    }
    if any(por_coluna.get(nome, {}).get("tipo") != tipo for nome, tipo in tipos.items()):
        return ["Tipos das colunas de vínculos incompatíveis com a redistribuição."]
    identificador = por_coluna["id_usuario_instrumento"]
    if (identificador["identidade"] not in ("a", "d")
            and not str(identificador["expressao"] or "").startswith("nextval(")):
        return ["Geração do identificador de vínculo indisponível; solicite verificação da estrutura."]
    gerada = por_coluna.get("prioridade_ativa", {})
    expressao = "".join(str(gerada.get("expressao") or "").lower().split())
    if (gerada.get("gerada") != "s"
            or expressao.replace("(", "").replace(")", "")
            != "casewhenativothenordem_prioridadeelsenull::integerend"
            or not all(por_coluna.get(c, {}).get("attnotnull") for c in
                       ("id_usuario_instrumento", "id_usuario", "nr_instrumento", "ativo"))):
        return ["Colunas de vínculos incompatíveis com a redistribuição; verifique a prioridade ativa gerada."]
    return []


async def _instrumentos(db, chaves):
    rows = (await db.execute(text(BASE + """
        SELECT u.chave, u.numero, u.numeros, u.identidade_ambigua,
               u.dados->>'nr_proposta' AS nr_proposta,
               u.dados->>'tipo_instrumento' AS tipo_instrumento,
               EXISTS(SELECT 1 FROM instrumento.tb_ted t
                      WHERE t.nr_ted::text = u.numero) AS ted_existe,
               (SELECT count(*) FROM painel_dsr.tb_revisao_instrumento r
                WHERE r.status = 'rascunho' AND (
                  (u.chave LIKE 'ted:%' AND r.tipo_instrumento = 'ted' AND r.nr_ted::text = u.numero)
                  OR (u.chave NOT LIKE 'ted:%' AND r.tipo_instrumento <> 'ted'
                      AND (r.nr_instrumento = ANY(u.numeros)
                           OR r.identificador_busca = ANY(u.numeros))))) AS rascunhos
        FROM universo u WHERE u.chave = ANY(CAST(:chaves AS text[])) ORDER BY u.chave
    """), {"chaves": chaves})).mappings().all()
    por_chave = {r["chave"]: {**r, "numeros": sorted(r["numeros"] or [])} for r in rows}
    return [por_chave.get(c, {"chave": c, "numero": c.split(":", 1)[-1],
                             "numeros": [], "tipo_instrumento": None, "encontrado": False})
            for c in sorted(chaves)]


async def _usuarios(db, ids, id_admin, *, bloquear=False):
    rows = (await db.execute(text("""
        SELECT id_usuario, nome, perfil, ativo, conta_ativada
        FROM painel_dsr.tb_usuario WHERE id_usuario = ANY(CAST(:ids AS integer[]))
        ORDER BY id_usuario
    """ + (" FOR SHARE NOWAIT" if bloquear else "")),
        {"ids": sorted(set(ids) | {id_admin})})).mappings().all()
    admin = next((u for u in rows if u["id_usuario"] == id_admin), None)
    if not admin or not admin["ativo"] or str(admin["perfil"]).strip().lower() != "admin":
        raise HTTPException(403, "Acesso restrito a administradores ativos. Atualize sua sessão.")
    return [dict(r) for r in rows if r["id_usuario"] in ids]


async def _vinculos(db, numeros, *, bloquear=False):
    return [dict(r) for r in (await db.execute(text("""
        SELECT i.id_usuario_instrumento, i.id_usuario, i.nr_instrumento, i.ativo,
               i.ordem_prioridade, i.xmin::text AS revisao, u.nome, u.perfil,
               u.ativo AS usuario_ativo, u.conta_ativada,
               u.id_usuario IS NOT NULL AS cadastro_encontrado
        FROM painel_dsr.tb_usuario_instrumento_monitoramento i
        LEFT JOIN painel_dsr.tb_usuario u ON u.id_usuario = i.id_usuario
        WHERE i.nr_instrumento = ANY(CAST(:numeros AS text[]))
        ORDER BY i.nr_instrumento, i.id_usuario_instrumento
    """ + (" FOR UPDATE OF i NOWAIT" if bloquear else "")),
        {"numeros": numeros})).mappings().all()]


def _ids(payload):
    return [i for i in payload.distribuicao.model_dump().values() if i is not None]


def _numeros(instrumentos):
    return sorted({n for i in instrumentos for n in i.get("numeros", [])})


async def previa(db, payload, admin):
    exigir_admin(admin)
    # A conferência permanece disponível sem liberação da escrita. O snapshot
    # READ ONLY abaixo impede efeitos no banco; aplicar mantém seu próprio bloqueio.
    await db.rollback()  # Fecha a leitura de autenticação antes do snapshot.
    async with db.begin():
        await db.execute(text("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY"))
        usuarios = await _usuarios(db, _ids(payload), admin.id_usuario)
        erros = await _validar_estrutura(db)
        instrumentos = await _instrumentos(db, payload.instrumentos)
        vinculos = await _vinculos(db, _numeros(instrumentos))
        plano = definir_plano(instrumentos, vinculos, usuarios, payload.distribuicao, erros)
        plano.pop("_acoes")
        plano.update(versao=None, expira_em=None)
        if not plano["impedidos"]:
            token = criar_token_acesso({
                "finalidade": "distribuicao-instrumentos:v1", "admin": admin.id_usuario,
                "pedido": _hash(_pedido(payload)), "estado": _estado(instrumentos, vinculos, usuarios),
                "nonce": uuid4().hex,
            }, _chave_assinatura(), expires_minutes=15)
            dados = decodificar_token_acesso(token, _chave_assinatura())
            plano.update(versao=token, expira_em=datetime.fromtimestamp(
                dados["exp"], timezone.utc).isoformat())
        return plano


def _validar_token(payload, admin):
    chave = _chave_assinatura()
    try:
        token = decodificar_token_acesso(payload.versao, chave)
    except (AttributeError, TypeError):
        # JSON válido pode ser lista/escalar; referência malformada é erro esperado.
        token = None
    if (not token or token.get("finalidade") != "distribuicao-instrumentos:v1"
            or token.get("admin") != admin.id_usuario
            or token.get("pedido") != _hash(_pedido(payload))
            or not isinstance(token.get("nonce"), str)):
        raise HTTPException(409, "Conferência inválida ou expirada. Faça uma nova conferência antes de aplicar.")
    return token


async def _bloquear(db, nonce, numeros):
    livre = (await db.execute(text("""
        SELECT pg_try_advisory_xact_lock(hashtextextended('distribuicao:' || :nonce, 0))
    """), {"nonce": nonce})).scalar_one()
    if not livre:
        raise HTTPException(409, "Esta confirmação já está sendo aplicada. Aguarde a conclusão.")
    # Mesmas chaves dos endpoints individuais; ordem determinística evita deadlocks.
    livre = (await db.execute(text("""
        SELECT bool_and(pg_try_advisory_xact_lock(hashtextextended('prioridades:' || nr, 0)))
        FROM (SELECT DISTINCT unnest(CAST(:numeros AS text[])) AS nr ORDER BY nr) ordenados
    """), {"numeros": numeros})).scalar_one()
    if livre is False:
        raise HTTPException(409, CONCORRENCIA)
    # O advisory lock não protege contra SQL externo. Este bloqueio curto também
    # impede inclusões/remoções fantasmas até o commit, inclusive em instrumentos
    # ainda sem vínculo. SELECTs comuns continuam permitidos. Sem esperar escritores.
    await db.execute(text(f"LOCK TABLE {TABELA} IN SHARE ROW EXCLUSIVE MODE NOWAIT"))


async def _bloquear_fontes(db, instrumentos):
    """Mantém existência/tipo/número oficiais estáveis até o commit do lote.

    A view combina muitas tabelas de metadados. Apenas as linhas que definem
    a identidade são bloqueadas; não há bloqueio da view nem dessas tabelas.
    """
    fontes = (
        ("instrumento.tb_contrato_repasse", lambda tipo: "compromisso" not in tipo),
        ("instrumento.tb_termo_de_compromisso", lambda tipo: "compromisso" in tipo),
    )
    for tabela, corresponde in fontes:
        selecionados = sorted(
            ((i.get("nr_proposta"), i["numero"]) for i in instrumentos
             if _tipo_valido(i) and not i["chave"].startswith("ted:")
             and corresponde(str(i.get("tipo_instrumento") or "").lower())),
            key=lambda par: (par[0] or "", par[1]),
        )
        if not selecionados:
            continue
        rows = (await db.execute(text(f"""
            SELECT s.proposta, s.numero
            FROM {tabela} f
            JOIN transferegov.tb_convenio cv ON cv.id_proposta = f.id_proposta
            JOIN unnest(CAST(:propostas AS text[]), CAST(:numeros AS text[]))
                 s(proposta, numero)
              ON f.nr_proposta IS NOT DISTINCT FROM s.proposta
             AND btrim(cv.nr_convenio::text) = s.numero
            ORDER BY f.id_proposta, cv.id_proposta, cv.nr_convenio
            FOR SHARE OF f, cv NOWAIT
        """), {"propostas": [p for p, _ in selecionados],
                 "numeros": [n for _, n in selecionados]})).mappings().all()
        if {(r["proposta"], r["numero"]) for r in rows} != set(selecionados):
            raise HTTPException(409, CONCORRENCIA)
    teds = sorted({int(i["numero"]) for i in instrumentos
                   if i["chave"].startswith("ted:") and _tipo_valido(i)})
    if teds:
        rows = (await db.execute(text("""
            SELECT nr_ted FROM instrumento.tb_ted
            WHERE nr_ted = ANY(CAST(:teds AS integer[]))
            ORDER BY nr_ted FOR SHARE NOWAIT
        """), {"teds": teds})).scalars().all()
        if set(rows) != set(teds):
            raise HTTPException(409, CONCORRENCIA)


async def _persistir(db, acoes):
    await db.execute(text(f"SET CONSTRAINTS {CONSTRAINT} DEFERRED"))
    # Executemany por ação; preservados não recebem UPDATE (mantêm id e xmin).
    desativar = [{"id": a["id_usuario_instrumento"]} for a in acoes if a["acao"] == "desativar"]
    atualizar = [{"id": a["id_usuario_instrumento"], "ordem": a["ordem_prioridade"]}
                 for a in acoes if a["acao"] in ("reativar", "alterar_prioridade")]
    criar = [{"usuario": a["id_usuario"], "nr": a["nr_instrumento"], "ordem": a["ordem_prioridade"]}
             for a in acoes if a["acao"] == "criar"]
    if desativar:
        await db.execute(text(f"UPDATE {TABELA} SET ativo = FALSE WHERE id_usuario_instrumento = :id"), desativar)
    if atualizar:
        await db.execute(text(f"UPDATE {TABELA} SET ativo = TRUE, ordem_prioridade = :ordem "
                              "WHERE id_usuario_instrumento = :id"), atualizar)
    if criar:
        await db.execute(text(f"INSERT INTO {TABELA} (id_usuario, nr_instrumento, ativo, ordem_prioridade) "
                              "VALUES (:usuario, :nr, TRUE, :ordem)"), criar)
    await db.execute(text(f"SET CONSTRAINTS {CONSTRAINT} IMMEDIATE"))


async def aplicar(db, payload, admin):
    exigir_admin(admin)
    exigir_habilitada()
    token = _validar_token(payload, admin)
    await db.rollback()
    try:
        async with db.begin():
            await db.execute(text("SET LOCAL statement_timeout = '25s'"))
            # Identidade é lida novamente após os locks. Só o conjunto assinado é usado.
            instrumentos = await _instrumentos(db, payload.instrumentos)
            await _bloquear(db, token["nonce"], _numeros(instrumentos))
            await _bloquear_fontes(db, instrumentos)
            usuarios = await _usuarios(db, _ids(payload), admin.id_usuario, bloquear=True)
            erros = await _validar_estrutura(db)
            instrumentos = await _instrumentos(db, payload.instrumentos)
            vinculos = await _vinculos(db, _numeros(instrumentos), bloquear=True)
            if token["estado"] != _estado(instrumentos, vinculos, usuarios):
                raise HTTPException(409, CONCORRENCIA)
            plano = definir_plano(instrumentos, vinculos, usuarios, payload.distribuicao, erros)
            if plano["impedidos"]:
                raise HTTPException(409, "A proposta possui impedimentos. Atualize os dados e faça uma nova conferência.")
            await _persistir(db, plano["_acoes"])
            finais = await _vinculos(db, _numeros(instrumentos))
            verificacao = definir_plano(instrumentos, finais, usuarios, payload.distribuicao)
            if verificacao["impedidos"] or verificacao["alterados"]:
                # Falha inesperada: o contexto reverte e o middleware central gera ERR-…
                raise RuntimeError("Estado final da distribuição divergente do plano validado.")
            resultado = {k: plano[k] for k in ("total", "alterados", "semMudancas", "contagens")}
        # Só retorna sucesso depois do commit de TODO o lote.
        return {**resultado, "mensagem": "Distribuição aplicada com sucesso."}
    except DBAPIError as exc:
        if getattr(exc.orig, "sqlstate", None) in ("55P03", "40P01", "40001"):
            raise HTTPException(409, CONCORRENCIA) from None
        # get_db/middleware central preservam rollback, código amigável e diagnóstico.
        raise
