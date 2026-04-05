import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Mail, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listStoredInvoices, type StoredInvoiceSummary } from '@/api/invoices'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { useInvoiceSearch } from '@/context/InvoiceSearchContext'

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'AUD' }).format(amount)
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function invoiceMatches(inv: StoredInvoiceSummary, q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  const parts = [
    inv.invoiceId,
    inv.buyer.name,
    inv.buyer.email ?? '',
    inv.seller.name,
    inv.seller.email ?? '',
    inv.orderReference?.orderId ?? '',
    inv.buyer.address.city,
    inv.buyer.address.country,
  ]
  const hay = parts.join(' ').toLowerCase()
  return hay.includes(s)
}

const statusTone: Record<string, string> = {
  SENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  VALIDATED: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
  SAVED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  SEND_FAILED: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  OVERDUE: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100',
}

export function InvoiceHistoryPage() {
  const [rows, setRows] = useState<StoredInvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const { invoiceSearch } = useInvoiceSearch()

  const filtered = useMemo(
    () => rows.filter((inv) => invoiceMatches(inv, invoiceSearch)),
    [rows, invoiceSearch],
  )

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const res = await listStoredInvoices()
        if (!c) setRows(res.invoices ?? [])
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Failed to load'
        toast.error('Could not load invoices', { description: msg })
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
            <FileText className="size-3.5" />
            Invoice history
          </div>
          <h1 className="font-display text-3xl tracking-tight">Stored invoices</h1>
          <p className="text-sm text-muted-foreground">
            Invoices saved to your account with lifecycle and delivery status. Use the top search bar to filter by customer
            name, email, invoice ID, or order ID.
          </p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
        >
          New invoice <ArrowRight className="size-4" />
        </Link>
      </div>

      <Card className="overflow-hidden border-amber-200/60 bg-gradient-to-br from-white via-amber-50/30 to-amber-50/50 dark:border-amber-900/40 dark:from-slate-900 dark:via-amber-950/20 dark:to-amber-950/30">
        <CardHeader>
          <CardTitle className="text-base">Your invoices</CardTitle>
          <p className="text-sm text-muted-foreground">Open an invoice to edit supplement data, validate, PDF, or resend.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stored invoices yet.{' '}
              <Link to="/generate" className="font-medium text-amber-700 underline dark:text-amber-400">
                Generate one
              </Link>
              .
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices match “{invoiceSearch.trim()}”. Clear the search field or try another name, email, or ID.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((inv) => {
                const mongoId = String(inv._id)
                const orderId = inv.orderReference?.orderId ?? '—'
                return (
                  <Link
                    key={mongoId}
                    to={`/invoices/${mongoId}`}
                    className="group flex items-center gap-4 rounded-xl border border-amber-200/60 bg-white/80 px-4 py-3 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/40 dark:bg-slate-800/50 dark:hover:border-amber-800/60"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{inv.invoiceId}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          Order {orderId}
                        </span>
                        <Badge
                          variant="secondary"
                          className={statusTone[inv.lifecycleStatus] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800'}
                        >
                          {inv.lifecycleStatus}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                          <Mail className="size-3.5" />
                          {inv.buyer.name}
                        </span>
                        <span className="truncate">{inv.buyer.email ?? '—'}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {inv.buyer.address.city}, {inv.buyer.address.country}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatAmount(inv.totals.payableAmount, inv.currency)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {inv.sentAt ? `Sent ${formatWhen(inv.sentAt)}` : `Updated ${formatWhen(inv.updatedAt)}`}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <Link
            to="/generate"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-3 text-sm font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:border-amber-600 dark:hover:bg-amber-950/30"
          >
            Generate invoice <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
