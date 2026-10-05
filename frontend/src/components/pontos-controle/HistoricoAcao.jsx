import React from 'react';
import { X, Calendar, User, FileText, Loader2, AlertCircle } from 'lucide-react';
import { formatDatetime } from '../../utils/formatters'; // ajuste o caminho das suas funções utilitárias
import { useBuscaHistoricoAcaoQuery } from '../../hooks/useBuscaHistoricoAcaoQuery'; // ajuste o caminho do hook
import estilos from './HistoricoPlanosAcao.module.css';

export function HistoricoPlanosAcao({ nrInstrumento, fecharJanela }) {
    // Chamada do hook React Query
    const { data, isLoading, isError, refetch } = useBuscaHistoricoAcaoQuery(nrInstrumento);

    // Extrai a lista de planos de dentro do formato retornado pela API { data: [...] }
    const listaPlanos = data?.data || [];

    return (
        <div className={estilos.container}>
            {/* Cabeçalho */}
            <div className={estilos.cabecalho}>
                <div className={estilos.cabecalho_titulo}>
                    <h4>Histórico Geral de Ações - Instrumento {nrInstrumento || '—'}</h4>
                    <button 
                        type="button"
                        className={estilos.botaoX}
                        onClick={fecharJanela}
                        title="Fechar"
                    >
                        <X className={estilos.XFechar} />
                    </button>
                </div>
                <p className={estilos.subtitulo}>
                    Exibindo todos os planos de ação cadastrados para este instrumento.
                </p>
            </div>

            {/* Corpo com scroll / Estados da Requisição */}
            <div className={estilos.corpo_lista}>
                {/* 1. Estado de Carregamento */}
                {isLoading && (
                    <div className={estilos.mensagem_status}>
                        <Loader2 className={estilos.icone_spin} size={32} />
                        <p>Carregando histórico...</p>
                    </div>
                )}

                {/* 2. Estado de Erro */}
                {!isLoading && isError && (
                    <div className={estilos.mensagem_status}>
                        <AlertCircle size={32} className={estilos.icone_erro} />
                        <p>Ocorreu um erro ao carregar o histórico.</p>
                        <button type="button" onClick={() => refetch()} className={estilos.botao_tentar_novamente}>
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* 3. Estado de Lista Vazia */}
                {!isLoading && !isError && listaPlanos.length === 0 && (
                    <div className={estilos.mensagem_status}>
                        <FileText size={32} />
                        <p>Nenhum plano de ação cadastrado para este instrumento.</p>
                    </div>
                )}

                {/* 4. Lista de Planos de Ação */}
                {!isLoading && !isError && listaPlanos.length > 0 && (
                    listaPlanos.map((plano) => (
                        <div key={plano.id_plano_acao} className={estilos.card_plano}>
                            {/* Topo do Card */}
                            <div className={estilos.card_cabecalho}>
                                <span className={estilos.ponto_controle_tag}>
                                    {plano.ponto_controle || 'Ponto de Controle'}: <strong>{plano.status_ponto_controle || '—'}</strong>
                                </span>
                                {plano.criado_em && (
                                    <span className={estilos.data_registro}>
                                        <Calendar size={14} />
                                        {formatDatetime(plano.criado_em)}
                                    </span>
                                )}
                            </div>

                            {/* Respostas do Formulário */}
                            <div className={estilos.card_respostas}>
                                <div className={estilos.item_resposta}>
                                    <span className={estilos.pergunta_label}>Confirma status?</span>
                                    <span className={estilos.resposta_valor}>{plano.confirmacao || '—'}</span>
                                </div>
                                <div className={estilos.item_resposta}>
                                    <span className={estilos.pergunta_label}>Avaliação Coordenação?</span>
                                    <span className={estilos.resposta_valor}>{plano.coordenacao || '—'}</span>
                                </div>
                                <div className={estilos.item_resposta}>
                                    <span className={estilos.pergunta_label}>Contato Mandatária?</span>
                                    <span className={estilos.resposta_valor}>{plano.mandataria || '—'}</span>
                                </div>
                                <div className={estilos.item_resposta}>
                                    <span className={estilos.pergunta_label}>Contato Ente Recebedor?</span>
                                    <span className={estilos.resposta_valor}>{plano.recebedor || '—'}</span>
                                </div>
                            </div>

                            {/* Observação / Descrição da Ação */}
                            {plano.observacao_acao && (
                                <div className={estilos.card_observacao}>
                                    <strong>Descrição da Ação:</strong>
                                    <p>{plano.observacao_acao}</p>
                                </div>
                            )}

                            {/* Rodapé do Card */}
                            <div className={estilos.card_rodape}>
                                {plano.prazo_acao && (
                                    <div className={estilos.prazo_alerta}>
                                        <span>Prazo definido: <strong>{plano.prazo_acao}</strong></span>
                                    </div>
                                )}
                                {plano.usuario && (
                                    <div className={estilos.usuario_info}>
                                        <User size={14} />
                                        <span>Registrado por: <strong>{plano.usuario}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}