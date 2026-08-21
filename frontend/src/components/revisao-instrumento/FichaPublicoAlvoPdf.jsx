import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

const STATUS = {
  ok: 'Informação correta',
  informacao_incorreta: 'Informação incorreta',
  sem_informacao: 'Sem informação',
}

const TIPOS = {
  contrato_repasse: 'Contrato de Repasse',
  termo_execucao_descentralizada: 'Termo de Execução Descentralizada',
  termo_compromisso: 'Termo de Compromisso',
  ted: 'TED',
}

const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: 'Helvetica', fontSize: 9.5, color: '#172033', lineHeight: 1.45 },
  brand: { color: '#315b92', fontSize: 10, fontWeight: 700, marginBottom: 4 },
  title: { fontSize: 19, fontWeight: 700, marginBottom: 18 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#d8e0e9', marginVertical: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  itemTitle: { fontSize: 11, fontWeight: 700, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 5 },
  rowLabel: { width: 125, color: '#5c697a' },
  rowValue: { flex: 1 },
  field: { marginBottom: 13, paddingBottom: 11, borderBottomWidth: 0.5, borderBottomColor: '#e5eaf0' },
  fieldLabel: { color: '#64748b', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 },
  fieldValue: { fontSize: 10.5 },
  note: { padding: 10, backgroundColor: '#f5f7fa', marginTop: 4 },
})

function texto(value, fallback = 'Não informado') {
  return value === null || value === undefined || String(value).trim() === '' ? fallback : String(value)
}

function populacao(value) {
  const original = String(value ?? '').trim()
  const numero = Number(original.replace(/\D/g, ''))
  return /^[\d\s.,]+$/.test(original) && Number.isFinite(numero)
    ? `${new Intl.NumberFormat('pt-BR').format(numero)} pessoas`
    : texto(value)
}

function Linha({ label, children }) {
  if (!children) return null
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{children}</Text></View>
}

function Campo({ titulo, atual, status }) {
  return (
    <View style={styles.field}>
      <Text style={styles.itemTitle}>{titulo}</Text>
      <Text style={styles.fieldLabel}>Informação atual</Text>
      <Text style={styles.fieldValue}>{texto(atual)}</Text>
      <Text style={[styles.fieldLabel, { marginTop: 9 }]}>Resultado da conferência</Text>
      <Text style={styles.fieldValue}>{STATUS[status] || 'Não conferida'}</Text>
    </View>
  )
}

function FichaPublicoAlvoPdf({ revisao }) {
  const instrumento = revisao.instrumento
  const numero = instrumento.nr_instrumento || instrumento.nr_ted || instrumento.nr_proposta
  return (
    <Document title={`Revisão de Público-alvo — Instrumento ${numero}`} author="Painel DSR">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Painel DSR</Text>
        <Text style={styles.title}>Revisão de Público-alvo</Text>
        <Linha label="Número do instrumento">{texto(numero)}</Linha>
        <Linha label="Tipo">{TIPOS[instrumento.tipo_instrumento] || instrumento.tipo_instrumento}</Linha>
        {instrumento.nr_proposta && <Linha label="Proposta">{String(instrumento.nr_proposta)}</Linha>}
        {instrumento.nr_ted && <Linha label="TED">{String(instrumento.nr_ted)}</Linha>}
        <Linha label="Proponente">{instrumento.nome_proponente}</Linha>
        <Linha label="UF">{instrumento.uf}</Linha>
        <Linha label="Objeto">{instrumento.objeto}</Linha>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Público-alvo</Text>
        {revisao.publico_alvo.map((item, index) => (
          <View key={item.id_revisao_publico_alvo || item.id_projeto_investimento}>
            {revisao.publico_alvo.length > 1 && (
              <Text style={styles.itemTitle}>{texto(item.nome_obra, `Projeto ${index + 1}`)}</Text>
            )}
            <Campo titulo="População beneficiada" atual={populacao(item.populacao_beneficiada_original)}
              status={item.status_populacao_beneficiada} correcao={item.status_correcao_solicitada} />
            <Campo titulo="Descrição da população beneficiada" atual={item.desc_populacao_beneficiada_original}
              status={item.status_desc_populacao_beneficiada} correcao={item.status_correcao_solicitada} />
            {item.observacao_publico_alvo && (
              <View style={styles.note}>
                <Text style={styles.fieldLabel}>Observação</Text>
                <Text>{item.observacao_publico_alvo}</Text>
              </View>
            )}
            {index < revisao.publico_alvo.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {revisao.observacao_geral && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Observação geral</Text>
            <Text>{revisao.observacao_geral}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

export async function baixarFichaPublicoAlvo(revisao) {
  const numero = revisao.instrumento.nr_instrumento || revisao.instrumento.nr_ted || revisao.instrumento.nr_proposta
  const blob = await pdf(<FichaPublicoAlvoPdf revisao={revisao} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `revisao_publico_alvo_${numero}_rev_${revisao.id_revisao}.pdf`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
