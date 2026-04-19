import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Mail, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { SparkArea } from '@/components/dashboard/SparkArea'
import { RecentActivity, type ActivityItem } from '@/components/dashboard/RecentActivity'
import { DeliveryGauge } from '@/components/dashboard/DeliveryGauge'
import { DocDistribution } from '@/components/dashboard/DocDistribution'
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
      row.type === 'SEND_FAILED'
        ? 'failed'
        : row.type === 'SENT' || row.type === 'VALIDATED'
          ? 'success'
          : 'pending'
    const invId = row.invoiceId.length > 24 ? `${row.invoiceId.slice(0, 22)}…` : row.invoiceId
    return {
      id: row.id,
      title: row.message,
      meta: `${invId} · ${relMeta(row.at)}`,
      status,
      activityType: row.type,
      to: row.invoiceMongoId ? `/invoices/${row.invoiceMongoId}` : undefined,
    }
  })
}

function floatStyle(ms: number, ready: boolean): CSSProperties | undefined {
  if (!ready) return undefined
  return { animationDelay: `${ms}ms` }
}

const EMPTY_STATS: DashboardStats = {
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
        if (!cancelled) setStats(EMPTY_STATS)
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
    <div className="w-full space-y-6">
      {/* Page header */}
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
          Metrics from invoices stored for your account — lifecycle, sends, and recent events.
        </p>
      </div>

      {/* ── Row 1: 4 KPI cards ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue tracked */}
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(60, ready)}>
            <StatCard
              label="Revenue tracked"
              value={formatAud(stats!.revenueTotal)}
              change="Sum of payable amounts (AUD)"
              tone="positive"
              icon={Coins}
            />
          </div>

          {/* Invoices sent */}
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(120, ready)}>
            <StatCard
              label="Invoices sent"
              value={String(stats!.sentCount)}
              change="Successful email deliveries"
              tone="positive"
              icon={Mail}
            />
          </div>

          {/* Invoices validated */}
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(180, ready)}>
            <StatCard
              label="Invoices validated"
              value={String(stats!.validatedCount)}
              change={`${stats!.pendingCount} draft / saved`}
              tone="positive"
              icon={ShieldCheck}
            />
          </div>

          {/* Validation progress — replaces "Failed Sends" */}
          <div className={cn(ready && 'dashboard-float-in')} style={floatStyle(240, ready)}>
            <StatCard
              label="Validation progress"
              value={`${stats!.validatedCount} / ${stats!.totalInvoices}`}
              change={`${stats!.totalInvoices === 0 ? 0 : Math.round((stats!.validatedCount / stats!.totalInvoices) * 100)}% validated`}
              progress={
                stats!.totalInvoices === 0
                  ? 0
                  : (stats!.validatedCount / stats!.totalInvoices) * 100
              }
              tone="neutral"
              icon={TrendingUp}
            />
          </div>
        </div>
      )}

      {/* ── Row 2: Revenue chart (2 cols) + Doc distribution (1 col) + Gauge (1 col) ── */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Revenue trend — dominant visual */}
        {loading ? (
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        ) : (
          <Card
            className={cn(
              'lg:col-span-2',
              'border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30',
              'dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20',
              ready && 'dashboard-float-in',
            )}
            style={floatStyle(300, ready)}
          >
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base">Revenue trend</CardTitle>
                <CardDescription>Daily payable totals (AUD) — last 14 days</CardDescription>
              </div>
              <Button variant="secondary" size="sm" className="rounded-full" asChild>
                <Link to="/invoices">View invoices</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              <SparkArea series={throughputSeries} />
            </CardContent>
          </Card>
        )}

        {/* Document distribution */}
        {loading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <div
            className={cn(ready && 'dashboard-float-in')}
            style={floatStyle(350, ready)}
          >
            <DocDistribution
              invoices={stats!.totalInvoices}
              orders={stats!.totalOrders ?? 0}
              despatches={stats!.totalDespatches ?? 0}
              className="h-full"
            />
          </div>
        )}

        {/* Delivery success gauge */}
        {loading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <div
            className={cn(ready && 'dashboard-float-in')}
            style={floatStyle(400, ready)}
          >
            <DeliveryGauge
              sentCount={stats!.sentCount}
              failedSendCount={stats!.failedSendCount}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* ── Row 3: Recent activity (full width) ── */}
      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <div
          className={cn(ready && 'dashboard-float-in')}
          style={floatStyle(450, ready)}
        >
          <RecentActivity
            description="Latest invoice events — click a row to open the invoice"
            fullActivityHref="/invoices"
            items={
              activityItems.length
                ? activityItems
                : [
                    {
                      id: 'empty',
                      title: 'No activity yet',
                      meta: 'Generate an invoice to see events here',
                      status: 'pending' as const,
                    },
                  ]
            }
          />
        </div>
      )}
    </div>
  )
}
