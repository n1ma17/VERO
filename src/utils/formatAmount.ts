const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatAmount(value: number): string {
  return formatter.format(value)
}
