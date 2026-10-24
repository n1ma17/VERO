const displayFormatter = new Intl.NumberFormat('en-US')

export function formatTomanInputValue(value: number | null): string {
  if (value === null || value <= 0) return ''
  return displayFormatter.format(value)
}

export function parseTomanInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  const amount = Number(digits)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}
