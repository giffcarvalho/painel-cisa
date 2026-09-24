import { saveAs } from 'file-saver'
import { criarPlanilhaExcel } from './planilhaExcel'

export async function exportToExcel({ data, columns, fileName, sheetName = 'Dados' }) {
    const workbook = criarPlanilhaExcel({ data, columns, sheetName })

    // A geração em memória permite iniciar o download no navegador sem endpoint
    // intermediário para os gráficos que já têm todos os dados carregados.
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${fileName}.xlsx`)
}
