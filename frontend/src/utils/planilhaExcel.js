import ExcelJS from 'exceljs'

function normalizarValorCelula(value, column) {
    if (value === null || value === undefined || value === '') return null

    // Tipos explícitos evitam que o Excel armazene medidas numéricas como texto
    // e permitem que a formatação numFmt funcione corretamente.
    if (column.excelType === 'number') {
        const numericValue = Number(value)

        if (!Number.isFinite(numericValue)) {
            throw new TypeError(`Valor não numérico recebido para a coluna ${column.key}.`)
        }

        return numericValue
    }

    if (column.excelType === 'string') return String(value)

    return value
}

export function criarPlanilhaExcel({ data, columns, sheetName = 'Dados' }) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    worksheet.columns = columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
        style: col.numFmt ? { numFmt: col.numFmt } : undefined
    }))

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }
    }

    // A projeção por `columns` mantém a ordem da planilha e ignora propriedades
    // auxiliares presentes nos objetos de origem.
    data.forEach(row => {
        const excelRow = Object.fromEntries(
            columns.map(column => [column.key, normalizarValorCelula(row[column.key], column)])
        )
        worksheet.addRow(excelRow)
    })

    return workbook
}
