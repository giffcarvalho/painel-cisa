import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// R$ 1.234.567.890,12 → compacto "R$ 1,23 bi" | "R$ 456,78 mi" | "R$ 1.234,56"
export function formatCurrency(value, compact = false) {
  if (value == null || isNaN(value)) return '—'
  if (compact) {
    if (Math.abs(value) >= 1e9) return `R$ ${(value / 1e9).toFixed(2).replace('.', ',')} bi`
    if (Math.abs(value) >= 1e6) return `R$ ${(value / 1e6).toFixed(2).replace('.', ',')} mi`
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// "2024-03-15T00:00:00" → "15/03/2024"
export function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '—'
  } catch {
    return '—'
  }
}

// 0.7523 → "75,23%"
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 75.23 → "75,23%"
export function formatPercentualPontos(value) {
  const number = Number(value)

  if (value === null || value === undefined || value === '' || Number.isNaN(number)) {
    return '—'
  }

  return `${number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}
