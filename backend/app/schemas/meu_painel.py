from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MeuPainelBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PendenciasPorGrupo(MeuPainelBase):
    municipios: int = 0
    localidades: int = 0
    publico_alvo: int = 0
    obras: int = 0


class InstrumentoPendenteItem(MeuPainelBase):
    identificador_instrumento: str
    tipo_instrumento: str
    tipo_instrumento_label: str
    total_pendencias: int
    grupos: PendenciasPorGrupo


class ResumoAlteracoesRascunho(MeuPainelBase):
    municipios: int = 0
    localidades: int = 0
    publico_alvo: int = 0
    obras: int = 0
    observacao_geral: bool = False


class RascunhoMeuPainelItem(MeuPainelBase):
    id_revisao: int
    identificador_instrumento: str
    tipo_instrumento: str
    tipo_instrumento_label: str
    criado_em: datetime
    atualizado_em: datetime
    alteracoes: ResumoAlteracoesRascunho


class ResumoMeuPainel(MeuPainelBase):
    instrumentos_com_pendencias: int
    rascunhos: int
    revisoes_enviadas: int


class MeuPainelResponse(MeuPainelBase):
    resumo: ResumoMeuPainel
    pendencias: list[InstrumentoPendenteItem] = Field(default_factory=list)
    rascunhos: list[RascunhoMeuPainelItem] = Field(default_factory=list)

