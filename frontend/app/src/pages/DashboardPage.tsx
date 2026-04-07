import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Package, ReceiptText, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { SparkArea } from '@/components/dashboard/SparkArea'
import { RecentActivity, type ActivityItem } from '@/components/dashboard/RecentActivity'
import { fetchDashboardStats, type DashboardStats } from '@/api/invoices'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function formatAud(amount: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'AUD' }).format(amount)
}

function relMeta(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const ACTIVITY_LIMIT = 5

function toActivityItems(stats: DashboardStats): ActivityItem[] {
  return stats.recentActivity.slice(0, ACTIVITY_LIMIT).map((row) => {
    const status: ActivityItem['status'] =
      row.type === 'SEND_FAILED' ? 'failed' : row.type === 'SENT' || row.type === 'VALIDATED' ? 'success' : 'pending'
    return {
      id: row.id,
      title: row.message,
      meta: `${row.invoiceId} · ${relMeta(row.at)}`,
      status,
      to: row.invoiceMongoId ? `/invoices/${row.invoiceMongoId}` : undefined,
    }
  })
}

function floatStyle(ms: number, ready: boolean): CSSProperties | undefined {
  if (!ready) return undefined
  return { animationDelay: `${ms}ms` }
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await fetchDashboardStats()
        if (!cancelled) setStats(s)
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Could not load dashboard'
        toast.error('Dashboard unavailable', { description: msg })
        if (!cancelled) {
          setStats({
            totalInvoices: 0,
            revenueTotal: 0,
            sentCount: 0,
            validatedCount: 0,
            failedSendCount: 0,
            pendingCount: 0,
            totalOrders: 0,
            ordersCancelled: 0,
            ordersOpen: 0,
            totalDespatches: 0,
            despatchesFulfilmentCancelled: 0,
            throughputByDay: [],
            recentActivity: [],
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const throughputSeries = useMemo(() => stats?.throughputByDay ?? [], [stats])

  const activityItems = useMemo(() => (stats ? toActivityItems(stats) : []), [stats])

  const ready = !loading && !!stats

  return (
    <div className="space-y-8">
      <div
        className={cn('space-y-1', ready && 'dashboard-float-in')}
        style={floatStyle(0, ready)}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <Sparkles className="size-3.5" />
          Live data
        </div>
        <h1 className="text-balance font-display text-3xl tracking-tight sm:text-4xl">Overview</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Metrics from invoices stored for your account (UBL lifecycle, sends, and recent events).
        </p>
      </div>

      {loading || !stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(70, ready)}>
            <StatCard label="Invoices stored" value={String(stats.totalInvoices)} tone="neutral" icon={ReceiptText} />
          </div>
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(140, ready)}>
            <StatCard
              label="Invoices validated"
              value={String(stats.validatedCount)}
              change={`${stats.pendingCount} draft / saved`}
              tone="positive"
              icon={ShieldCheck}
            />
          </div>
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(210, ready)}>
            <StatCard
              label="Revenue tracked (totals)"
              value={formatAud(stats.revenueTotal)}
              change="Sum of payable amounts in AUD display"
              tone="positive"
              icon={Coins}
            />
          </div>
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(280, ready)}>
            <StatCard
              label="Failed sends"
              value={String(stats.failedSendCount)}
              change={`${stats.sentCount} sent (incl. paid/overdue)`}
              tone={stats.failedSendCount > 0 ? 'negative' : 'positive'}
              icon={ShieldCheck}
            />
          </div>
        </div>
      )}

      {loading || !stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`ord-${i}`} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(320, ready)}>
            <StatCard
              label="Orders stored"
              value={String(stats.totalOrders ?? 0)}
              change={`${stats.ordersOpen ?? 0} open · ${stats.ordersCancelled ?? 0} cancelled`}
              tone="neutral"
              icon={Package}
            />
          </div>
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(340, ready)}>
            <StatCard
              label="Despatches"
              value={String(stats.totalDespatches ?? 0)}
              change={`${stats.despatchesFulfilmentCancelled ?? 0} fulfilment cancelled`}
              tone="neutral"
              icon={Truck}
            />
          </div>
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(360, ready)}>
            <StatCard
              label="Orders open"
              value={String(stats.ordersOpen ?? 0)}
              change="Excludes cancelled"
              tone="positive"
              icon={Package}
            />
          </div>
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(380, ready)}>
            <StatCard
              label="Orders cancelled"
              value={String(stats.ordersCancelled ?? 0)}
              change="Account-scoped"
              tone={(stats.ordersCancelled ?? 0) > 0 ? 'negative' : 'positive'}
              icon={Package}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className={cn(
            'border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 lg:col-span-2 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20',
            ready && 'dashboard-float-in',
          )}
          style={floatStyle(400, ready)}
        >
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <CardDescription>Daily payable totals (AUD) from new invoices — last 14 days</CardDescription>
            </div>
            <Button variant="secondary" size="sm" className="rounded-full" asChild>
              <Link to="/invoices">View invoices</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? <Skeleton className="h-32 w-full rounded-xl" /> : <SparkArea series={throughputSeries} />}
          </CardContent>
        </Card>

        {loading ? (
          <Skeleton className="min-h-64 rounded-xl border border-amber-200/60 dark:border-amber-900/40" />
        ) : (
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(470, ready)}>
            <RecentActivity
              className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20"
              items={
                activityItems.length
                  ? activityItems
                  : [{ id: 'empty', title: 'No activity yet', meta: 'Generate an invoice', status: 'pending' as const }]
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
