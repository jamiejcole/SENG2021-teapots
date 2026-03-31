import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ActivityItem = {
  id: string
  title: string
  meta: string
  amount?: string
  status: 'success' | 'pending' | 'failed'
}

const tones: Record<ActivityItem['status'], string> = {
  success: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  pending: 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  failed: 'bg-amber-200/50 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100',
}

export function RecentActivity({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <Card className={cn('surface', className)}>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{it.title}</div>
              <div className="truncate text-xs text-muted-foreground">{it.meta}</div>
            </div>
            <div className="flex items-center gap-3">
              {it.amount && <div className="hidden text-sm font-medium sm:block">{it.amount}</div>}
              <Badge variant="secondary" className={cn('rounded-full', tones[it.status])}>
                {it.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

