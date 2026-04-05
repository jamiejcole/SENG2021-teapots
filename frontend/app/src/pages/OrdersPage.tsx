import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Copy,
  Download,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import {
  createDespatchAdvice,
  type CreateDespatchResponse,
} from '@/api/despatch'
import {
  deleteOrder,
  getOrderXml,
  listOrders,
  type OrderListItem,
} from '@/api/orders'
import { validateOrder } from '@/api/invoices'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function XmlModal({
  xml,
  title,
  onClose,
}: {
  xml: string
  title: string
  onClose: () => void
}) {
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(xml)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed')
    }
  }

  function download() {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'order.xml'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-2xl dark:border-amber-900/40 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">{title}</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {xml}
        </pre>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
            onClick={() => void copyToClipboard()}
          >
            <Copy className="size-3.5" /> Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
            onClick={download}
          >
            <Download className="size-3.5" /> Download
          </Button>
          <Button
            size="sm"
            className="ml-auto gap-1.5 rounded-lg bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [xmlModal, setXmlModal] = useState<{ xml: string; title: string } | null>(null)
  const [despatchingId, setDespatchingId] = useState<string | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listOrders()
      setOrders(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load orders'
      toast.error('Failed to load orders', { description: msg })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onDelete(id: string, label: string) {
    setDeletingId(id)
    try {
      await deleteOrder(id)
      toast.success(`Order ${label} deleted`)
      setOrders((prev) => prev.filter((o) => o._id !== id))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed'
      toast.error('Delete failed', { description: msg })
    } finally {
      setDeletingId(null)
    }
  }

  async function onViewXml(orderId: string, label: string) {
    try {
      const xml = await getOrderXml(orderId)
      setXmlModal({ xml, title: `Order XML – ${label}` })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load XML'
      toast.error('Failed to load order XML', { description: msg })
    }
  }

  async function onValidate(orderId: string, label: string) {
    setValidatingId(orderId)
    try {
      const xml = await getOrderXml(orderId)
      await validateOrder(xml)
      toast.success(`Order ${label} is valid`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Validation failed'
      toast.error('Validation failed', { description: msg })
    } finally {
      setValidatingId(null)
    }
  }

  async function onCreateDespatch(orderId: string, label: string) {
    setDespatchingId(orderId)
    try {
      const xml = await getOrderXml(orderId)
      const result: CreateDespatchResponse = await createDespatchAdvice(xml)
      toast.success(`Despatch advice created for ${label}`, {
        description: `Advice ID: ${result.adviceIds[0]}`,
      })
      navigate('/despatch')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create despatch advice'
      toast.error('Despatch creation failed', { description: msg })
    } finally {
      setDespatchingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {xmlModal && (
        <XmlModal xml={xmlModal.xml} title={xmlModal.title} onClose={() => setXmlModal(null)} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <Package className="size-3.5" />
            Orders
          </div>
          <h1 className="font-display text-3xl tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage your UBL orders. Create despatch advice or generate invoices from any order.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
            onClick={() => void load()}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <button
            onClick={() => navigate('/generate')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
          >
            <Plus className="size-4" />
            New order
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border-amber-200/60 bg-gradient-to-br from-white via-amber-50/30 to-amber-50/50 dark:border-amber-900/40 dark:from-slate-900 dark:via-amber-950/20 dark:to-amber-950/30">
        <CardHeader>
          <CardTitle className="text-base">Your orders</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <Package className="size-10 opacity-30" />
              <div>
                <p className="font-medium">No orders yet</p>
                <p className="text-sm">Generate an invoice to create your first order.</p>
              </div>
              <button
                onClick={() => navigate('/generate')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
              >
                Generate invoice <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="group flex flex-col gap-3 rounded-xl border border-amber-200/60 bg-white/80 px-4 py-3 shadow-sm transition-all hover:border-amber-300 hover:shadow-md sm:flex-row sm:items-center dark:border-amber-900/40 dark:bg-slate-800/50 dark:hover:border-amber-800/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow">
                    <Package className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {order.orderId}
                      </span>
                      <Badge
                        variant="secondary"
                        className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                      >
                        {order.status}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                      >
                        {order.currency}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {order.buyer?.name ?? 'Unknown buyer'}
                        </span>
                        {' → '}
                        {order.seller?.name ?? 'Unknown seller'}
                      </span>
                      <span className="text-xs">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-lg border-amber-300 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                      onClick={() => void onViewXml(order._id, order.orderId)}
                    >
                      <Download className="size-3.5" /> XML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-lg border-amber-300 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                      onClick={() => void onValidate(order._id, order.orderId)}
                      disabled={validatingId === order._id}
                    >
                      <ShieldCheck className="size-3.5" />
                      {validatingId === order._id ? '…' : 'Validate'}
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1 rounded-lg bg-amber-400 text-xs font-semibold text-slate-900 shadow shadow-amber-400/25 hover:bg-amber-500"
                      onClick={() => void onCreateDespatch(order._id, order.orderId)}
                      disabled={despatchingId === order._id}
                    >
                      <Truck className="size-3.5" />
                      {despatchingId === order._id ? 'Creating…' : 'Despatch'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() => void onDelete(order._id, order.orderId)}
                      disabled={deletingId === order._id}
                    >
                      <Trash2 className="size-3.5" />
                      {deletingId === order._id ? '…' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && orders.length > 0 && (
            <button
              onClick={() => navigate('/generate')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-3 text-sm font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:border-amber-600 dark:hover:bg-amber-950/30"
            >
              Generate invoice <ArrowRight className="size-4" />
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
