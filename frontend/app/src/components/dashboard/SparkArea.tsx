import { useId, useMemo, useState } from 'react'
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const data = series.length ? series.map((s) => Number(s.revenue) || 0) : [0]
  const labels = series.length ? series.map((s) => s.date) : []

  // Canvas dimensions — taller to fill the card properly
  const ml = 56
  const mr = 16
  const mt = 20
  const mb = 44
  const w = 400
  const h = 220
  const plotW = w - ml - mr
  const plotH = h - mt - mb
  const plotLeft = ml
  const plotTop = mt
  const plotBottom = mt + plotH

  const rawMax = Math.max(0, ...data)
  const max = rawMax === 0 ? 1 : rawMax * 1.15
  const min = 0
  const range = max - min || 1

  const points: Point[] = data.map((v, i) => {
    const x = plotLeft + (i * plotW) / Math.max(1, data.length - 1)
    const y = plotTop + ((max - v) * plotH) / range
    return { x, y }
  })

  const lineD = smoothPathFrom(points)

  // Y-axis ticks (5 lines for more density)
  const yTicks = 5
  const yVals = Array.from({ length: yTicks }, (_, i) => min + (range * i) / (yTicks - 1))

  // X-axis ticks
  const xTickIdx =
    labels.length <= 1
      ? [0]
      : [0, Math.floor((labels.length - 1) / 3), Math.floor(((labels.length - 1) * 2) / 3), labels.length - 1].filter(
          (v, i, a) => a.indexOf(v) === i,
        )

  const axisLine = 'hsl(var(--border))'
  const gridLine = 'hsl(var(--border) / 0.4)'

  const wow = useMemo(() => (series.length ? weekOverWeekDelta(series) : null), [series])
  const invoicesInPeriod = useMemo(() => series.reduce((s, d) => s + d.count, 0), [series])

  // Column width for hover zones
  const colW = data.length > 1 ? plotW / (data.length - 1) : plotW

  // Tooltip positioning
  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null
  const tooltipX = hovered ? Math.min(Math.max(hovered.x, ml + 50), w - 60) : 0
  const tooltipY = hovered ? Math.max(hovered.y - 44, mt + 4) : 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Week-over-week summary */}
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
          <span className="text-muted-foreground">Not enough history for comparison</span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">{invoicesInPeriod} invoices in window</span>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-56 w-full"
        role="img"
        aria-label="Daily revenue chart"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.45" />
            <stop offset="75%" stopColor="hsl(var(--brand))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yVals.map((yv, i) => {
          const yy = plotTop + ((max - yv) * plotH) / range
          return (
            <line
              key={`grid-${i}`}
              x1={plotLeft}
              y1={yy}
              x2={plotLeft + plotW}
              y2={yy}
              stroke={gridLine}
              strokeWidth="1"
              strokeDasharray={i === 0 ? undefined : '4 4'}
            />
          )
        })}

        {/* Y-axis */}
        <line x1={ml} y1={mt} x2={ml} y2={plotBottom} stroke={axisLine} strokeWidth="1" />
        {yVals.map((yv, i) => {
          const yy = plotTop + ((max - yv) * plotH) / range
          return (
            <g key={`y-${i}`}>
              <line x1={ml - 4} y1={yy} x2={ml} y2={yy} stroke={axisLine} strokeWidth="1" />
              <text
                x={ml - 8}
                y={yy + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {formatAxisMoney(yv)}
              </text>
            </g>
          )
        })}

        {/* X-axis */}
        <line
          x1={plotLeft}
          y1={plotBottom}
          x2={plotLeft + plotW}
          y2={plotBottom}
          stroke={axisLine}
          strokeWidth="1"
        />
        {labels.length > 0 &&
          xTickIdx.map((idx) => {
            const xx = plotLeft + (idx * plotW) / Math.max(1, data.length - 1)
            return (
              <text
                key={`x-${idx}`}
                x={xx}
                y={h - 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 10 }}
              >
                {formatAxisDate(labels[idx])}
              </text>
            )
          })}

        {/* Gradient fill area */}
        <path d={areaFromSmoothLine(lineD, points, plotBottom)} fill={`url(#${gradId})`} />

        {/* Main line */}
        <path
          d={lineD}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover vertical line */}
        {hovered && (
          <line
            x1={hovered.x}
            y1={plotTop}
            x2={hovered.x}
            y2={plotBottom}
            stroke="hsl(var(--brand))"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.6"
          />
        )}

        {/* Data point dots — all subtle, hovered one highlighted */}
        {points.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 5 : 3}
            fill={hoveredIdx === i ? 'hsl(var(--brand))' : 'hsl(var(--background))'}
            stroke="hsl(var(--brand))"
            strokeWidth={hoveredIdx === i ? 2.5 : 1.5}
            style={{ transition: 'r 0.1s, fill 0.1s' }}
          />
        ))}

        {/* Hover tooltip */}
        {hovered && hoveredIdx !== null && (
          <g>
            {/* Tooltip background */}
            <rect
              x={tooltipX - 50}
              y={tooltipY - 2}
              width="100"
              height="36"
              rx="6"
              fill="hsl(var(--popover))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              filter="drop-shadow(0 2px 4px rgb(0 0 0 / 0.12))"
            />
            {/* Date label */}
            <text
              x={tooltipX}
              y={tooltipY + 12}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 9, fontWeight: 500 }}
            >
              {labels[hoveredIdx] ? formatAxisDate(labels[hoveredIdx]) : ''}
            </text>
            {/* Revenue value */}
            <text
              x={tooltipX}
              y={tooltipY + 26}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {formatAxisMoney(data[hoveredIdx])}
            </text>
          </g>
        )}

        {/* Invisible hover zones for each column */}
        {data.map((_, i) => {
          const cx = plotLeft + (i * plotW) / Math.max(1, data.length - 1)
          return (
            <rect
              key={`zone-${i}`}
              x={cx - colW / 2}
              y={plotTop}
              width={colW}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          )
        })}
      </svg>
    </div>
  )
}
