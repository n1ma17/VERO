const displayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Whole days from `fromIso` to `toIso` (both `YYYY-MM-DD`); negative if `toIso` is earlier. */
export function daysBetween(fromIso: string, toIso: string): number {
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86_400_000)
}

/** Formats a `YYYY-MM-DD` date or an ISO timestamp, e.g. `18 Oct 2026`. */
export function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return displayFormatter.format(new Date(year, month - 1, day))
}
