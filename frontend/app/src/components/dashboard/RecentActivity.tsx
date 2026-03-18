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
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="surface">
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

