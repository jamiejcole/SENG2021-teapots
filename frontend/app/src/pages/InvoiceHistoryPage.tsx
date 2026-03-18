import { Link } from 'react-router-dom'
import { FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Dummy data – replace with API when ready
const DUMMY_INVOICES = [
  {
    id: '1',
    invoiceId: 'INV-001',
    orderId: 'ORDER-1',
    buyer: { name: 'Acme Corp', email: 'billing@acme.com', city: 'Sydney', country: 'AU' },
    amount: 1234.56,
    currency: 'AUD',
    sentAt: '2h ago',
  },
  {
    id: '2',
    invoiceId: 'INV-002',
    orderId: 'ORDER-2',
    buyer: { name: 'TechStart Pty Ltd', email: 'accounts@techstart.io', city: 'Melbourne', country: 'AU' },
    amount: 892.00,
    currency: 'AUD',
    sentAt: '5h ago',
  },
  {
    id: '3',
    invoiceId: 'INV-003',
    orderId: 'ORDER-3',
    buyer: { name: 'Global Supplies Inc', email: 'finance@globalsupplies.com', city: 'Brisbane', country: 'AU' },
    amount: 4567.89,
    currency: 'AUD',
    sentAt: '1d ago',
  },
  {
    id: '4',
    invoiceId: 'INV-004',
    orderId: 'ORDER-4',
    buyer: { name: 'Metro Retail', email: 'ap@metroretail.com.au', city: 'Perth', country: 'AU' },
    amount: 234.50,
    currency: 'AUD',
    sentAt: '2d ago',
  },
]

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'AUD',
  }).format(amount)
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
          <p className="text-sm text-muted-foreground">
            Invoices sent and the people they were sent to.
          </p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
        >
          Generate invoice <ArrowRight className="size-4" />
        </Link>
      </div>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Sent invoices</CardTitle>
          <p className="text-sm text-muted-foreground">Invoices sent and recipients</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DUMMY_INVOICES.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{inv.invoiceId}</span>
                    <span className="text-xs text-muted-foreground">
                      Order {inv.orderId}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{inv.buyer.name}</span>
                    <span className="truncate">{inv.buyer.email}</span>
                    <span>
                      {inv.buyer.city}, {inv.buyer.country}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatAmount(inv.amount, inv.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">{inv.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/generate"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
          >
            Generate invoice <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
