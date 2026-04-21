import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Mail, Plus, Send, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listStoredInvoices, deleteInvoiceById, sendInvoiceEmail, getStoredInvoice, type StoredInvoiceSummary } from '@/api/invoices'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BulkActionBar } from '@/components/shared/BulkActionBar'
import { RecordListItem } from '@/components/shared/RecordListItem'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'
import { useInvoiceSearch } from '@/context/InvoiceSearchContext'
import { cn } from '@/lib/utils'

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
  return parts.join(' ').toLowerCase().includes(s)
}

/** Shared border / background / text for badges and row icons (status-colored) */
const lifecycleStatusStyle: Record<string, string> = {
  SENT: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  VALIDATED: 'border-sky-300/70 bg-sky-100 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300',
  SAVED: 'border-amber-300/70 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
  DRAFT: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SEND_FAILED: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300',
  PAID: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  OVERDUE: 'border-orange-300/70 bg-orange-100 text-orange-900 dark:border-orange-800/50 dark:bg-orange-950/40 dark:text-orange-200',
}

const lifecycleStatusFallbackStyle =
  'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

export function InvoiceHistoryPage() {
  const [rows, setRows] = useState<StoredInvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const { invoiceSearch } = useInvoiceSearch()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk delete
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deletingBulk, setDeletingBulk] = useState(false)

  // Bulk send
  const [bulkSendOpen, setBulkSendOpen] = useState(false)
  const [bulkSendEmail, setBulkSendEmail] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)

  // Single delete
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)
  const [deletingSingle, setDeletingSingle] = useState(false)

  // Single send
  const [singleSendInv, setSingleSendInv] = useState<StoredInvoiceSummary | null>(null)
  const [singleSendEmail, setSingleSendEmail] = useState('')
  const [sendingSingle, setSendingSingle] = useState(false)

  const filtered = useMemo(
    () => rows.filter((inv) => invoiceMatches(inv, invoiceSearch)),
    [rows, invoiceSearch],
  )

  const load = useCallback(async () => {
    try {
      const res = await listStoredInvoices()
      setRows(res.invoices ?? [])
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load'
      toast.error('Could not load invoices', { description: msg })
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
    const results = await Promise.allSettled(ids.map((id) => deleteInvoiceById(id)))
    const failed = results.filter((r) => r.status === 'rejected').length
    const succeeded = results.length - failed
    if (succeeded > 0) toast.success(`Deleted ${succeeded} invoice${succeeded > 1 ? 's' : ''}`)
    if (failed > 0) toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`)
    setDeletingBulk(false)
    setBulkDeleteOpen(false)
    clearSelection()
    setLoading(true)
    load()
  }

  const handleBulkSend = async () => {
    if (!bulkSendEmail.trim()) return
    setSendingBulk(true)
    const ids = [...selectedIds]
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const detail = await getStoredInvoice(id)
        if (!detail.invoiceXml) throw new Error('No XML')
        return sendInvoiceEmail(detail.invoiceXml, bulkSendEmail.trim(), id)
      }),
    )
    const failed = results.filter((r) => r.status === 'rejected').length
    const succeeded = results.length - failed
    if (succeeded > 0) toast.success(`Sent ${succeeded} invoice${succeeded > 1 ? 's' : ''} to ${bulkSendEmail}`)
    if (failed > 0) toast.error(`${failed} send${failed > 1 ? 's' : ''} failed`)
    setSendingBulk(false)
    setBulkSendOpen(false)
    setBulkSendEmail('')
    clearSelection()
    setLoading(true)
    load()
  }

  const handleSingleDelete = async () => {
    if (!singleDeleteId) return
    setDeletingSingle(true)
    try {
      await deleteInvoiceById(singleDeleteId)
      toast.success('Invoice deleted')
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(singleDeleteId)
        return next
      })
      setLoading(true)
      load()
    } catch (e) {
      toast.error('Could not delete', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setDeletingSingle(false)
      setSingleDeleteId(null)
    }
  }

  const handleSingleSend = async () => {
    if (!singleSendInv || !singleSendEmail.trim()) return
    setSendingSingle(true)
    try {
      const detail = await getStoredInvoice(String(singleSendInv._id))
      if (!detail.invoiceXml) throw new Error('Invoice has no XML')
      await sendInvoiceEmail(detail.invoiceXml, singleSendEmail.trim(), String(singleSendInv._id))
      toast.success(`Invoice sent to ${singleSendEmail}`)
      setSingleSendInv(null)
      setSingleSendEmail('')
      setLoading(true)
      load()
    } catch (e) {
      toast.error('Send failed', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setSendingSingle(false)
    }
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length

  return (
    <div className="space-y-6">
      {/* Page header */}
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
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          {filtered.length > 0 && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={(c) => {
                if (c) {
                  setSelectedIds(new Set(filtered.map((r) => String(r._id))))
                } else {
                  setSelectedIds(new Set())
                }
              }}
              aria-label="Select all invoices"
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-base">Your invoices</CardTitle>
            <p className="text-sm text-muted-foreground">Open an invoice to edit supplement data, validate, PDF, or resend.</p>
          </div>
          {rows.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
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
                onClick: () => setBulkDeleteOpen(true),
              },
              {
                label: 'Send all',
                icon: Send,
                variant: 'outline',
                onClick: () => setBulkSendOpen(true),
              },
            ]}
          />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-amber-200 py-12 text-center dark:border-amber-800">
              <FileText className="h-10 w-10 text-amber-300 dark:text-amber-700" />
              <div>
                <p className="text-sm font-medium text-foreground">No stored invoices yet</p>
                <p className="text-xs text-muted-foreground">Generate an invoice to get started</p>
              </div>
              <Button asChild size="sm" className="mt-1 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-500">
                <Link to="/generate">
                  <Plus className="mr-1.5 h-4 w-4" /> Generate invoice
                </Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices match &ldquo;{invoiceSearch.trim()}&rdquo;. Clear the search or try another name, email, or ID.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((inv) => {
                const mongoId = String(inv._id)
                const orderId = inv.orderReference?.orderId ?? '—'
                const subtitle = [
                  inv.buyer.name,
                  inv.buyer.email,
                  `${inv.buyer.address.city}, ${inv.buyer.address.country}`,
                  `Order ${orderId}`,
                  inv.sentAt ? `Sent ${formatWhen(inv.sentAt)}` : `Updated ${formatWhen(inv.updatedAt)}`,
                ].filter(Boolean).join(' · ')
                const shell =
                  lifecycleStatusStyle[inv.lifecycleStatus] ?? lifecycleStatusFallbackStyle
                return (
                  <RecordListItem
                    key={mongoId}
                    id={mongoId}
                    selected={selectedIds.has(mongoId)}
                    onSelect={handleSelect}
                    title={inv.invoiceId}
                    subtitle={subtitle}
                    meta={formatAmount(inv.totals.payableAmount, inv.currency)}
                    badge={{
                      label: inv.lifecycleStatus,
                      className:
                        lifecycleStatusStyle[inv.lifecycleStatus] ?? lifecycleStatusFallbackStyle,
                    }}
                    icon={
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm',
                          shell,
                        )}
                        aria-hidden
                      >
                        <FileText className="size-4" strokeWidth={2} />
                      </div>
                    }
                    href={`/invoices/${mongoId}`}
                    actions={[
                      {
                        label: 'Open',
                        icon: FileText,
                        onClick: (e) => {
                          e.stopPropagation()
                          window.location.href = `/invoices/${mongoId}`
                        },
                      },
                      {
                        label: 'Send email',
                        icon: Mail,
                        onClick: (e) => {
                          e.stopPropagation()
                          setSingleSendInv(inv)
                        },
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'destructive',
                        onClick: (e) => {
                          e.stopPropagation()
                          setSingleDeleteId(mongoId)
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
              to="/generate"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-3 text-sm font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              Generate invoice <ArrowRight className="size-4" />
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.size} invoice${selectedIds.size !== 1 ? 's' : ''}?`}
        description="This will permanently delete the selected invoices. This cannot be undone."
        confirmLabel="Delete all"
        variant="destructive"
        onConfirm={handleBulkDelete}
        loading={deletingBulk}
      />

      {/* Bulk send confirm */}
      <ConfirmDialog
        open={bulkSendOpen}
        onOpenChange={(open) => {
          setBulkSendOpen(open)
          if (!open) setBulkSendEmail('')
        }}
        title={`Send ${selectedIds.size} invoice${selectedIds.size !== 1 ? 's' : ''}`}
        description="All selected invoices will be sent to the email address below."
        confirmLabel="Send all"
        onConfirm={handleBulkSend}
        loading={sendingBulk}
      >
        <Input
          type="email"
          placeholder="recipient@example.com"
          value={bulkSendEmail}
          onChange={(e) => setBulkSendEmail(e.target.value)}
          className="rounded-lg"
        />
      </ConfirmDialog>

      {/* Single delete confirm */}
      <ConfirmDialog
        open={singleDeleteId !== null}
        onOpenChange={(open) => { if (!open) setSingleDeleteId(null) }}
        title="Delete invoice?"
        description="This will permanently delete the invoice. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleSingleDelete}
        loading={deletingSingle}
      />

      {/* Single send confirm */}
      <ConfirmDialog
        open={singleSendInv !== null}
        onOpenChange={(open) => {
          if (!open) { setSingleSendInv(null); setSingleSendEmail('') }
        }}
        title={`Send ${singleSendInv?.invoiceId ?? 'invoice'}`}
        description="Enter the recipient email address."
        confirmLabel="Send"
        onConfirm={handleSingleSend}
        loading={sendingSingle}
      >
        <Input
          type="email"
          placeholder="recipient@example.com"
          value={singleSendEmail}
          onChange={(e) => setSingleSendEmail(e.target.value)}
          className="rounded-lg"
        />
      </ConfirmDialog>
    </div>
  )
}
