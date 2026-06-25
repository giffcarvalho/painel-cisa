import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e3a8a' },
  subtitle: { fontSize: 9, marginBottom: 12, color: '#475569' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  th: { flex: 1, padding: 4, fontWeight: 700, backgroundColor: '#eff6ff' },
  td: { flex: 1, padding: 4 },
  footer: { position: 'absolute', left: 28, right: 28, bottom: 16, fontSize: 7, color: '#64748b' },
})

const textValue = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export default function ExtratorPreviewPdf({ tipoTabelaLabel, columns, rows }) {
  const limitedColumns = columns.slice(0, 8)
  const limitedRows = rows.slice(0, 100)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Painel DSR</Text>
        <Text style={styles.subtitle}>
          Extrator de Dados - {tipoTabelaLabel} - Previa visivel
        </Text>

        <View style={styles.row} fixed>
          {limitedColumns.map((column) => (
            <Text key={column.id} style={styles.th}>{column.label}</Text>
          ))}
        </View>

        {limitedRows.map((row, index) => (
          <View key={index} style={styles.row}>
            {limitedColumns.map((column) => (
              <Text key={column.id} style={styles.td}>
                {textValue(row[column.id])}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          PDF limitado a 100 linhas e 8 colunas. Para base completa, use Excel.
        </Text>
      </Page>
    </Document>
  )
}