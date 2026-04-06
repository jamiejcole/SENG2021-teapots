import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ExternalLink, Mail, Package, RefreshCw, Truck, X, XCircle } from 'lucide-react'
import { listOrders, getOrder, type StoredOrderSummary } from '@/api/orders'
import {
  createDespatch,
  listDespatches,
  retrieveDespatch,
  cancelOrderApi,
  listCancelledOrdersApi,
  cancelFulfilmentApi,
  listFulfilmentCancelledApi,
  sendDespatchEmail,
  type DespatchRecord,
} from '@/api/despatch'
import { DespatchForm, defaultDespatchPayload, despatchPayloadFromOrder } from '@/components/despatch/DespatchForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'
import type { CreateDespatchPayload } from '@/types/despatch'
import { cn } from '@/lib/utils'

const despatchTone: Record<string, string> = {
  not_despatched: 'bg-slate-100 text-slate-700 dark:bg-slate-800',
  despatched: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50',
  partially_despatched: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50',
  fulfilment_cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50',
}

const orderTone: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800',
  created: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50',
  fulfilled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50',
  partially_fulfilled: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50',
}

function RecordRow({
  title,
  subtitle,
  badge,
  badgeClass,
  onClick,
  action,
}: {
  title: string
  subtitle: string
  badge: string
  badgeClass: string
  onClick?: () => void
  action?: ReactNode
}) {
  const inner = (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/80 px-4 py-3 dark:border-amber-900/40 dark:bg-slate-900/50',
        onClick && 'cursor-pointer hover:border-amber-400',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{title}</span>
          <Badge className={badgeClass}>{badge}</Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action ? <div onClick={(e) => e.stopPropagation()}>{action}</div> : null}
    </div>
  )
  return inner
}

export function DespatchPage() {
  const [searchParams] = useSearchParams()
  const qpOrderId = searchParams.get('orderId')?.trim() ?? ''

  const [payload, setPayload] = useState<CreateDespatchPayload>(() => defaultDespatchPayload())
  const [orders, setOrders] = useState<StoredOrderSummary[]>([])
  const [activeDespatches, setActiveDespatches] = useState<DespatchRecord[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<StoredOrderSummary[]>([])
  const [fulfilmentCancelled, setFulfilmentCancelled] = useState<DespatchRecord[]>([])

  const [loadingLists, setLoadingLists] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applyKey, setApplyKey] = useState<string>('') // mongo id of order to fill form from
  const [sheet, setSheet] = useState<{ open: boolean; record: DespatchRecord | null }>({ open: false, record: null })
  const [despatchEmailTo, setDespatchEmailTo] = useState('')
  const [despatchEmailSending, setDespatchEmailSending] = useState(false)
  const [cancelOrderPick, setCancelOrderPick] = useState('')
  const [cancelDespatchPick, setCancelDespatchPick] = useState('')

  useEffect(() => {
    const r = sheet.record
    if (!r) {
      setDespatchEmailTo('')
      return
    }
    setDespatchEmailTo(r.deliveryParty.email?.trim() ?? '')
  }, [sheet.record])

  const openOrders = useMemo(() => orders.filter((o) => o.orderStatus !== 'cancelled'), [orders])

  const refreshAll = useCallback(async () => {
    setLoadingLists(true)
    try {
      const [o, a, c, f] = await Promise.all([
        listOrders(),
        listDespatches(true),
        listCancelledOrdersApi(),
        listFulfilmentCancelledApi(),
      ])
      setOrders(o.orders ?? [])
      setActiveDespatches(a.despatches ?? [])
      setCancelledOrders(c.orders ?? [])
      setFulfilmentCancelled(f.despatches ?? [])
    } catch (e) {
      toast.error('Could not load despatch data', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setLoadingLists(false)
    }
  }, [])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  /** Deep-link: ?orderId= — fill form from that business order id once orders are loaded */
  useEffect(() => {
    if (!qpOrderId || !orders.length) return
    const row = orders.find((x) => x.orderId === qpOrderId)
    if (!row) return
    let c = false
    ;(async () => {
      try {
        const full = await getOrder(row._id)
        if (c) return
        const fromOrder = despatchPayloadFromOrder(full)
        setPayload((p) => ({
          ...defaultDespatchPayload(),
          ...fromOrder,
          despatchDate: p.despatchDate,
          despatchStatus: p.despatchStatus ?? 'despatched',
        }))
        setApplyKey(row._id)
        toast.success('Form filled from order', { description: full.orderId })
      } catch (e) {
        toast.error('Could not load order for prefill', { description: e instanceof ApiError ? e.message : '' })
      }
    })()
    return () => {
      c = true
    }
  }, [qpOrderId, orders])

  async function applySelectedOrder() {
    if (!applyKey) {
      toast.error('Pick an order to apply')
      return
    }
    try {
      const full = await getOrder(applyKey)
      const fromOrder = despatchPayloadFromOrder(full)
      setPayload((p) => ({ ...defaultDespatchPayload(), ...fromOrder, despatchDate: p.despatchDate }))
      toast.success('Applied order to form', { description: full.orderId })
    } catch (e) {
      toast.error('Could not load order', { description: e instanceof ApiError ? e.message : '' })
    }
  }

  async function onCreateDespatch() {
    setSaving(true)
    try {
      await createDespatch(payload)
      toast.success('Despatch created')
      setPayload(defaultDespatchPayload())
      await refreshAll()
    } catch (e) {
      toast.error('Create failed', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setSaving(false)
    }
  }

  async function openDespatchDetail(d: DespatchRecord) {
    try {
      const fresh = await retrieveDespatch(d.despatchId)
      setSheet({ open: true, record: fresh })
    } catch (e) {
      toast.error('Could not open despatch', { description: e instanceof ApiError ? e.message : '' })
    }
  }

  async function onCancelOrder() {
    const orderId = cancelOrderPick.trim()
    if (!orderId) {
      toast.error('Select an order to cancel')
      return
    }
    if (!window.confirm(`Cancel order ${orderId}? This cannot be undone.`)) return
    try {
      await cancelOrderApi(orderId)
      toast.success('Order cancelled')
      setCancelOrderPick('')
      await refreshAll()
    } catch (e) {
      toast.error('Cancel order failed', { description: e instanceof ApiError ? e.message : '' })
    }
  }

  async function onCancelFulfilment() {
    const despatchId = cancelDespatchPick.trim()
    if (!despatchId) {
      toast.error('Select a despatch')
      return
    }
    if (!window.confirm(`Mark fulfilment cancelled for ${despatchId}?`)) return
    try {
      await cancelFulfilmentApi(despatchId)
      toast.success('Fulfilment cancelled')
      setCancelDespatchPick('')
      await refreshAll()
    } catch (e) {
      toast.error('Cancel fulfilment failed', { description: e instanceof ApiError ? e.message : '' })
    }
  }

  function orderHref(orderId: string) {
    const hit = orders.find((x) => x.orderId === orderId)
    return hit ? `/orders/${hit._id}` : '/orders'
  }

  async function onSendDespatchEmail() {
    const id = sheet.record?.despatchId
    if (!id) return
    const to = despatchEmailTo.trim()
    if (!to) {
      toast.error('Enter recipient email')
      return
    }
    setDespatchEmailSending(true)
    try {
      const res = await sendDespatchEmail(id, to)
      toast.success('Despatch email sent', { description: `Sent to ${res.to}` })
    } catch (e) {
      toast.error('Email failed', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setDespatchEmailSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <Truck className="size-3.5" />
            Fulfilment
          </div>
          <h1 className="font-display text-3xl tracking-tight">Despatch</h1>
          <p className="text-sm text-muted-foreground">
            Record shipments against UBL orders, inspect active despatches, and manage order or fulfilment cancellation.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-amber-300"
          disabled={loadingLists}
          onClick={() => void refreshAll()}
        >
          <RefreshCw className={cn('size-4', loadingLists && 'animate-spin')} /> Refresh
        </Button>
      </div>

      <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Create despatch</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference an existing order by its Order ID. Pull buyer/seller and lines from the order, then adjust shipment
              details.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Load from order</label>
              <select
                className="flex h-9 min-w-[200px] rounded-lg border border-input bg-background px-3 text-sm"
                value={applyKey}
                onChange={(e) => setApplyKey(e.target.value)}
              >
                <option value="">Select…</option>
                {openOrders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.orderId} · {o.orderStatus}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={() => void applySelectedOrder()}>
              Apply to form
            </Button>
            <Button type="button" size="sm" variant="ghost" asChild className="rounded-lg">
              <Link to="/orders">
                <Package className="mr-1 inline size-4" /> Orders
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DespatchForm payload={payload} onChange={setPayload} />
          <Button
            className="gap-2 bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
            disabled={saving}
            onClick={() => void onCreateDespatch()}
          >
            <CheckCircle2 className="size-4" />
            {saving ? 'Creating…' : 'Create despatch'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-amber-200/60 dark:border-amber-900/40 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Active despatch records</CardTitle>
            <p className="text-sm text-muted-foreground">Excludes fulfilment-cancelled. Click a row for detail.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingLists ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : activeDespatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active despatches yet.</p>
            ) : (
              activeDespatches.map((d) => (
                <RecordRow
                  key={d._id}
                  title={d.despatchId}
                  subtitle={`Order ${d.orderId} · ${d.despatchDate} · ${d.carrierName || '—'}`}
                  badge={d.despatchStatus}
                  badgeClass={despatchTone[d.despatchStatus] ?? 'bg-muted'}
                  onClick={() => void openDespatchDetail(d)}
                  action={
                    <Button variant="outline" size="sm" className="rounded-lg" asChild onClick={(e) => e.stopPropagation()}>
                      <Link to={orderHref(d.orderId)}>
                        Order <ExternalLink className="ml-1 size-3" />
                      </Link>
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle className="text-base">Cancel an order</CardTitle>
            <p className="text-sm text-muted-foreground">Sets order lifecycle to cancelled for your account.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={cancelOrderPick}
              onChange={(e) => setCancelOrderPick(e.target.value)}
            >
              <option value="">Choose order…</option>
              {openOrders.map((o) => (
                <option key={o._id} value={o.orderId}>
                  {o.orderId} ({o.orderStatus})
                </option>
              ))}
            </select>
            <Button type="button" variant="destructive" size="sm" className="w-full rounded-lg" onClick={() => void onCancelOrder()}>
              <XCircle className="mr-1 size-4" /> Cancel order
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 dark:border-amber-900/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cancel fulfilment</CardTitle>
            <p className="text-sm text-muted-foreground">Marks a despatch as fulfilment_cancelled without deleting it.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Active despatch</label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={cancelDespatchPick}
                onChange={(e) => setCancelDespatchPick(e.target.value)}
              >
                <option value="">Choose…</option>
                {activeDespatches.map((d) => (
                  <option key={d._id} value={d.despatchId}>
                    {d.despatchId} · order {d.orderId}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" className="border-red-300 text-red-700" onClick={() => void onCancelFulfilment()}>
              Cancel fulfilment
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 dark:border-amber-900/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cancelled orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingLists ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : cancelledOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              cancelledOrders.map((o) => (
                <RecordRow
                  key={o._id}
                  title={o.orderId}
                  subtitle={`${o.buyer.name} · ${o.issueDate}`}
                  badge={o.orderStatus}
                  badgeClass={orderTone[o.orderStatus] ?? 'bg-muted'}
                  action={
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/orders/${o._id}`}>View</Link>
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle className="text-base">Cancelled fulfilments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingLists ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : fulfilmentCancelled.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              fulfilmentCancelled.map((d) => (
                <RecordRow
                  key={d._id}
                  title={d.despatchId}
                  subtitle={`Order ${d.orderId}`}
                  badge={d.despatchStatus}
                  badgeClass={despatchTone[d.despatchStatus] ?? 'bg-muted'}
                  onClick={() => void openDespatchDetail(d)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        className="max-w-2xl"
      >
        <div className="relative shrink-0 border-b border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-transparent px-5 py-4 pr-14 dark:border-amber-900/40 dark:from-amber-950/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 size-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setSheet((s) => ({ ...s, open: false }))}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
          <h2 className="break-all pr-2 text-left text-lg font-semibold leading-snug tracking-tight">
            {sheet.record?.despatchId ?? 'Despatch'}
          </h2>
        </div>
        {sheet.record ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm">
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <span className="text-muted-foreground">Order</span>
                    <Link
                      className="font-medium break-all text-amber-700 underline dark:text-amber-400"
                      to={orderHref(sheet.record.orderId)}
                    >
                      {sheet.record.orderId}
                    </Link>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={despatchTone[sheet.record.despatchStatus] ?? 'bg-muted'}>
                      {sheet.record.despatchStatus}
                    </Badge>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground">Date</span>
                    <span>{sheet.record.despatchDate}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground">Carrier / tracking</span>
                    <span className="break-words">
                      {sheet.record.carrierName || '—'} / {sheet.record.trackingId || '—'}
                    </span>
                  </div>
                  {sheet.record.notes ? (
                    <div className="grid gap-1">
                      <span className="text-muted-foreground">Notes</span>
                      <span className="whitespace-pre-wrap break-words">{sheet.record.notes}</span>
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-border/80 p-3">
                    <div className="font-medium">Supplier</div>
                    <p className="mt-1 break-words text-muted-foreground">{sheet.record.supplierParty.name}</p>
                    <p className="break-words text-xs text-muted-foreground">
                      {sheet.record.supplierParty.address.street}, {sheet.record.supplierParty.address.city}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 p-3">
                    <div className="font-medium">Delivery party</div>
                    <p className="mt-1 break-words text-muted-foreground">{sheet.record.deliveryParty.name}</p>
                    <p className="break-words text-xs text-muted-foreground">
                      {sheet.record.deliveryParty.address.street}, {sheet.record.deliveryParty.address.city}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 font-medium">Lines</div>
                    <ul className="space-y-2">
                      {sheet.record.lines.map((l) => (
                        <li key={l.lineId} className="break-words rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                          <span className="font-semibold">{l.lineId}</span> · {l.description} · qty {l.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            </div>
            <div className="shrink-0 space-y-3 border-t border-amber-200/50 bg-muted/25 px-5 py-4 dark:border-amber-900/40">
                <Label htmlFor="despatch-email-to">Email despatch notice</Label>
                <p className="text-xs text-muted-foreground">
                  Sends an HTML + plain-text summary (despatch ID, order, carrier, lines). Uses Mailgun like invoice emails.
                </p>
                <Input
                  id="despatch-email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={despatchEmailTo}
                  onChange={(e) => setDespatchEmailTo(e.target.value)}
                  className="h-9 rounded-lg"
                />
                <Button
                  type="button"
                  className="gap-2 bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
                  disabled={despatchEmailSending}
                  onClick={() => void onSendDespatchEmail()}
                >
                  <Mail className="size-4" />
                  {despatchEmailSending ? 'Sending…' : 'Send email'}
                </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  )
}
