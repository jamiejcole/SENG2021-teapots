import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Mail, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DUMMY_INVOICES = [
  { id: '1', invoiceId: 'INV-001', orderId: 'ORDER-1', buyer: { name: 'Acme Corp', email: 'billing@acme.com', city: 'Sydney', country: 'AU' }, amount: 1234.56, currency: 'AUD', sentAt: '2h ago' },
  { id: '2', invoiceId: 'INV-002', orderId: 'ORDER-2', buyer: { name: 'TechStart Pty Ltd', email: 'accounts@techstart.io', city: 'Melbourne', country: 'AU' }, amount: 892.00, currency: 'AUD', sentAt: '5h ago' },
  { id: '3', invoiceId: 'INV-003', orderId: 'ORDER-3', buyer: { name: 'Global Supplies Inc', email: 'finance@globalsupplies.com', city: 'Brisbane', country: 'AU' }, amount: 4567.89, currency: 'AUD', sentAt: '1d ago' },
  { id: '4', invoiceId: 'INV-004', orderId: 'ORDER-4', buyer: { name: 'Metro Retail', email: 'ap@metroretail.com.au', city: 'Perth', country: 'AU' }, amount: 234.50, currency: 'AUD', sentAt: '2d ago' },
]

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'AUD' }).format(amount)
}

export function InvoiceHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <FileText className="size-3.5" />
            Invoice history
          </div>
          <h1 className="font-display text-3xl tracking-tight">Invoice history</h1>
          <p className="text-sm text-muted-foreground">Invoices sent and the people they were sent to.</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
        >
          Generate invoice <ArrowRight className="size-4" />
        </Link>
      </div>

      <Card className="overflow-hidden border-amber-200/60 bg-gradient-to-br from-white via-amber-50/30 to-amber-50/50 dark:border-amber-900/40 dark:from-slate-900 dark:via-amber-950/20 dark:to-amber-950/30">
        <CardHeader>
          <CardTitle className="text-base">Sent invoices</CardTitle>
          <p className="text-sm text-muted-foreground">Invoices sent and recipients</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DUMMY_INVOICES.map((inv) => (
              <div
                key={inv.id}
                className="group flex items-center gap-4 rounded-xl border border-amber-200/60 bg-white/80 px-4 py-3 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/40 dark:bg-slate-800/50 dark:hover:border-amber-800/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{inv.invoiceId}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      Order {inv.orderId}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                      <Mail className="size-3.5" />
                      {inv.buyer.name}
                    </span>
                    <span className="truncate">{inv.buyer.email}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {inv.buyer.city}, {inv.buyer.country}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatAmount(inv.amount, inv.currency)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{inv.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
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
