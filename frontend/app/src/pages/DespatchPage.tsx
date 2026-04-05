import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Ban,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Package,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react'
import {
  cancelFulfilment,
  cancelOrder,
  getFulfilmentCancellation,
  getOrderCancellation,
  listDespatchAdvices,
  retrieveDespatchAdvice,
  type DespatchAdviceItem,
  type FulfilmentCancellationResponse,
  type OrderCancellationResponse,
} from '@/api/despatch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'

function formatUnixDate(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts * 1000))
  } catch {
    return String(ts)
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
    a.download = 'despatch-advice.xml'
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

function CancelOrderModal({
  adviceId,
  onClose,
  onSuccess,
}: {
  adviceId: string
  onClose: () => void
  onSuccess: (result: OrderCancellationResponse) => void
}) {
  const [cancellationDoc, setCancellationDoc] = useState(
    `<OrderCancellation>\n  <AdviceID>${adviceId}</AdviceID>\n  <Reason>Cancellation requested</Reason>\n</OrderCancellation>`
  )
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit() {
    if (!cancellationDoc.trim()) return
    setIsLoading(true)
    try {
      const result = await cancelOrder(adviceId, cancellationDoc)
      onSuccess(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cancellation failed'
      toast.error('Cancellation failed', { description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-2xl dark:border-amber-900/40 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">Cancel Order</span>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-2">
          <Label>Cancellation Document XML</Label>
          <Textarea
            value={cancellationDoc}
            onChange={(e) => setCancellationDoc(e.target.value)}
            className="min-h-32 rounded-xl font-mono text-xs"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-red-500 text-white hover:bg-red-600"
            onClick={() => void onSubmit()}
            disabled={isLoading || !cancellationDoc.trim()}
          >
            {isLoading ? 'Cancelling…' : 'Confirm cancel order'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CancelFulfilmentModal({
  adviceId,
  onClose,
  onSuccess,
}: {
  adviceId: string
  onClose: () => void
  onSuccess: (result: FulfilmentCancellationResponse) => void
}) {
  const [reason, setReason] = useState('Unable to fulfil delivery window')
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit() {
    if (!reason.trim()) return
    setIsLoading(true)
    try {
      const result = await cancelFulfilment(adviceId, reason)
      onSuccess(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fulfilment cancellation failed'
      toast.error('Fulfilment cancellation failed', { description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-amber-200/60 bg-white p-6 shadow-2xl dark:border-amber-900/40 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold">Cancel Fulfilment</span>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-2">
          <Label>Cancellation Reason</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg"
            placeholder="Enter reason…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => void onSubmit()}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Cancelling…' : 'Confirm cancel fulfilment'}
          </Button>
        </div>
      </div>
    </div>
  )
}

type DespatchRowProps = {
  item: DespatchAdviceItem
  onViewXml: (adviceId: string) => void
}

function DespatchRow({ item, onViewXml }: DespatchRowProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [cancelOrderModal, setCancelOrderModal] = useState(false)
  const [cancelFulfilmentModal, setCancelFulfilmentModal] = useState(false)
  const [orderCancellation, setOrderCancellation] = useState<OrderCancellationResponse | null>(null)
  const [fulfilmentCancellation, setFulfilmentCancellation] =
    useState<FulfilmentCancellationResponse | null>(null)
  const [isLoadingCancellations, setIsLoadingCancellations] = useState(false)

  async function onExpand() {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    if (nextExpanded && orderCancellation === null && fulfilmentCancellation === null) {
      setIsLoadingCancellations(true)
      const [oc, fc] = await Promise.all([
        getOrderCancellation(item['advice-id']),
        getFulfilmentCancellation(item['advice-id']),
      ])
      setOrderCancellation(oc)
      setFulfilmentCancellation(fc)
      setIsLoadingCancellations(false)
    }
  }

  const shortId = item['advice-id'].slice(0, 8) + '…'

  return (
    <div className="rounded-xl border border-amber-200/60 bg-white/80 shadow-sm dark:border-amber-900/40 dark:bg-slate-800/50">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow">
          <Truck className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100"
              title={item['advice-id']}
            >
              {shortId}
            </span>
            {orderCancellation && (
              <Badge variant="destructive" className="rounded text-xs">
                Order cancelled
              </Badge>
            )}
            {fulfilmentCancellation && (
              <Badge
                variant="secondary"
                className="rounded bg-orange-100 text-xs text-orange-800 dark:bg-orange-950/50 dark:text-orange-200"
              >
                Fulfilment cancelled
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatUnixDate(item['executed-at'])}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-amber-300 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
            onClick={() => onViewXml(item['advice-id'])}
          >
            <Download className="size-3.5" /> XML
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1 rounded-lg bg-amber-400 text-xs font-semibold text-slate-900 shadow-sm shadow-amber-400/25 hover:bg-amber-500"
            onClick={() =>
              navigate('/generate', { state: { despatchAdviceId: item['advice-id'] } })
            }
          >
            <ArrowRight className="size-3.5" /> Invoice
          </Button>
          <button
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => void onExpand()}
            aria-label="Expand row"
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-amber-200/60 px-4 py-3 dark:border-amber-900/40">
          {isLoadingCancellations ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cancellations
              </p>

              {orderCancellation ? (
                <div className="rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/20">
                  <span className="font-medium text-red-700 dark:text-red-400">
                    Order cancelled:
                  </span>{' '}
                  {orderCancellation['order-cancellation-reason']}
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ID: {orderCancellation['order-cancellation-id']}
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg border-red-300 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                  onClick={() => setCancelOrderModal(true)}
                >
                  <Ban className="size-3.5" /> Cancel order
                </Button>
              )}

              {fulfilmentCancellation ? (
                <div className="rounded-lg bg-orange-50 p-3 text-sm dark:bg-orange-950/20">
                  <span className="font-medium text-orange-700 dark:text-orange-400">
                    Fulfilment cancelled:
                  </span>{' '}
                  {fulfilmentCancellation['fulfilment-cancellation-reason']}
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ID: {fulfilmentCancellation['fulfilment-cancellation-id']}
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg border-orange-300 text-xs text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400"
                  onClick={() => setCancelFulfilmentModal(true)}
                >
                  <Ban className="size-3.5" /> Cancel fulfilment
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {cancelOrderModal && (
        <CancelOrderModal
          adviceId={item['advice-id']}
          onClose={() => setCancelOrderModal(false)}
          onSuccess={(result) => {
            setOrderCancellation(result)
            setCancelOrderModal(false)
            toast.success('Order cancellation recorded', {
              description: result['order-cancellation-reason'],
            })
          }}
        />
      )}

      {cancelFulfilmentModal && (
        <CancelFulfilmentModal
          adviceId={item['advice-id']}
          onClose={() => setCancelFulfilmentModal(false)}
          onSuccess={(result) => {
            setFulfilmentCancellation(result)
            setCancelFulfilmentModal(false)
            toast.success('Fulfilment cancellation recorded', {
              description: result['fulfilment-cancellation-reason'],
            })
          }}
        />
      )}
    </div>
  )
}

export function DespatchPage() {
  const navigate = useNavigate()
  const [advices, setAdvices] = useState<DespatchAdviceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [xmlModal, setXmlModal] = useState<{ xml: string; title: string } | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listDespatchAdvices()
      setAdvices(data.results)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load despatch advices'
      toast.error('Failed to load despatch advices', { description: msg })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onViewXml(adviceId: string) {
    try {
      const data = await retrieveDespatchAdvice(adviceId)
      setXmlModal({
        xml: data['despatch-advice'],
        title: `Despatch Advice XML – ${adviceId.slice(0, 8)}…`,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load despatch XML'
      toast.error('Failed to load despatch advice XML', { description: msg })
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
            <Truck className="size-3.5" />
            Despatch Advice
          </div>
          <h1 className="font-display text-3xl tracking-tight">Despatch Advice</h1>
          <p className="text-sm text-muted-foreground">
            View and manage despatch advices. Proceed to invoice or manage cancellations.
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
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
          >
            <Package className="size-4" />
            View orders
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border-amber-200/60 bg-gradient-to-br from-white via-amber-50/30 to-amber-50/50 dark:border-amber-900/40 dark:from-slate-900 dark:via-amber-950/20 dark:to-amber-950/30">
        <CardHeader>
          <CardTitle className="text-base">Despatch advices</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading…'
              : `${advices.length} advice${advices.length !== 1 ? 's' : ''}`}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : advices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <Truck className="size-10 opacity-30" />
              <div>
                <p className="font-medium">No despatch advices yet</p>
                <p className="text-sm">Create despatch advice from the Orders page.</p>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
              >
                Go to Orders <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {advices.map((item) => (
                <DespatchRow
                  key={item['advice-id']}
                  item={item}
                  onViewXml={(id) => void onViewXml(id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
