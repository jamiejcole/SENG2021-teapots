import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type StatCardProps = {
  label: string
  value: string
  change?: string
  tone?: 'neutral' | 'positive' | 'negative'
  icon?: React.ComponentType<{ className?: string }>
  /** 0–100. When provided, renders a mini progress bar below the value. */
  progress?: number
}

export function StatCard({ label, value, change, tone = 'neutral', icon: Icon, progress }: StatCardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200',
      'border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30',
      'dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/10',
      'hover:shadow-md hover:-translate-y-0.5',
    )}>
      {/* Tone accent bar at the bottom */}
      {tone !== 'neutral' && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5 rounded-b-full',
            tone === 'positive' && 'bg-amber-400 dark:bg-amber-500',
            tone === 'negative' && 'bg-red-400 dark:bg-red-500',
          )}
        />
      )}

      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn(
            'rounded-xl p-2',
            tone === 'neutral' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
            tone === 'positive' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
            tone === 'negative' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
          )}>
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4 pt-0">
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums">{value}</div>

        {/* Mini progress bar */}
        {progress !== undefined && (
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-700 dark:bg-amber-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {change && (
          <div
            className={cn(
              'mt-1.5 text-xs font-medium',
              tone === 'neutral' && 'text-muted-foreground',
              tone === 'positive' && 'text-amber-700 dark:text-amber-400',
              tone === 'negative' && 'text-red-700 dark:text-red-400',
            )}
          >
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
