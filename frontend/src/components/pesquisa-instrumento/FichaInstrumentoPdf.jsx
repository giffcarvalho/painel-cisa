import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const emptyValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const formatDate = (value) => {
  if (!value) return '—';

  try {
    if (typeof value === 'string') {
      const onlyDate = value.slice(0, 10);
      const [year, month, day] = onlyDate.split('-');

      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch {
    return '—';
  }
};

const formatCurrency = (value) => {
  const number = Number(value);

  if (value === null || value === undefined || value === '' || Number.isNaN(number)) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
};

const formatPercentualPontos = (value) => {
  const number = Number(value);

  if (value === null || value === undefined || value === '' || Number.isNaN(number)) {
    return '—';
  }

  return `${number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const slug = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export const gerarNomeFichaInstrumentoPdf = (instrumento) => {
  const partes = ['ficha-instrumento'];

  if (instrumento?.nr_instrumento) {
    partes.push(slug(instrumento.nr_instrumento));
  }

  if (instrumento?.nr_proposta) {
    partes.push('proposta', slug(instrumento.nr_proposta));
  }

  return `${partes.filter(Boolean).join('-')}.pdf`;
};

const camposDataJaUsados = new Set([
  'dia_assin_conv',
  'dia_fim_vigenc_conv',
  'data_suspensiva',
  'data_aceite_projeto',
  'primeira_data_emissao_aio',
  'data_ultimo_bm',
  'data_ultima_vistoria',
  'data_ultimo_desbloqueio',
  'data_ultima_obtv',
  'data_dados_transferegov',
  'data_dados_caixa',
]);

const labelFromKey = (key) =>
  key
    .replace(/^data_/, 'Data ')
    .replace(/^dia_/, 'Dia ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getOutrasDatas = (instrumento) =>
  Object.entries(instrumento ?? {})
    .filter(([key, value]) => {
      if (!value || camposDataJaUsados.has(key)) return false;
      return key.includes('data') || key.startsWith('dia_');
    })
    .map(([key, value]) => ({
      label: labelFromKey(key),
      value: formatDate(value),
    }));

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 30,
    paddingLeft: 34,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderBottomStyle: 'solid',
    marginBottom: 16,
  },
  portal: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1d4ed8',
    marginBottom: 3,
  },
  department: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerMetaItem: {
    fontSize: 9,
    color: '#334155',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    paddingTop: 5,
    paddingRight: 8,
    paddingBottom: 5,
    paddingLeft: 8,
    marginBottom: 7,
    backgroundColor: '#eff6ff',
    color: '#1e3a8a',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  field: {
    width: '48.5%',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  fieldWide: {
    width: '100%',
  },
  label: {
    marginBottom: 2,
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  value: {
    color: '#111827',
    fontSize: 9,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    right: 34,
    bottom: 16,
    left: 34,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    color: '#64748b',
    fontSize: 7.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

function Field({ label, value, wide = false }) {
  return (
    <View style={[styles.field, wide && styles.fieldWide]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{emptyValue(value)}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

export default function FichaInstrumentoPdf({ instrumento }) {
  const dataEmissao = formatDate(new Date());
  const outrasDatas = getOutrasDatas(instrumento);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.portal}>Portal DSR</Text>
          <Text style={styles.department}>
            Departamento de Saneamento Rural e de Pequenos Municípios
          </Text>
          <Text style={styles.title}>Ficha do Instrumento</Text>

          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaItem}>
              Nº Instrumento: {emptyValue(instrumento?.nr_instrumento)}
            </Text>
            <Text style={styles.headerMetaItem}>
              Nº Proposta: {emptyValue(instrumento?.nr_proposta)}
            </Text>
            <Text style={styles.headerMetaItem}>
              Data de emissão: {dataEmissao}
            </Text>
          </View>
        </View>

        <Section title="Identificação">
          <Field label="Nº instrumento" value={instrumento?.nr_instrumento} />
          <Field label="Nº proposta" value={instrumento?.nr_proposta} />
          <Field label="Operação" value={instrumento?.operacao} />
          <Field label="Tipo de instrumento" value={instrumento?.tipo_instrumento} />
          <Field label="Proponente" value={instrumento?.nome_proponente} />
          <Field label="UF" value={instrumento?.uf} />
          <Field label="Município(s) beneficiado(s)" value={instrumento?.municipios_beneficiados} wide />
          <Field label="Quantidade de municípios" value={instrumento?.qtde_municipios} />
          <Field label="Objeto" value={instrumento?.objeto} wide />
        </Section>

        <Section title="Valores financeiros">
          <Field label="Valor global" value={formatCurrency(instrumento?.valor_global)} />
          <Field label="Valor empenhado" value={formatCurrency(instrumento?.valor_empenhado)} />
          <Field label="Valor a empenhar" value={formatCurrency(instrumento?.valor_a_empenhar)} />
          <Field label="Valor repasse" value={formatCurrency(instrumento?.valor_repasse)} />
          <Field label="Valor pago" value={formatCurrency(instrumento?.valor_desembolsado)} />
          <Field label="Valor a pagar/desembolsar" value={formatCurrency(instrumento?.valor_a_desembolsar)} />
          <Field label="Valor contrapartida" value={formatCurrency(instrumento?.valor_contrapartida)} />
          <Field label="Valor desbloqueado" value={formatCurrency(instrumento?.valor_desbloqueado)} />
        </Section>

        <Section title="Datas">
          <Field label="Data assinatura" value={formatDate(instrumento?.dia_assin_conv)} />
          <Field label="Término vigência" value={formatDate(instrumento?.dia_fim_vigenc_conv)} />
          <Field label="Data limite suspensiva" value={formatDate(instrumento?.data_suspensiva)} />
          <Field label="Data aprovação projeto" value={formatDate(instrumento?.data_aceite_projeto)} />
          <Field label="Data AIO" value={formatDate(instrumento?.primeira_data_emissao_aio)} />
          <Field label="Data último BM" value={formatDate(instrumento?.data_ultimo_bm)} />
          <Field label="Data última vistoria" value={formatDate(instrumento?.data_ultima_vistoria)} />
          <Field label="Data último desbloqueio" value={formatDate(instrumento?.data_ultimo_desbloqueio)} />
          <Field label="Data última OBTV" value={formatDate(instrumento?.data_ultima_obtv)} />
        </Section>

        <Section title="Acompanhamento">
          <Field label="Cláusula suspensiva" value={instrumento?.motivo_suspensao} />
          <Field label="Liminar judicial" value={instrumento?.liminar_judicial} />
          <Field label="Projeto básico" value={instrumento?.situacao_projeto} />
          <Field label="Situação obra" value={instrumento?.situacao_obra} />
          <Field label="% execução informado" value={formatPercentualPontos(instrumento?.percentual_fisico_informado)} />
          <Field label="% execução aferido" value={formatPercentualPontos(instrumento?.percentual_fisico_aferido)} />
          <Field label="% financeiro desbloqueado" value={formatPercentualPontos(instrumento?.percentual_financeiro_desbloqueado)} />
          <Field label="Situação informada pela mandatária" value={instrumento?.situacao_atual} wide />
        </Section>

        <Section title="Atualização dos dados">
          <Field label="Data dados Transferegov" value={formatDate(instrumento?.data_dados_transferegov)} />
          <Field label="Data dados Caixa" value={formatDate(instrumento?.data_dados_caixa)} />

          {outrasDatas.map((campo) => (
            <Field key={campo.label} label={campo.label} value={campo.value} />
          ))}
        </Section>

        <View style={styles.footer} fixed>
          <Text>Portal DSR - Ficha gerada em {dataEmissao}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
