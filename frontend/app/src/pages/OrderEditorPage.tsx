import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Copy, Download, ShieldCheck, Trash2 } from 'lucide-react'
import {
  createOrder,
  deleteOrder,
  fetchOrderXml,
  getOrder,
  updateOrder,
  validateOrderPayload,
} from '@/api/orders'
import { OrderForm, defaultOrderPayload, orderSummaryToPayload } from '@/components/orders/OrderForm'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'
import type { CreateOrderPayload } from '@/types/orders'

export function OrderEditorPage() {
  const { orderKey } = useParams<{ orderKey: string }>()
  const navigate = useNavigate()
  const isCreate = !orderKey || orderKey === 'create'

  const [payload, setPayload] = useState<CreateOrderPayload>(() => defaultOrderPayload())
  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [resolvedKey, setResolvedKey] = useState<string | null>(isCreate ? null : orderKey!)

  const load = useCallback(async () => {
    if (!orderKey || isCreate) return
    setLoading(true)
    try {
      const row = await getOrder(orderKey)
      setPayload(orderSummaryToPayload(row))
      setResolvedKey(row._id)
    } catch (e) {
      toast.error('Order not found', { description: e instanceof ApiError ? e.message : '' })
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }, [orderKey, isCreate, navigate])

  useEffect(() => {
    void load()
  }, [load])

  async function onValidate() {
    try {
      const res = await validateOrderPayload(payload)
      toast.success('Order valid', { description: res.message })
    } catch (e) {
      toast.error('Validation failed', { description: e instanceof ApiError ? e.message : 'Error' })
    }
  }

  async function onSave() {
    setSaving(true)
    try {
      if (isCreate) {
        const created = await createOrder(payload)
        toast.success('Order created')
        navigate(`/orders/${created._id}`, { replace: true })
      } else {
        const key = resolvedKey ?? orderKey!
        await updateOrder(key, payload)
        toast.success('Order updated')
        void load()
      }
    } catch (e) {
      toast.error('Save failed', { description: e instanceof ApiError ? e.message : 'Error' })
    } finally {
      setSaving(false)
    }
  }

  async function getSavedOrderXml(): Promise<string | null> {
    if (isCreate) {
      toast.error('Save the order first')
      return null
    }
    const key = resolvedKey ?? orderKey!
    try {
      return await fetchOrderXml(key)
    } catch (e) {
      toast.error('Could not load XML', { description: e instanceof ApiError ? e.message : 'Error' })
      return null
    }
  }

  async function onDownloadXml() {
    const xml = await getSavedOrderXml()
    if (!xml) return
    try {
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${payload.orderId}.xml`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('XML downloaded')
    } catch {
      toast.error('Download failed')
    }
  }

  async function onCopyXml() {
    const xml = await getSavedOrderXml()
    if (!xml) return
    try {
      await navigator.clipboard.writeText(xml)
      toast.success('Order XML copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  async function onDelete() {
    if (isCreate) return
    if (!window.confirm('Delete this order? Linked flows may still reference it.')) return
    const key = resolvedKey ?? orderKey!
    try {
      await deleteOrder(key)
      toast.success('Order deleted')
      navigate('/orders')
    } catch (e) {
      toast.error('Delete failed', { description: e instanceof ApiError ? e.message : 'Error' })
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading order…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/orders" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
            <ArrowLeft className="size-4" /> Orders
          </Link>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">{isCreate ? 'New order' : `Edit ${payload.orderId}`}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Structured UBL order — validate before save if you want a quick XSD check.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-lg border-amber-300" onClick={() => void onValidate()}>
            <ShieldCheck className="size-4" /> Validate payload
          </Button>
          {!isCreate ? (
            <>
              <Button variant="outline" size="sm" className="rounded-lg border-amber-300" onClick={() => void onCopyXml()}>
                <Copy className="size-4" /> Copy XML
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg border-amber-300" onClick={() => void onDownloadXml()}>
                <Download className="size-4" /> XML
              </Button>
              <Button variant="outline" size="sm" className="text-red-700" onClick={() => void onDelete()}>
                <Trash2 className="size-4" /> Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <OrderForm payload={payload} onChange={setPayload} />

      <div className="flex flex-wrap gap-2">
        <Button
          className="gap-2 bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
          disabled={saving}
          onClick={() => void onSave()}
        >
          <CheckCircle2 className="size-4" />
          {saving ? 'Saving…' : isCreate ? 'Create order' : 'Save changes'}
        </Button>
        {!isCreate ? (
          <>
            <Button variant="outline" asChild className="rounded-lg">
              <Link to={`/generate?orderKey=${encodeURIComponent(resolvedKey ?? orderKey!)}`}>Generate invoice…</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-lg">
              <Link to={`/despatch?orderId=${encodeURIComponent(payload.orderId)}`}>Create despatch…</Link>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
