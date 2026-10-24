const formatter = new Intl.NumberFormat('en-US')
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatToman(value: number): string {
  return `${formatter.format(value)} Toman`
}

/** Grouped number without the unit, for layouts that render "Toman" separately. */
export function formatTomanNumber(value: number): string {
  return formatter.format(value)
}

/** Short form for chart axes, e.g. `12.5M`. */
export function formatTomanCompact(value: number): string {
  return compactFormatter.format(value)
}

/** @deprecated Use formatToman — kept for imports; same English output. */
export function formatTomanPersian(value: number): string {
  return formatToman(value)
}
