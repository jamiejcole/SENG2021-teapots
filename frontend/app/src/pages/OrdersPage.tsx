import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileEdit, Package, Plus } from 'lucide-react'
import { listOrders, type StoredOrderSummary } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'

const statusTone: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800',
  created: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50',
  fulfilled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50',
  partially_fulfilled: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50',
}

export function OrdersPage() {
  const [rows, setRows] = useState<StoredOrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const res = await listOrders()
        if (!c) setRows(res.orders ?? [])
      } catch (e) {
        toast.error('Could not load orders', { description: e instanceof ApiError ? e.message : 'Error' })
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <Package className="size-3.5" />
            UBL orders
          </div>
          <h1 className="font-display text-3xl tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage UBL 2.x orders stored for your account. Use an order when generating invoices or despatch.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500">
          <Link to="/orders/create" className="inline-flex items-center gap-2">
            <Plus className="size-4" /> New order
          </Link>
        </Button>
      </div>

      <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base">All orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders yet.{' '}
              <Link to="/orders/create" className="font-medium text-amber-700 underline dark:text-amber-400">
                Create one
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((o) => (
                <Link
                  key={o._id}
                  to={`/orders/${encodeURIComponent(o._id)}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/80 px-4 py-3 transition-colors hover:border-amber-400 dark:border-amber-900/40 dark:bg-slate-900/50"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{o.orderId}</span>
                      <Badge className={statusTone[o.orderStatus] ?? 'bg-muted'}>{o.orderStatus}</Badge>
                      <span className="text-xs text-muted-foreground">UBL {o.status}</span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.buyer.name} · {o.seller.name} · {o.currency}{' '}
                      {o.totals?.payableAmount != null ? `· ${o.totals.payableAmount}` : ''}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                    Open <FileEdit className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/orders/create"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            New order <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
