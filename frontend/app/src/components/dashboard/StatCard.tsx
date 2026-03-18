import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type StatCardProps = {
  label: string
  value: string
  change?: string
  tone?: 'neutral' | 'positive' | 'negative'
  icon?: React.ComponentType<{ className?: string }>
}

export function StatCard({ label, value, change, tone = 'neutral', icon: Icon }: StatCardProps) {
  return (
    <Card className="surface-hover border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/10">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="text-balance font-display text-2xl tracking-tight">{value}</div>
        </div>
        {Icon && (
          <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      {change && (
        <CardContent className="pt-0">
          <div
            className={cn(
              'text-xs font-medium',
              tone === 'neutral' && 'text-muted-foreground',
              tone === 'positive' && 'text-amber-700 dark:text-amber-300',
              tone === 'negative' && 'text-amber-800 dark:text-amber-200',
            )}
          >
            {change}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

