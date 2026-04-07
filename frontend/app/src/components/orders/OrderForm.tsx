import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { StoredOrderSummary } from '@/api/orders'
import type { CreateOrderPayload, OrderLineDto } from '@/types/orders'

const card =
  'rounded-xl border border-amber-200/60 bg-white/80 p-4 dark:border-amber-900/40 dark:bg-slate-900/40'

function PartyBlock({
  title,
  prefix,
  payload,
  onChange,
}: {
  title: string
  prefix: 'buyer' | 'seller'
  payload: CreateOrderPayload
  onChange: (next: CreateOrderPayload) => void
}) {
  const p = payload[prefix]
  const setAddr = (k: keyof typeof p.address, v: string) => {
    onChange({
      ...payload,
      [prefix]: { ...p, address: { ...p.address, [k]: v } },
    })
  }
  return (
    <div className={cn(card, 'space-y-3')}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Name</Label>
          <Input
            value={p.name}
            onChange={(e) => onChange({ ...payload, [prefix]: { ...p, name: e.target.value } })}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Endpoint / ID</Label>
          <Input
            value={p.id ?? ''}
            onChange={(e) => onChange({ ...payload, [prefix]: { ...p, id: e.target.value } })}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={p.email ?? ''}
            onChange={(e) => onChange({ ...payload, [prefix]: { ...p, email: e.target.value } })}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Street</Label>
          <Input value={p.address.street} onChange={(e) => setAddr('street', e.target.value)} className="h-9 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input value={p.address.city} onChange={(e) => setAddr('city', e.target.value)} className="h-9 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label>Postal code</Label>
          <Input
            value={p.address.postalCode}
            onChange={(e) => setAddr('postalCode', e.target.value)}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Input
            value={p.address.country}
            onChange={(e) => setAddr('country', e.target.value)}
            className="h-9 rounded-lg"
            placeholder="AU"
          />
        </div>
      </div>
    </div>
  )
}

export function OrderForm({ payload, onChange }: { payload: CreateOrderPayload; onChange: (p: CreateOrderPayload) => void }) {
  const updateLine = (idx: number, patch: Partial<OrderLineDto>) => {
    const lines = payload.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    onChange({ ...payload, lines })
  }

  const addLine = () => {
    onChange({
      ...payload,
      lines: [
        ...payload.lines,
        { description: 'Item', quantity: 1, unitPrice: 0, unitCode: 'C62' },
      ],
    })
  }

  const removeLine = (idx: number) => {
    if (payload.lines.length <= 1) return
    onChange({ ...payload, lines: payload.lines.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-6">
      <div className={cn(card, 'grid gap-3 sm:grid-cols-2')}>
        <div className="space-y-1.5">
          <Label>Order ID</Label>
          <Input value={payload.orderId} onChange={(e) => onChange({ ...payload, orderId: e.target.value })} className="h-9 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label>Issue date</Label>
          <Input
            type="date"
            value={payload.issueDate}
            onChange={(e) => onChange({ ...payload, issueDate: e.target.value })}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input value={payload.currency} onChange={(e) => onChange({ ...payload, currency: e.target.value })} className="h-9 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label>Tax rate (decimal)</Label>
          <Input
            value={String(payload.taxRate ?? 0)}
            onChange={(e) => onChange({ ...payload, taxRate: Number(e.target.value) || 0 })}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Order status</Label>
          <select
            className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
            value={payload.orderStatus ?? 'created'}
            onChange={(e) =>
              onChange({ ...payload, orderStatus: e.target.value as 'draft' | 'created' })
            }
          >
            <option value="created">Created</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Invoice linkage note (optional)</Label>
          <Input
            value={payload.invoiceStatusNote ?? ''}
            onChange={(e) => onChange({ ...payload, invoiceStatusNote: e.target.value })}
            className="h-9 rounded-lg"
            placeholder="e.g. awaiting INV-1001"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Note</Label>
          <Textarea value={payload.note ?? ''} onChange={(e) => onChange({ ...payload, note: e.target.value })} className="min-h-16 rounded-lg" />
        </div>
      </div>

      <PartyBlock title="Buyer" prefix="buyer" payload={payload} onChange={onChange} />
      <PartyBlock title="Seller / supplier" prefix="seller" payload={payload} onChange={onChange} />

      <div className={cn(card, 'space-y-3')}>
        <h3 className="text-sm font-semibold">Delivery (optional)</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {payload.delivery ? (
            <>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ship-to street</Label>
                <Input
                  value={payload.delivery.address.street}
                  onChange={(e) =>
                    onChange({
                      ...payload,
                      delivery: { ...payload.delivery!, address: { ...payload.delivery!.address, street: e.target.value } },
                    })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={payload.delivery.address.city}
                  onChange={(e) =>
                    onChange({
                      ...payload,
                      delivery: { ...payload.delivery!, address: { ...payload.delivery!.address, city: e.target.value } },
                    })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Postal</Label>
                <Input
                  value={payload.delivery.address.postalCode}
                  onChange={(e) =>
                    onChange({
                      ...payload,
                      delivery: {
                        ...payload.delivery!,
                        address: { ...payload.delivery!.address, postalCode: e.target.value },
                      },
                    })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={payload.delivery.address.country}
                  onChange={(e) =>
                    onChange({
                      ...payload,
                      delivery: {
                        ...payload.delivery!,
                        address: { ...payload.delivery!.address, country: e.target.value },
                      },
                    })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery start</Label>
                <Input
                  type="date"
                  value={payload.delivery.requestedDeliveryStart ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...payload,
                      delivery: { ...payload.delivery!, requestedDeliveryStart: e.target.value },
                    })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery end</Label>
                <Input
                  type="date"
                  value={payload.delivery.requestedDeliveryEnd ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...payload,
                      delivery: { ...payload.delivery!, requestedDeliveryEnd: e.target.value },
                    })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </>
          ) : null}
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg border-amber-300"
              onClick={() =>
                onChange({
                  ...payload,
                  delivery: payload.delivery ?? {
                    address: { street: '', city: '', postalCode: '', country: payload.buyer.address.country },
                  },
                })
              }
            >
              {payload.delivery ? 'Clear delivery block' : 'Add delivery address'}
            </Button>
            {payload.delivery ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => onChange({ ...payload, delivery: undefined })}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Delivery terms</Label>
          <Input
            value={payload.deliveryTerms ?? ''}
            onChange={(e) => onChange({ ...payload, deliveryTerms: e.target.value })}
            className="h-9 rounded-lg"
          />
        </div>
      </div>

      <div className={cn(card, 'space-y-3')}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Line items</h3>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={addLine}>
            <Plus className="size-4" /> Add line
          </Button>
        </div>
        <div className="space-y-3">
          {payload.lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border border-amber-200/40 p-3 sm:grid-cols-12 dark:border-amber-900/30">
              <div className="sm:col-span-2">
                <Label className="text-xs">Line ID</Label>
                <Input
                  value={line.lineId ?? ''}
                  onChange={(e) => updateLine(idx, { lineId: e.target.value })}
                  className="h-8 rounded-md text-sm"
                  placeholder={String(idx + 1)}
                />
              </div>
              <div className="sm:col-span-4">
                <Label className="text-xs">Description</Label>
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(idx, { description: e.target.value })}
                  className="h-8 rounded-md text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                  className="h-8 rounded-md text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Unit</Label>
                <Input
                  value={line.unitCode ?? ''}
                  onChange={(e) => updateLine(idx, { unitCode: e.target.value })}
                  className="h-8 rounded-md text-sm"
                  placeholder="C62"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Unit price</Label>
                <Input
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
                  className="h-8 rounded-md text-sm"
                />
              </div>
              <div className="flex items-end sm:col-span-12">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 text-red-600"
                  onClick={() => removeLine(idx)}
                  disabled={payload.lines.length <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function defaultOrderPayload(): CreateOrderPayload {
  const today = new Date().toISOString().slice(0, 10)
  const addr = { street: '', city: '', postalCode: '', country: 'AU' }
  return {
    orderId: `ORD-${Date.now()}`,
    issueDate: today,
    currency: 'AUD',
    taxRate: 0.1,
    buyer: { name: '', address: { ...addr } },
    seller: { name: '', address: { ...addr } },
    lines: [{ description: 'Product', quantity: 1, unitPrice: 100, unitCode: 'C62' }],
    orderStatus: 'created',
  }
}

/** Realistic demo payload for UBL / XSD validation (new order flow). */
export function sampleOrderPayload(): CreateOrderPayload {
  const today = new Date().toISOString().slice(0, 10)
  const end = new Date()
  end.setDate(end.getDate() + 14)
  const deliveryEnd = end.toISOString().slice(0, 10)
  return {
    orderId: `ORD-DEMO-${Date.now().toString(36).toUpperCase()}`,
    issueDate: today,
    currency: 'AUD',
    taxRate: 0.1,
    note: 'Please deliver hardware directly to the loading dock.',
    buyer: {
      name: 'Acme Enterprises Corp',
      id: '47555123456',
      email: 'purchasing@acme.example.com',
      address: {
        street: '100 Corporate Boulevard',
        city: 'Sydney',
        postalCode: '2000',
        country: 'AU',
      },
    },
    seller: {
      name: 'TechSupplies Pty Ltd',
      id: '88123456789',
      email: 'sales@techsupplies.example.com',
      address: {
        street: '50 Enterprise Drive',
        city: 'Melbourne',
        postalCode: '3000',
        country: 'AU',
      },
    },
    lines: [
      {
        lineId: '1',
        description: 'ProBook Laptop 15-inch',
        quantity: 2,
        unitPrice: 1500,
        unitCode: 'C62',
      },
      {
        lineId: '2',
        description: 'UltraSharp 27-inch Monitor',
        quantity: 4,
        unitPrice: 300,
        unitCode: 'C62',
      },
      {
        lineId: '3',
        description: 'On-site hardware installation',
        quantity: 1,
        unitPrice: 500,
        unitCode: 'C62',
      },
    ],
    delivery: {
      address: {
        street: '100 Corporate Boulevard',
        city: 'Sydney',
        postalCode: '2000',
        country: 'AU',
      },
      requestedDeliveryEnd: deliveryEnd,
    },
    deliveryTerms: 'DAP buyer warehouse dock',
    orderStatus: 'created',
  }
}

export function orderSummaryToPayload(row: StoredOrderSummary): CreateOrderPayload {
  return {
    orderId: row.orderId,
    issueDate: row.issueDate,
    currency: row.currency,
    taxRate: row.lines[0]?.taxRate ?? 0,
    buyer: {
      name: row.buyer.name,
      id: row.buyer.id,
      email: row.buyer.email,
      address: { ...row.buyer.address },
    },
    seller: {
      name: row.seller.name,
      id: row.seller.id,
      email: row.seller.email,
      address: { ...row.seller.address },
    },
    lines: row.lines.map((l) => ({
      lineId: l.lineId,
      description: l.description,
      quantity: l.quantity,
      unitCode: l.unitCode,
      unitPrice: l.unitPrice,
    })),
    orderStatus: row.orderStatus === 'draft' ? 'draft' : 'created',
    invoiceStatusNote: row.invoiceStatusNote,
    delivery: row.delivery?.street
      ? {
          address: {
            street: row.delivery.street ?? '',
            city: row.delivery.city ?? '',
            postalCode: row.delivery.postalCode ?? '',
            country: row.delivery.country ?? '',
          },
          requestedDeliveryStart: row.delivery.deliveryStart,
          requestedDeliveryEnd: row.delivery.deliveryEnd,
        }
      : undefined,
    deliveryTerms: row.deliveryTerms,
  }
}
