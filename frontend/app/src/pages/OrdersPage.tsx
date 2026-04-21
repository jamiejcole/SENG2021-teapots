import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileEdit, Package, Plus, Trash2 } from 'lucide-react'
import { listOrders, deleteOrder, type StoredOrderSummary } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BulkActionBar } from '@/components/shared/BulkActionBar'
import { RecordListItem } from '@/components/shared/RecordListItem'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'

const statusClass: Record<string, string> = {
  draft: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  created: 'border-sky-300/70 bg-sky-100 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300',
  cancelled: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300',
  fulfilled: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  partially_fulfilled: 'border-amber-300/70 bg-amber-100 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
}

export function OrdersPage() {
  const [rows, setRows] = useState<StoredOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk delete confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingBulk, setDeletingBulk] = useState(false)

  // Single delete confirm dialog
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)
  const [deletingSingle, setDeletingSingle] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await listOrders()
      setRows(res.orders ?? [])
    } catch (e) {
      toast.error('Could not load orders', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    setDeletingBulk(true)
    const ids = [...selectedIds]
    const results = await Promise.allSettled(ids.map((id) => deleteOrder(id)))
    const failed = results.filter((r) => r.status === 'rejected').length
    const succeeded = results.length - failed
    if (succeeded > 0) toast.success(`Deleted ${succeeded} order${succeeded > 1 ? 's' : ''}`)
    if (failed > 0) toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`)
    setDeletingBulk(false)
    setConfirmOpen(false)
    clearSelection()
    setLoading(true)
    load()
  }

  const handleSingleDelete = async () => {
    if (!singleDeleteId) return
    setDeletingSingle(true)
    try {
      await deleteOrder(singleDeleteId)
      toast.success('Order deleted')
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(singleDeleteId)
        return next
      })
      setLoading(true)
      load()
    } catch (e) {
      toast.error('Could not delete order', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setDeletingSingle(false)
      setSingleDeleteId(null)
    }
  }

  const allSelected = rows.length > 0 && selectedIds.size === rows.length

  return (
    <div className="space-y-6">
      {/* Page header */}
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
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          {rows.length > 0 && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={(c) => {
                if (c) {
                  setSelectedIds(new Set(rows.map((r) => r._id)))
                } else {
                  setSelectedIds(new Set())
                }
              }}
              aria-label="Select all orders"
            />
          )}
          <CardTitle className="text-base">All orders</CardTitle>
          {rows.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Bulk action bar */}
          <BulkActionBar
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            actions={[
              {
                label: `Delete ${selectedIds.size}`,
                icon: Trash2,
                variant: 'destructive',
                onClick: () => setConfirmOpen(true),
              },
            ]}
          />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-amber-200 py-12 text-center dark:border-amber-800">
              <Package className="h-10 w-10 text-amber-300 dark:text-amber-700" />
              <div>
                <p className="text-sm font-medium text-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground">Create your first UBL order to get started</p>
              </div>
              <Button asChild size="sm" className="mt-1 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-500">
                <Link to="/orders/create">
                  <Plus className="mr-1.5 h-4 w-4" /> Create order
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((o) => {
                const amount = o.totals?.payableAmount != null
                  ? `${o.currency} ${o.totals.payableAmount.toLocaleString()}`
                  : o.currency
                return (
                  <RecordListItem
                    key={o._id}
                    id={o._id}
                    selected={selectedIds.has(o._id)}
                    onSelect={handleSelect}
                    title={o.orderId}
                    subtitle={`${o.buyer.name} · ${o.seller.name}`}
                    meta={amount}
                    badge={{ label: o.orderStatus, className: statusClass[o.orderStatus] }}
                    href={`/orders/${encodeURIComponent(o._id)}`}
                    actions={[
                      {
                        label: 'Open',
                        icon: FileEdit,
                        onClick: (e) => {
                          e.stopPropagation()
                          window.location.href = `/orders/${encodeURIComponent(o._id)}`
                        },
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'destructive',
                        onClick: (e) => {
                          e.stopPropagation()
                          setSingleDeleteId(o._id)
                        },
                      },
                    ]}
                  />
                )
              })}
            </div>
          )}

          {!loading && (
            <Link
              to="/orders/create"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
            >
              New order <ArrowRight className="size-4" />
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${selectedIds.size} order${selectedIds.size !== 1 ? 's' : ''}?`}
        description="This will permanently delete the selected orders. This action cannot be undone."
        confirmLabel="Delete all"
        variant="destructive"
        onConfirm={handleBulkDelete}
        loading={deletingBulk}
      />

      {/* Single delete confirm */}
      <ConfirmDialog
        open={singleDeleteId !== null}
        onOpenChange={(open) => { if (!open) setSingleDeleteId(null) }}
        title="Delete order?"
        description="This will permanently delete the order. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleSingleDelete}
        loading={deletingSingle}
      />
    </div>
  )
}
