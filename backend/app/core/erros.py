"""Rastreamento local de falhas, sem mensagens/valores potencialmente sensíveis."""

import logging
import os
import sys
import traceback
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path
from uuid import uuid4

from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

LOG_PATH = Path(__file__).resolve().parents[2] / "logs" / "erros.log"
MENSAGEM_ERRO = "Não foi possível concluir a operação. Ocorreu um erro inesperado."
_scope_atual = ContextVar("scope_erro", default=None)
_arquivo = None


class ArquivoErros(RotatingFileHandler):
    """Rotação coordenada entre processos; falhas nunca escapam para a aplicação."""

    def emit(self, record):
        try:
            Path(self.baseFilename).parent.mkdir(parents=True, exist_ok=True)
            # RotatingFileHandler isolado não coordena processos. Todos abrem
            # o log só durante a trava, permitindo renomeá-lo também no Windows.
            with open(f"{self.baseFilename}.lock", "a+b") as trava:
                if os.name == "nt":
                    import msvcrt

                    trava.seek(0)
                    msvcrt.locking(trava.fileno(), msvcrt.LK_LOCK, 1)
                else:
                    import fcntl

                    fcntl.flock(trava.fileno(), fcntl.LOCK_EX)
                try:
                    super().emit(record)
                finally:
                    try:
                        if self.stream is not None:
                            self.stream.close()
                            self.stream = None
                    finally:
                        if os.name == "nt":
                            trava.seek(0)
                            msvcrt.locking(trava.fileno(), msvcrt.LK_UNLCK, 1)
                        else:
                            fcntl.flock(trava.fileno(), fcntl.LOCK_UN)
        except Exception:
            self.handleError(record)

    def handleError(self, record):
        # Não usar logging aqui: pode recursar e imprimir o registro original.
        try:
            sys.stderr.write("Painel DSR: não foi possível gravar erros.log. Verifique disco/permissões.\n")
        except Exception:
            pass


def _traceback_seguro(exc, vistos=None):
    """Preserva todos os frames, tipos e encadeamentos, sem locals ou SQL.

    Mensagens das exceções e linhas de código também podem conter senhas,
    tokens ou parâmetros do driver. Por isso não são serializadas.
    """
    vistos = set() if vistos is None else vistos
    if id(exc) in vistos:
        return ""
    vistos.add(id(exc))
    partes = []
    anterior = exc.__cause__ or (None if exc.__suppress_context__ else exc.__context__)
    if anterior is not None:
        partes.append(_traceback_seguro(anterior, vistos))
        partes.append("Exceção encadeada:\n")
    partes.append("Traceback (most recent call last):\n")
    for frame, linha in traceback.walk_tb(exc.__traceback__):
        # Caminhos relativos evitam registrar o nome pessoal da conta Windows.
        caminho = Path(frame.f_code.co_filename)
        try:
            caminho = caminho.resolve().relative_to(LOG_PATH.parent.parent)
        except ValueError:
            caminho = Path(caminho.name)
        partes.append(f'  File "{caminho}", line {linha}, in {frame.f_code.co_name}\n')
    partes.append(f"{type(exc).__module__}.{type(exc).__qualname__} [mensagem omitida por segurança]\n")
    for filho in getattr(exc, "exceptions", ()):
        partes.append(_traceback_seguro(filho, vistos))
    return "".join(partes)


def registrar_erro(exc, scope=None, origem="app"):
    scope = scope if scope is not None else _scope_atual.get()
    state = scope.setdefault("state", {}) if scope is not None else {}
    registros = state.setdefault("erros_registrados", [])
    for anterior, codigo in registros:
        if anterior is exc:
            return codigo
    codigo = f"ERR-{uuid4().hex.upper()}"
    registros.append((exc, codigo))
    try:
        rota = scope.get("route") if scope else None
        # O template da rota exclui query strings e parâmetros pessoais da URL.
        rota = getattr(rota, "path", "[rota não identificada]")
        metodo = scope.get("method", "-") if scope else "-"
        usuario = state.get("id_usuario_log")
        usuario = usuario if type(usuario) is int else "-"
        record = logging.LogRecord(origem, logging.ERROR, "", 0,
            "%s metodo=%s rota=%s usuario=%s origem=%s\n%s",
            (codigo, metodo, rota, usuario, origem, _traceback_seguro(exc)), None)
        if _arquivo is not None:
            _arquivo.handle(record)
    except Exception:
        # A resposta mantém seu identificador mesmo se o diagnóstico falhar.
        pass
    return codigo


class CapturarErros(logging.Handler):
    def emit(self, record):
        exc = record.exc_info[1] if record.exc_info else sys.exc_info()[1]
        if exc is not None:
            registrar_erro(exc, origem=record.name)


async def tratar_erro_http(request: Request, exc: HTTPException):
    # Erros HTTP esperados (inclusive 5xx explícitos sem causa) mantêm contrato.
    causa = exc.__cause__ or exc.__context__
    if exc.status_code >= 500 and causa is not None and not isinstance(causa, HTTPException):
        codigo = registrar_erro(causa, request.scope)
        return JSONResponse(status_code=exc.status_code, headers=exc.headers,
                            content={"detail": exc.detail, "codigo_erro": codigo})
    return await http_exception_handler(request, exc)


class ContextoErrosMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        token = _scope_atual.set(scope)
        resposta_iniciada = False

        async def enviar(message):
            nonlocal resposta_iniciada
            if message["type"] == "http.response.start":
                resposta_iniciada = True
            await send(message)

        try:
            await self.app(scope, receive, enviar)
        except Exception as exc:
            codigo = registrar_erro(exc, scope)
            if resposta_iniciada:
                # Streaming já iniciado não permite substituir o status/corpo.
                raise RuntimeError(f"Falha durante resposta iniciada; código {codigo}") from None
            response = JSONResponse(status_code=500,
                content={"detail": MENSAGEM_ERRO, "codigo_erro": codigo})
            await response(scope, receive, send)
        finally:
            _scope_atual.reset(token)


def configurar_erros(app, caminho=LOG_PATH):
    global _arquivo
    if _arquivo is None:
        _arquivo = ArquivoErros(caminho, maxBytes=10 * 1024 * 1024,
                               backupCount=5, encoding="utf-8", delay=True)
        _arquivo.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s",
                                               datefmt="%Y-%m-%d %H:%M:%S%z"))
        try:
            Path(caminho).parent.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass
    logger = logging.getLogger("app")
    if not any(isinstance(handler, CapturarErros) for handler in logger.handlers):
        logger.addHandler(CapturarErros(level=logging.ERROR))
    # Não encaminhar mensagens SQL/tracebacks brutos dos loggers existentes.
    logger.propagate = False
    app.add_exception_handler(HTTPException, tratar_erro_http)
    app.add_middleware(ContextoErrosMiddleware)
