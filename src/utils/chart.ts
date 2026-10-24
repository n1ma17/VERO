export interface ChartPoint {
  x: number
  y: number
}

export interface NiceScale {
  min: number
  max: number
  step: number
  ticks: number[]
}

function niceStep(rawStep: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return factor * magnitude
}

/** Round axis bounds that always include 0. */
export function niceScale(values: number[], tickCount = 4): NiceScale {
  const rawMax = Math.max(1, ...values)
  const rawMin = Math.min(0, ...values)
  const step = niceStep((rawMax - rawMin) / tickCount)
  const max = Math.ceil(rawMax / step) * step
  const min = Math.floor(rawMin / step) * step
  const count = Math.round((max - min) / step)
  const ticks = Array.from({ length: count + 1 }, (_, i) => min + step * i)
  return { min, max, step, ticks }
}

function clamp(value: number, a: number, b: number): number {
  return Math.min(Math.max(value, Math.min(a, b)), Math.max(a, b))
}

/**
 * Smooth SVG path through points (Catmull-Rom converted to cubic Béziers).
 * Control points are clamped to each segment's y-range so the curve never overshoots
 * past its neighbours (e.g. dipping below zero next to a flat run).
 */
export function smoothPath(points: ChartPoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6, p1.y, p2.y)
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6, p1.y, p2.y)
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return path
}

/** Closes a line path down to `baselineY` so it can be filled as an area. */
export function areaPath(points: ChartPoint[], baselineY: number): string {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${smoothPath(points)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}
