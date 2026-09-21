import { saveAs } from 'file-saver'
import { createExcelWorkbook } from './excelWorkbook'

export async function exportToExcel({ data, columns, fileName, sheetName = 'Dados' }) {
    const workbook = createExcelWorkbook({ data, columns, sheetName })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${fileName}.xlsx`)
}
