import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Mail,
  Package,
  RefreshCw,
  Trash2,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
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
  deleteDespatch,
  type DespatchRecord,
} from '@/api/despatch'
import { DespatchForm, defaultDespatchPayload, despatchPayloadFromOrder } from '@/components/despatch/DespatchForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BulkActionBar } from '@/components/shared/BulkActionBar'
import { RecordListItem } from '@/components/shared/RecordListItem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'
import type { CreateDespatchPayload } from '@/types/despatch'
import { cn } from '@/lib/utils'

const despatchClass: Record<string, string> = {
  not_despatched: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  despatched: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  partially_despatched: 'border-amber-300/70 bg-amber-100 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
  fulfilment_cancelled: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300',
}

const orderClass: Record<string, string> = {
  draft: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  created: 'border-sky-300/70 bg-sky-100 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300',
  cancelled: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300',
  fulfilled: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  partially_fulfilled: 'border-amber-300/70 bg-amber-100 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
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
  const [applyKey, setApplyKey] = useState<string>('')
  const [sheet, setSheet] = useState<{ open: boolean; record: DespatchRecord | null }>({ open: false, record: null })
  const [despatchEmailTo, setDespatchEmailTo] = useState('')
  const [despatchEmailSending, setDespatchEmailSending] = useState(false)
  const [cancelOrderPick, setCancelOrderPick] = useState('')
  const [cancelDespatchPick, setCancelDespatchPick] = useState('')

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)
  const [deletingSingle, setDeletingSingle] = useState(false)

  useEffect(() => {
    const r = sheet.record
    if (!r) { setDespatchEmailTo(''); return }
    setDespatchEmailTo(r.deliveryParty.email?.trim() ?? '')
  }, [sheet.record])

  const openOrders = useMemo(() => orders.filter((o) => o.orderStatus !== 'cancelled'), [orders])

  const applyOrderOptions = useMemo(
    () => [
      { value: '', label: 'Select…' },
      ...openOrders.map((o) => ({
        value: o._id,
        label: o.orderId,
        secondary: o.issueDate,
        badge: { label: o.orderStatus, className: orderClass[o.orderStatus] ?? '' },
      })),
    ],
    [openOrders],
  )

  const cancelOrderOptions = useMemo(
    () => [
      { value: '', label: 'Choose order…' },
      ...openOrders.map((o) => ({
        value: o.orderId,
        label: o.orderId,
        badge: { label: o.orderStatus, className: orderClass[o.orderStatus] ?? '' },
      })),
    ],
    [openOrders],
  )

  const cancelDespatchOptions = useMemo(
    () => [
      { value: '', label: 'Choose…' },
      ...activeDespatches.map((d) => ({
        value: d.despatchId,
        label: d.despatchId,
        secondary: `Order ${d.orderId}`,
      })),
    ],
    [activeDespatches],
  )

  const selectedOrder = useMemo(
    () => (applyKey ? orders.find((o) => o._id === applyKey) ?? null : null),
    [applyKey, orders],
  )

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

  useEffect(() => { void refreshAll() }, [refreshAll])

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
    return () => { c = true }
  }, [qpOrderId, orders])

  async function applySelectedOrder() {
    if (!applyKey) { toast.error('Pick an order to apply'); return }
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
    if (!orderId) { toast.error('Select an order to cancel'); return }
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
    if (!despatchId) { toast.error('Select a despatch'); return }
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
    if (!to) { toast.error('Enter recipient email'); return }
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

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    setDeletingBulk(true)
    const ids = [...selectedIds]
    const records = activeDespatches.filter((d) => ids.includes(d._id))
    const results = await Promise.allSettled(records.map((d) => deleteDespatch(d.despatchId)))
    const failed = results.filter((r) => r.status === 'rejected').length
    const succeeded = results.length - failed
    if (succeeded > 0) toast.success(`Deleted ${succeeded} despatch${succeeded > 1 ? 'es' : ''}`)
    if (failed > 0) toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`)
    setDeletingBulk(false)
    setBulkDeleteOpen(false)
    clearSelection()
    void refreshAll()
  }

  const handleSingleDelete = async () => {
    if (!singleDeleteId) return
    setDeletingSingle(true)
    const record = activeDespatches.find((d) => d._id === singleDeleteId)
    try {
      if (record) await deleteDespatch(record.despatchId)
      toast.success('Despatch deleted')
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(singleDeleteId); return next })
      void refreshAll()
    } catch (e) {
      toast.error('Delete failed', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setDeletingSingle(false)
      setSingleDeleteId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
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

      {/* Create despatch — side-by-side when an order is selected */}
      <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Create despatch</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an order to pre-fill buyer/seller data and line items. Adjust shipment details then create.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Load from order</label>
              <Select
                className="min-w-[200px]"
                value={applyKey}
                onValueChange={setApplyKey}
                options={applyOrderOptions}
                searchable={openOrders.length > 6}
                searchPlaceholder="Search orders…"
                placeholder="Select…"
              />
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

        <CardContent>
          {/* Side-by-side layout when order selected */}
          <div className={cn(
            'gap-6',
            selectedOrder ? 'grid lg:grid-cols-2' : '',
          )}>
            {/* Order detail panel — shown when applyKey is set */}
            {selectedOrder && (
              <div className="space-y-4 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/10 lg:sticky lg:top-24 lg:h-fit">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Order details</h3>
                  <Badge className={orderClass[selectedOrder.orderStatus] ?? ''}>{selectedOrder.orderStatus}</Badge>
                </div>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Order ID</dt>
                    <dd className="font-medium">{selectedOrder.orderId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Issue date</dt>
                    <dd>{selectedOrder.issueDate}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Buyer</dt>
                    <dd>{selectedOrder.buyer.name}</dd>
                    <dd className="text-xs text-muted-foreground">{selectedOrder.buyer.address.city}, {selectedOrder.buyer.address.country}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Seller</dt>
                    <dd>{selectedOrder.seller.name}</dd>
                  </div>
                  {selectedOrder.totals && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Total</dt>
                      <dd className="font-semibold">
                        {selectedOrder.currency} {selectedOrder.totals.payableAmount.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="mb-1 text-xs text-muted-foreground">Lines ({selectedOrder.lines.length})</dt>
                    <dd>
                      <ul className="space-y-1">
                        {selectedOrder.lines.map((l, i) => (
                          <li key={i} className="rounded-md bg-white/60 px-2 py-1 text-xs dark:bg-slate-800/40">
                            <span className="font-medium">{l.description}</span>
                            {' '}&times; {l.quantity} @ {selectedOrder.currency} {l.unitPrice}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <Link
                    to={`/orders/${selectedOrder._id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline dark:text-amber-400"
                  >
                    View full order <ExternalLink className="size-3" />
                  </Link>
                </dl>
              </div>
            )}

            {/* Despatch form */}
            <div className="space-y-4">
              <DespatchForm payload={payload} onChange={setPayload} />
              <Button
                className="gap-2 bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
                disabled={saving}
                onClick={() => void onCreateDespatch()}
              >
                <CheckCircle2 className="size-4" />
                {saving ? 'Creating…' : 'Create despatch'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active despatches (primary) + operations panel — two columns on large screens */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
        <Card className="min-w-0 border-amber-200/60 dark:border-amber-900/40">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            {activeDespatches.length > 0 && (
              <Checkbox
                checked={selectedIds.size === activeDespatches.length && activeDespatches.length > 0}
                onCheckedChange={(c) => {
                  if (c) {
                    setSelectedIds(new Set(activeDespatches.map((d) => d._id)))
                  } else {
                    clearSelection()
                  }
                }}
                aria-label="Select all despatches"
              />
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Active despatch records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Excludes fulfilment-cancelled. Click a row for detail and email.
              </p>
            </div>
            {activeDespatches.length > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {activeDespatches.length} record{activeDespatches.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <BulkActionBar
              selectedCount={selectedIds.size}
              onClearSelection={clearSelection}
              actions={[
                {
                  label: `Delete ${selectedIds.size}`,
                  icon: Trash2,
                  variant: 'destructive',
                  onClick: () => setBulkDeleteOpen(true),
                },
              ]}
            />
            {loadingLists ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : activeDespatches.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-amber-200 py-8 text-center dark:border-amber-800">
                <Truck className="mx-auto mb-2 h-8 w-8 text-amber-300 dark:text-amber-700" />
                <p className="text-sm text-muted-foreground">No active despatches yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeDespatches.map((d) => (
                  <RecordListItem
                    key={d._id}
                    id={d._id}
                    density="compact"
                    selected={selectedIds.has(d._id)}
                    onSelect={handleSelect}
                    title={d.despatchId}
                    subtitle={`Order ${d.orderId} · ${d.despatchDate} · ${d.carrierName || '—'}`}
                    badge={{ label: d.despatchStatus, className: despatchClass[d.despatchStatus] }}
                    onClick={() => void openDespatchDetail(d)}
                    actions={[
                      {
                        label: 'View detail',
                        onClick: (e) => {
                          e.stopPropagation()
                          void openDespatchDetail(d)
                        },
                      },
                      {
                        label: 'View order',
                        icon: ExternalLink,
                        onClick: (e) => {
                          e.stopPropagation()
                          window.location.href = orderHref(d.orderId)
                        },
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'destructive',
                        onClick: (e) => {
                          e.stopPropagation()
                          setSingleDeleteId(d._id)
                        },
                      },
                    ]}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <aside
          className={cn(
            'flex min-w-0 flex-col gap-3',
            'lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pb-2',
          )}
        >
          <Card className="border-amber-200/60 bg-white/80 dark:border-amber-900/40 dark:bg-slate-900/40">
            <CardHeader className="space-y-1 px-3 pb-2 pt-3">
              <CardTitle className="text-sm font-semibold">Cancel an order</CardTitle>
              <CardDescription className="text-xs leading-snug">
                Sets order lifecycle to cancelled for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              <Select
                value={cancelOrderPick}
                onValueChange={setCancelOrderPick}
                options={cancelOrderOptions}
                searchable={openOrders.length > 8}
                searchPlaceholder="Search orders…"
                placeholder="Choose order…"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full rounded-xl border-0 bg-red-600 font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 dark:bg-red-600 dark:hover:bg-red-500"
                onClick={() => void onCancelOrder()}
              >
                <XCircle className="mr-1 size-4" /> Cancel order
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-white/80 dark:border-amber-900/40 dark:bg-slate-900/40">
            <CardHeader className="space-y-1 px-3 pb-2 pt-3">
              <CardTitle className="text-sm font-semibold">Cancel fulfilment</CardTitle>
              <CardDescription className="text-xs leading-snug">
                Marks a despatch as fulfilment_cancelled without deleting it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Active despatch</Label>
                <Select
                  value={cancelDespatchPick}
                  onValueChange={setCancelDespatchPick}
                  options={cancelDespatchOptions}
                  searchable={activeDespatches.length > 6}
                  searchPlaceholder="Search despatches…"
                  placeholder="Choose…"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => void onCancelFulfilment()}
              >
                Cancel fulfilment
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-white/80 dark:border-amber-900/40 dark:bg-slate-900/40">
            <CardHeader className="space-y-0 px-3 pb-2 pt-3">
              <CardTitle className="text-sm font-semibold">Cancelled orders</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {loadingLists ? (
                <Skeleton className="h-14 w-full rounded-lg" />
              ) : cancelledOrders.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-amber-200/80 bg-amber-50/30 py-5 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
                  <Ban className="size-8 text-muted-foreground/70" />
                  <p className="text-xs font-medium text-foreground">No cancelled orders</p>
                  <p className="text-[11px] text-muted-foreground">Cancelled orders appear here.</p>
                </div>
              ) : (
                <ul className="max-h-[min(280px,40vh)] space-y-2 overflow-y-auto pr-0.5">
                  {cancelledOrders.map((o) => (
                    <li
                      key={o._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/50 bg-white/90 px-2.5 py-2 dark:border-amber-900/40 dark:bg-slate-900/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-xs font-semibold">{o.orderId}</span>
                          <Badge className={cn('text-[10px]', orderClass[o.orderStatus] ?? '')}>
                            {o.orderStatus}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {o.buyer.name} · {o.issueDate}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" asChild>
                        <Link to={`/orders/${o._id}`}>View</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-white/80 dark:border-amber-900/40 dark:bg-slate-900/40">
            <CardHeader className="space-y-0 px-3 pb-2 pt-3">
              <CardTitle className="text-sm font-semibold">Cancelled fulfilments</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {loadingLists ? (
                <Skeleton className="h-14 w-full rounded-lg" />
              ) : fulfilmentCancelled.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-amber-200/80 bg-amber-50/30 py-5 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
                  <Inbox className="size-8 text-muted-foreground/70" />
                  <p className="text-xs font-medium text-foreground">No cancelled fulfilments</p>
                  <p className="text-[11px] text-muted-foreground">Records marked fulfilment-cancelled show here.</p>
                </div>
              ) : (
                <ul className="max-h-[min(280px,40vh)] space-y-2 overflow-y-auto pr-0.5">
                  {fulfilmentCancelled.map((d) => (
                    <li key={d._id}>
                      <button
                        type="button"
                        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/50 bg-white/90 px-2.5 py-2 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/50 dark:border-amber-900/40 dark:bg-slate-900/60 dark:hover:border-amber-800 dark:hover:bg-amber-950/25"
                        onClick={() => void openDespatchDetail(d)}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-xs font-semibold">{d.despatchId}</span>
                            <Badge className={cn('text-[10px]', despatchClass[d.despatchStatus] ?? '')}>
                              {d.despatchStatus}
                            </Badge>
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground">Order {d.orderId}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Despatch detail modal */}
      <Modal open={sheet.open} onOpenChange={(open) => setSheet((s) => ({ ...s, open }))} className="max-w-2xl">
        <div className="relative shrink-0 border-b border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-transparent px-5 py-4 pr-14 dark:border-amber-900/40 dark:from-amber-950/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 size-9 rounded-lg"
            onClick={() => setSheet((s) => ({ ...s, open: false }))}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
          <h2 className="break-all pr-2 text-lg font-semibold leading-snug tracking-tight">
            {sheet.record?.despatchId ?? 'Despatch'}
          </h2>
        </div>
        {sheet.record ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm">
              <div className="space-y-4">
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Order</span>
                  <Link className="break-all font-medium text-amber-700 underline dark:text-amber-400" to={orderHref(sheet.record.orderId)}>
                    {sheet.record.orderId}
                  </Link>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={despatchClass[sheet.record.despatchStatus] ?? ''}>{sheet.record.despatchStatus}</Badge>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Date</span>
                  <span>{sheet.record.despatchDate}</span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Carrier / tracking</span>
                  <span className="break-words">{sheet.record.carrierName || '—'} / {sheet.record.trackingId || '—'}</span>
                </div>
                {sheet.record.notes && (
                  <div className="grid gap-1">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="whitespace-pre-wrap break-words">{sheet.record.notes}</span>
                  </div>
                )}
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
                Sends an HTML + plain-text summary (despatch ID, order, carrier, lines).
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

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.size} despatch${selectedIds.size !== 1 ? 'es' : ''}?`}
        description="This will permanently delete the selected despatch records. This cannot be undone."
        confirmLabel="Delete all"
        variant="destructive"
        onConfirm={handleBulkDelete}
        loading={deletingBulk}
      />

      {/* Single delete confirm */}
      <ConfirmDialog
        open={singleDeleteId !== null}
        onOpenChange={(open) => { if (!open) setSingleDeleteId(null) }}
        title="Delete despatch?"
        description="This will permanently delete this despatch record. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleSingleDelete}
        loading={deletingSingle}
      />
    </div>
  )
}
