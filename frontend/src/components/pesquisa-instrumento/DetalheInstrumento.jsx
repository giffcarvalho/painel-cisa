import { useInstrumentoDetalheQuery } from '../../hooks/usePesquisaInstrumento';
import { formatCurrency, formatDate, formatPercentualPontos } from '../../utils/formatters';
import FichaInstrumentoPdf, { gerarNomeFichaInstrumentoPdf } from './FichaInstrumentoPdf';
import { Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import styles from '../../pages/pesquisa-instrumento/PesquisaInstrumento.module.css';

const emptyValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return value;
};

const Field = ({ label, value }) => (
  <div className={styles.detailItem}>
    <span>{label}</span>
    {emptyValue(value)}
  </div>
);

const LinkField = ({ label, href }) => (
  <div className={styles.detailItem}>
    <span>{label}</span>
    {href ? (
      <a className={styles.detailLink} href={href} target="_blank" rel="noopener noreferrer">Acessar Transferegov</a>
    ) : (
      '—'
    )}
  </div>
);

const Section = ({ title, children }) => (
  <section className={styles.detailSection}>
    <h3>{title}</h3>
    <div className={styles.detailGrid}>{children}</div>
  </section>
);

export default function DetalheInstrumento({ nrInstrumentoSelecionado }) {
  const { data, isLoading, isError } = useInstrumentoDetalheQuery(nrInstrumentoSelecionado);

  const detalhe = data?.instrumento ?? data?.detalhe ?? data;

  return (
    <aside className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.cardHeaderContent}>
          <div>
            <h2>Detalhes</h2>
            <p>Informações do instrumento selecionado</p>
          </div>

          {nrInstrumentoSelecionado && !isLoading && !isError && detalhe && (
            <PDFDownloadLink className={styles.pdfDownloadButton} document={<FichaInstrumentoPdf instrumento={detalhe} />} fileName={gerarNomeFichaInstrumentoPdf(detalhe)}>
              {({ loading }) => (
                <>
                  <Download size={15} />
                  {loading ? 'Gerando PDF...' : 'Baixar PDF'}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </header>

      {!nrInstrumentoSelecionado && (
        <div className={styles.state}>
          Selecione um instrumento na lista para visualizar a ficha detalhada.
        </div>
      )}

      {nrInstrumentoSelecionado && isLoading && (
        <div className={styles.state}>Carregando detalhe do instrumento...</div>
      )}

      {nrInstrumentoSelecionado && isError && (
        <div className={`${styles.state} ${styles.error}`}>
          Não foi possível carregar o detalhe do instrumento.
        </div>
      )}

      {nrInstrumentoSelecionado && !isLoading && !isError && detalhe && (
        <div className={styles.detailBody}>
          <Section title="Identificação">
            <Field label="Nº instrumento" value={detalhe.nr_instrumento} />
            <Field label="Nº proposta" value={detalhe.nr_proposta} />
            <Field label="Operação" value={detalhe.operacao} />
            <Field label="Tipo de instrumento" value={detalhe.tipo_instrumento} />
            <Field label="Proponente" value={detalhe.nome_proponente} />
            <Field label="UF" value={detalhe.uf} />
            <Field label="Município(s) beneficiado(s)" value={detalhe.municipios_beneficiados} />
            <Field label="Quantidade de municípios" value={detalhe.qtde_municipios} />
            <Field label="Objeto" value={detalhe.objeto} />
          </Section>

          <Section title="Valores financeiros">
            <Field label="Valor global" value={formatCurrency(detalhe.valor_global)} />
            <Field label="Valor empenhado" value={formatCurrency(detalhe.valor_empenhado)} />
            <Field label="Valor a empenhar" value={formatCurrency(detalhe.valor_a_empenhar)} />
            <Field label="Valor repasse" value={formatCurrency(detalhe.valor_repasse)} />
            <Field label="Valor pago" value={formatCurrency(detalhe.valor_desembolsado)}/>
            <Field label="Valor a pagar/desembolsar" value={formatCurrency(detalhe.valor_a_desembolsar)}/>
            <Field label="Valor contrapartida" value={formatCurrency(detalhe.valor_contrapartida)}/>
            <Field label="Valor desbloqueado" value={formatCurrency(detalhe.valor_desbloqueado)}/>
          </Section>

          <Section title="Datas">
            <Field label="Data assinatura" value={formatDate(detalhe.dia_assin_conv)} />
            <Field label="Término vigência" value={formatDate(detalhe.dia_fim_vigenc_conv)} />
            <Field label="Data limite suspensiva" value={formatDate(detalhe.data_suspensiva)} />
            <Field label="Data aprovação projeto" value={formatDate(detalhe.data_aceite_projeto)} />
            <Field label="Data AIO" value={formatDate(detalhe.primeira_data_emissao_aio)} />
            <Field label="Data último BM" value={formatDate(detalhe.data_ultimo_bm)} />
            <Field label="Data última vistoria" value={formatDate(detalhe.data_ultima_vistoria)} />
            <Field label="Data último desbloqueio" value={formatDate(detalhe.data_ultimo_desbloqueio)} />
            <Field label="Data última OBTV" value={formatDate(detalhe.data_ultima_obtv)} />
          </Section>

          <Section title="Acompanhamento">
            <Field label="Cláusula suspensiva" value={detalhe.motivo_suspensao} />
            <Field label="Liminar judicial" value={detalhe.liminar_judicial} />
            <Field label="Projeto básico" value={detalhe.situacao_projeto} />
            <Field label="Situação obra" value={detalhe.situacao_obra} />
            <Field label="% execução informado" value={formatPercentualPontos(detalhe.percentual_fisico_informado)} />
            <Field label="% execução aferido" value={formatPercentualPontos(detalhe.percentual_fisico_aferido)} />
            <Field label="% financeiro desbloqueado" value={formatPercentualPontos(detalhe.percentual_financeiro_desbloqueado)} />
            <Field label="Situação informada pela mandatária" value={detalhe.situacao_atual} />
          </Section>

          <Section title="Atualização dos dados">
            <Field label="Data dados Transferegov" value={formatDate(detalhe.data_dados_transferegov)} />
            <Field label="Data dados Caixa" value={formatDate(detalhe.data_dados_caixa)} />
            <LinkField label="Link Transferegov" href={detalhe.link_transferegov} />
          </Section>
        </div>
      )}
    </aside>
  );
}
