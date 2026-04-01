import { useId } from 'react'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

function pathFrom(points: Point[]) {
  if (points.length === 0) return ''
  const d = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 1; i < points.length; i++) d.push(`L ${points[i].x} ${points[i].y}`)
  return d.join(' ')
}

function areaFrom(points: Point[], plotBottom: number) {
  if (points.length === 0) return ''
  const line = pathFrom(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${plotBottom} L ${first.x} ${plotBottom} Z`
}

function formatAxisDate(isoDate: string) {
  try {
    const d = new Date(isoDate + 'T12:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return isoDate.slice(5)
  }
}

export type ThroughputDay = { date: string; count: number }

export function SparkArea({
  series,
  className,
}: {
  series: ThroughputDay[]
  className?: string
}) {
  const gradId = useId().replace(/:/g, '')
  const data = series.length ? series.map((s) => s.count) : [0]
  const labels = series.length ? series.map((s) => s.date) : []

  const ml = 44
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

  const min = Math.min(0, ...data)
  const max = Math.max(0, ...data, 1)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = plotLeft + (i * plotW) / Math.max(1, data.length - 1)
    const y = plotTop + ((max - v) * plotH) / range
    return { x, y }
  })

  const yTicks = 3
  const yVals = Array.from({ length: yTicks }, (_, i) => min + (range * i) / (yTicks - 1))
  const xTickIdx =
    labels.length <= 1
      ? [0]
      : [0, Math.floor((labels.length - 1) / 2), labels.length - 1].filter((i, j, a) => a.indexOf(i) === j)

  const axisLine = 'hsl(var(--border))'

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-32 w-full', className)} role="img" aria-label="Invoice throughput chart">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y axis */}
      <line x1={ml} y1={mt} x2={ml} y2={plotBottom} stroke={axisLine} strokeWidth="1" />
      {yVals.map((yv, i) => {
        const yy = plotTop + ((max - yv) * plotH) / range
        return (
          <g key={`y-${i}`}>
            <line x1={ml - 4} y1={yy} x2={ml} y2={yy} stroke={axisLine} strokeWidth="1" />
            <text x={ml - 8} y={yy + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10 }}>
              {Number.isInteger(yv) ? yv : Math.round(yv * 10) / 10}
            </text>
          </g>
        )
      })}

      {/* X axis */}
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

      <path d={areaFrom(points, plotBottom)} fill={`url(#${gradId})`} />
      <path d={pathFrom(points)} fill="none" stroke="hsl(var(--brand))" strokeWidth="2" />
      {points.at(-1) && <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="3" fill="hsl(var(--brand))" />}
    </svg>
  )
}
