import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Inbox,
  Mail,
  Package,
  Pencil,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ActivityItem = {
  id: string
  title: string
  meta: string
  amount?: string
  status: 'success' | 'pending' | 'failed'
  /** If set, the row links to invoice detail. */
  to?: string
  /** Backend activity type — drives icon selection. */
  activityType?: string
}

const badgeClass: Record<ActivityItem['status'], string> = {
  success:
    'border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  pending:
    'border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/35 dark:text-amber-200',
  failed:
    'border-red-200/80 bg-red-50/90 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
}

const badgeLabel: Record<ActivityItem['status'], string> = {
  success: 'Success',
  pending: 'Pending',
  failed: 'Failed',
}

const iconShell: Record<ActivityItem['status'], string> = {
  success:
    'border-emerald-200/60 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300',
  pending:
    'border-amber-200/60 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/35 dark:text-amber-200',
  failed:
    'border-red-200/60 bg-red-50 text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300',
}

function resolveActivityIcon(
  activityType: string | undefined,
  message: string,
): LucideIcon {
  const t = (activityType ?? '').toUpperCase()
  if (t === 'SENT') return Mail
  if (t === 'SEND_FAILED') return AlertCircle
  if (t === 'VALIDATED') return CheckCircle2
  if (t === 'CREATED') return FileText
  if (t === 'UPDATED') return Pencil
  if (t === 'REGENERATED') return RefreshCw
  const m = message.toLowerCase()
  if (m.includes('despatch')) return Truck
  if (m.includes('order')) return Package
  if (m.includes('email')) return Mail
  if (m.includes('validat')) return CheckCircle2
  return FileText
}

export function RecentActivity({
  items,
  className,
  description = 'Latest invoice events',
  fullActivityHref = '/invoices',
  fullActivityLabel = 'View full activity',
}: {
  items: ActivityItem[]
  className?: string
  description?: string
  /** Where “View full activity” navigates (e.g. invoice history). */
  fullActivityHref?: string
  fullActivityLabel?: string
}) {
  const hasRealItems = items.length > 0 && items[0]?.id !== 'empty'

  return (
    <Card
      className={cn(
        'overflow-hidden border-amber-200/60 bg-gradient-to-br from-white to-amber-50/25 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/15',
        className,
      )}
    >
      <CardHeader className="pb-2 text-center sm:text-left">
        <CardTitle className="text-base font-semibold tracking-tight">Recent activity</CardTitle>
        {description && (
          <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-4 pt-0">
        {/* Centered, compact feed — not full-bleed */}
        <div className="mx-auto w-full max-w-xl">
          <ul className="divide-y divide-border/60 rounded-xl border border-border/50 bg-card/30">
            {items.map((it) => {
              const Icon = resolveActivityIcon(it.activityType, it.title)
              const isEmpty = it.id === 'empty'
              /** Document-style events (e.g. CREATED) use the same soft mint shell as email / success — avoids harsh yellow. */
              const iconShellClass =
                isEmpty
                  ? iconShell.pending
                  : Icon === FileText && it.status === 'pending'
                    ? iconShell.success
                    : iconShell[it.status]

              const rowInner = (
                <>
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                      'group-hover:shadow-md group-hover:ring-2 group-hover:ring-amber-400/25',
                      iconShellClass,
                    )}
                    aria-hidden
                  >
                    {isEmpty ? (
                      <Inbox className="h-4 w-4 opacity-80" />
                    ) : (
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium leading-snug text-foreground">{it.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{it.meta}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
                    {it.amount && (
                      <span className="hidden text-xs font-medium tabular-nums text-foreground sm:block">
                        {it.amount}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-5 rounded-full border px-2 py-0 text-[10px] font-semibold transition-colors duration-200',
                        badgeClass[it.status],
                      )}
                    >
                      {badgeLabel[it.status]}
                    </Badge>
                  </div>
                </>
              )

              const rowClass = cn(
                'group flex w-full items-center gap-3 px-3 py-3 transition-colors duration-150 sm:px-4',
                'hover:bg-muted/50',
                !isEmpty && it.to && 'cursor-pointer',
              )

              return (
                <li key={it.id} className="first:rounded-t-xl last:rounded-b-xl">
                  {it.to && !isEmpty ? (
                    <Link to={it.to} className={rowClass}>
                      {rowInner}
                    </Link>
                  ) : (
                    <div className={rowClass}>{rowInner}</div>
                  )}
                </li>
              )
            })}
          </ul>

          {hasRealItems && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs font-medium text-muted-foreground hover:bg-amber-50 hover:text-foreground dark:hover:bg-amber-950/30"
                asChild
              >
                <Link to={fullActivityHref}>{fullActivityLabel}</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
