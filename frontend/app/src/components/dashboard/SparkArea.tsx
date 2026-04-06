import { useId, useMemo } from 'react'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

export type ThroughputDay = { date: string; count: number; revenue: number }

function smoothPathFrom(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function areaFromSmoothLine(lineD: string, points: Point[], plotBottom: number) {
  if (points.length === 0) return ''
  const last = points[points.length - 1]
  const first = points[0]
  return `${lineD} L ${last.x} ${plotBottom} L ${first.x} ${plotBottom} Z`
}

function formatAxisDate(isoDate: string) {
  try {
    const d = new Date(isoDate + 'T12:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return isoDate.slice(5)
  }
}

function formatAxisMoney(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000) return `$${(n / 1_000).toFixed(1)}k`
  if (abs >= 1000) return `$${Math.round(n / 100) / 10}k`
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatAud(amount: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'AUD' }).format(amount)
}

/** Split 14-day series into first vs second week; compare total revenue. */
function weekOverWeekDelta(series: ThroughputDay[]) {
  if (series.length < 4) return null
  const mid = Math.floor(series.length / 2)
  const older = series.slice(0, mid).reduce((s, d) => s + d.revenue, 0)
  const newer = series.slice(mid).reduce((s, d) => s + d.revenue, 0)
  const delta = newer - older
  const pct = older > 0 ? (delta / older) * 100 : newer > 0 ? 100 : 0
  return { older, newer, delta, pct }
}

export function SparkArea({
  series,
  className,
}: {
  series: ThroughputDay[]
  className?: string
}) {
  const gradId = useId().replace(/:/g, '')
  const data = series.length ? series.map((s) => Number(s.revenue) || 0) : [0]
  const labels = series.length ? series.map((s) => s.date) : []

  const ml = 52
  const mr = 12
  const mt = 14
  const mb = 36
  const w = 360
  const h = 128
  const plotW = w - ml - mr
  const plotH = h - mt - mb
  const plotLeft = ml
  const plotTop = mt
  const plotBottom = mt + plotH

  const rawMax = Math.max(0, ...data)
  /** Scale to data (no artificial cap at 1 when totals are higher); small headroom for curve. */
  const max =
    rawMax === 0 ? 1 : rawMax * 1.12
  const min = 0
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = plotLeft + (i * plotW) / Math.max(1, data.length - 1)
    const y = plotTop + ((max - v) * plotH) / range
    return { x, y }
  })

  const lineD = smoothPathFrom(points)

  const yTicks = 4
  const yVals = Array.from({ length: yTicks }, (_, i) => min + (range * i) / (yTicks - 1))
  const xTickIdx =
    labels.length <= 1
      ? [0]
      : [0, Math.floor((labels.length - 1) / 2), labels.length - 1].filter((i, j, a) => a.indexOf(i) === j)

  const axisLine = 'hsl(var(--border))'

  const wow = useMemo(() => (series.length ? weekOverWeekDelta(series) : null), [series])

  const invoicesInPeriod = useMemo(() => series.reduce((s, d) => s + d.count, 0), [series])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        {wow ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium tabular-nums',
              wow.delta > 0 && 'text-emerald-700 dark:text-emerald-400',
              wow.delta < 0 && 'text-red-700 dark:text-red-400',
              wow.delta === 0 && 'text-muted-foreground',
            )}
          >
            {wow.delta > 0 ? '↑' : wow.delta < 0 ? '↓' : '→'}
            {wow.delta === 0
              ? 'No change'
              : `${formatAud(Math.abs(wow.delta))}${wow.older > 0 ? ` (${wow.pct >= 0 ? '+' : ''}${wow.pct.toFixed(0)}%)` : ''}`}
            <span className="font-normal text-muted-foreground">vs prior {Math.floor(series.length / 2)} days</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Not enough history for week comparison</span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">{invoicesInPeriod} invoices in window</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" role="img" aria-label="Daily revenue chart">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={ml} y1={mt} x2={ml} y2={plotBottom} stroke={axisLine} strokeWidth="1" />
        {yVals.map((yv, i) => {
          const yy = plotTop + ((max - yv) * plotH) / range
          return (
            <g key={`y-${i}`}>
              <line x1={ml - 4} y1={yy} x2={ml} y2={yy} stroke={axisLine} strokeWidth="1" />
              <text x={ml - 8} y={yy + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>
                {formatAxisMoney(yv)}
              </text>
            </g>
          )
        })}

        <line x1={plotLeft} y1={plotBottom} x2={plotLeft + plotW} y2={plotBottom} stroke={axisLine} strokeWidth="1" />
        {labels.length > 0 &&
          xTickIdx.map((idx) => {
            const xx = plotLeft + (idx * plotW) / Math.max(1, data.length - 1)
            return (
              <text
                key={`x-${idx}`}
                x={xx}
                y={h - 10}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 10 }}
              >
                {formatAxisDate(labels[idx])}
              </text>
            )
          })}

        <path d={areaFromSmoothLine(lineD, points, plotBottom)} fill={`url(#${gradId})`} />
        <path d={lineD} fill="none" stroke="hsl(var(--brand))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.at(-1) && <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="3" fill="hsl(var(--brand))" />}
      </svg>
    </div>
  )
}
