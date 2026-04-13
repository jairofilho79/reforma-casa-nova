/** Apenas dígitos, para envio à API */
export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, '')
}

/** Máscara simples pt-BR: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
export function maskPhoneBrInput(value: string): string {
  const d = digitsOnlyPhone(value).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatPhoneBrDisplay(digits: string): string {
  const d = digitsOnlyPhone(digits)
  if (!d) return ''
  if (d.length <= 10) {
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`.trim()
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function isValidPhoneBrDigits(digits: string): boolean {
  const d = digitsOnlyPhone(digits)
  if (!d) return true
  return d.length === 10 || d.length === 11
}
