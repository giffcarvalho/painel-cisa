import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// 1. Definição dos estilos usando Flexbox
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: '#1a365d',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
    color: '#28303d',
  },
  textPadrao: {
    fontSize: 9,
    fontStyle: 'italic',
    marginBottom: 15,
    color: '#718096',
    lineHeight: 1.3,
  },
  // --- Estilos da Tabela ---
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2b6cb0',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderColor: '#cbd5e0',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: '#cbd5e0',
    padding: 5,
  },
  // Larguras específicas das colunas
  colNum: { width: '10%' },
  colLat: { width: '25%' },
  colLng: { width: '25%' },
  colAnalise: { width: '40%', borderRightWidth: 0 },

  headerText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  cellText: {
    fontSize: 9,
  },

  paragraph: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#4A5568',
    lineHeight: 1.4,
    marginBottom: 6,
    textAlign: 'justify',
  },

  // --- Estilos da Observação e Correção ---
  sectionObs: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f7fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#2b6cb0',
  },
  labelObs: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  textObs: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  correcaoText: {
    marginTop: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#c53030',
  },
});

// 2. Componente do Documento
export const AnaliseCoordenadaPdf = ({
  identificador,
  coordenadas = [],
  observacaoGeral,
  situacaoCorrecao,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Título e Subtítulo */}
      <Text style={styles.title}>Relatório de análise das coordenadas geográficas</Text>
      {identificador && (
        <Text style={styles.subtitle}>Instrumento: {identificador}</Text>
      )}

      {/* Texto Padrão */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.paragraph}>
            Solicitamos a revisão das coordenadas geográficas fornecidas na aba "Dados da Proposta - Cadastro de Obras" 
            do Transferegov, referente ao Instrumento de Repasse nº {identificador} celebrado com o Ministério das Cidades.
        </Text>

        <Text style={styles.paragraph}>
            Solicitamos que as coordenadas reflitam os locais a serem beneficiados, adotando-se o seguinte padrão:
        </Text>

        <Text style={styles.paragraph}>
            No caso de Saneamento Rural, solicitamos que sejam fornecidas (no mínimo) uma coordenada para cada localidade rural beneficiada pelo projeto do instrumento em questão.
        </Text>

        <Text style={styles.paragraph}>
            No caso de Saneamento Urbano, solicitamos que sejam fornecidas (no mínimo) uma coordenada para cada bairro beneficiado pelo projeto do instrumento em questão.
        </Text>

        <Text style={styles.paragraph}>
            Segue abaixo o resultado da análise realizada por este Ministério.
        </Text>
        
      </View>

      {/* Tabela de Coordenadas */}
      <View style={styles.table}>
        {/* Cabeçalho da Tabela */}
        <View style={styles.tableHeaderRow}>
          <View style={[styles.tableColHeader, styles.colNum]}>
            <Text style={styles.headerText}>Nº</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colLat]}>
            <Text style={styles.headerText}>Latitude</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colLng]}>
            <Text style={styles.headerText}>Longitude</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colAnalise]}>
            <Text style={styles.headerText}>Análise</Text>
          </View>
        </View>

        {/* Linhas da Tabela */}
        {coordenadas.map((item, index) => {
          const analiseExibida = item._coordenadaAlterada
            ? item.situacao_analise || 'Sem análise'
            : item._coordenadaOriginal?.situacao_analise ||
              item.situacao_analise ||
              'Sem análise';

          const latitudeExibida =
            item.latitude ?? item._coordenadaOriginal?.latitude ?? '-';
          const longitudeExibida =
            item.longitude ?? item._coordenadaOriginal?.longitude ?? '-';

          return (
            <View style={styles.tableRow} key={index} wrap={false}>
              <View style={[styles.tableCol, styles.colNum]}>
                <Text style={styles.cellText}>{index + 1}</Text>
              </View>
              <View style={[styles.tableCol, styles.colLat]}>
                <Text style={styles.cellText}>{latitudeExibida}</Text>
              </View>
              <View style={[styles.tableCol, styles.colLng]}>
                <Text style={styles.cellText}>{longitudeExibida}</Text>
              </View>
              <View style={[styles.tableCol, styles.colAnalise]}>
                <Text style={styles.cellText}>{analiseExibida}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Observação Geral */}
      {observacaoGeral && observacaoGeral.trim() !== '' && (
        <View style={styles.sectionObs} wrap={false}>
          <Text style={styles.labelObs}>Observação:</Text>
          <Text style={styles.textObs}>{observacaoGeral}</Text>
        </View>
      )}

      
    </Page>
  </Document>
);