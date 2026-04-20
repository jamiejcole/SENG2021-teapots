import { useEffect, useId, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DeliveryGaugeProps {
  sentCount: number
  failedSendCount: number
  className?: string
}

function gaugeColor(rate: number): string {
  if (rate >= 95) return 'hsl(45 93% 47%)' // yellow-500 — matches dashboard gold/yellow
  if (rate >= 85) return 'hsl(38 92% 50%)' // amber-500
  return 'hsl(0 84% 60%)' // red-500
}

function gaugeLabel(rate: number): string {
  if (rate >= 95) return 'Excellent'
  if (rate >= 85) return 'Good'
  return 'Needs attention'
}

function gaugeLabelClass(rate: number): string {
  if (rate >= 95) return 'text-amber-600 dark:text-amber-300'
  if (rate >= 85) return 'text-amber-700 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Converts polar coordinates to Cartesian.
 * angle: 0 = right, clockwise in SVG coords.
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

/**
 * Builds an SVG arc path for a gauge sweep.
 * startAngle/endAngle in degrees (0 = top, clockwise).
 */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function DeliveryGauge({ sentCount, failedSendCount, className }: DeliveryGaugeProps) {
  const uid = useId().replace(/:/g, '')
  const total = sentCount + failedSendCount
  const rawRate = total === 0 ? 100 : (sentCount / total) * 100
  const rate = Math.round(rawRate * 10) / 10

  // Animation: stroke draws in from 0 → actual value on mount
  const [animatedRate, setAnimatedRate] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setTimeout(() => setAnimatedRate(rate), 50)
    })
    return () => cancelAnimationFrame(t)
  }, [rate])

  // Gauge geometry
  const cx = 110
  const cy = 110
  const r = 78
  const sw = 16        // stroke width — slightly thicker for premium feel
  const startAngle = -140
  const endAngle = 140  // 280° total sweep
  const sweepDeg = endAngle - startAngle

  // Arc paths
  const trackPath = arcPath(cx, cy, r, startAngle, endAngle)
  const valueSweep = (animatedRate / 100) * sweepDeg
  const valuePath = arcPath(cx, cy, r, startAngle, startAngle + valueSweep)

  const color = gaugeColor(rate)
  const label = gaugeLabel(rate)
  const labelClass = gaugeLabelClass(rate)

  return (
    <Card className={cn(
      'flex h-full flex-col border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30',
      'dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20',
      className,
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Delivery success</CardTitle>
        <CardDescription>Invoice email delivery rate (all time)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center pb-6">
        <svg
          viewBox={`0 0 220 170`}
          className="w-full max-w-[220px]"
          aria-label={`Delivery success rate: ${rate}%`}
          role="img"
        >
          <defs>
            {/* Glow filter for the value arc */}
            <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track arc (background) */}
          <path
            d={trackPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={sw}
            strokeLinecap="round"
          />

          {/* Value arc with CSS transition */}
          <path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            filter={`url(#${uid}-glow)`}
            style={{
              transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />

          {/* Center: percentage */}
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
            style={{ fontSize: 32, fontWeight: 700, fontFamily: 'inherit' }}
          >
            {total === 0 ? '—' : `${Math.round(rate)}%`}
          </text>

          {/* Sub-label */}
          <text
            x={cx}
            y={cy + 30}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontWeight: 500 }}
          >
            Delivery rate
          </text>

          {/* Low-end indicator dot */}
          {(() => {
            const startPt = polarToCartesian(cx, cy, r, startAngle)
            return (
              <circle cx={startPt.x} cy={startPt.y} r="4" fill="hsl(var(--muted))" />
            )
          })()}
          {/* High-end indicator dot */}
          {(() => {
            const endPt = polarToCartesian(cx, cy, r, endAngle)
            return (
              <circle cx={endPt.x} cy={endPt.y} r="4" fill="hsl(var(--muted))" />
            )
          })()}
        </svg>

        {/* Status label */}
        <div className={cn('mt-1 text-sm font-semibold', labelClass)}>{label}</div>

        {/* Supporting stats */}
        <div className="mt-5 flex items-center gap-5 text-center">
          <div>
            <div className="text-lg font-bold tabular-nums text-foreground">{sentCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">sent</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className={cn(
              'text-lg font-bold tabular-nums',
              failedSendCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
            )}>
              {failedSendCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">failed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
