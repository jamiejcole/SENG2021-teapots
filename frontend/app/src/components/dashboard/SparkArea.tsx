import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

function pathFrom(points: Point[]) {
  if (points.length === 0) return ''
  const d = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 1; i < points.length; i++) d.push(`L ${points[i].x} ${points[i].y}`)
  return d.join(' ')
}

function areaFrom(points: Point[], height: number) {
  if (points.length === 0) return ''
  const line = pathFrom(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`
}

export function SparkArea({
  data,
  className,
}: {
  data: number[]
  className?: string
}) {
  const w = 320
  const h = 96
  const pad = 6

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1)
    const y = pad + ((max - v) * (h - pad * 2)) / range
    return { x, y }
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-24 w-full', className)} role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="brandArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaFrom(points, h)} fill="url(#brandArea)" />
      <path d={pathFrom(points)} fill="none" stroke="hsl(var(--brand))" strokeWidth="2" />
      <circle cx={points.at(-1)?.x ?? 0} cy={points.at(-1)?.y ?? 0} r="3" fill="hsl(var(--brand))" />
    </svg>
  )
}

