import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { CollapsibleSection } from '@/components/shared/CollapsibleSection'
import { cn } from '@/lib/utils'
import type { OrderPartyDto } from '@/types/orders'
import type { CreateDespatchPayload, DespatchLineDto } from '@/types/despatch'

const card =
  'rounded-xl border border-amber-200/60 bg-white/80 p-4 dark:border-amber-900/40 dark:bg-slate-900/40'

function emptyParty(): OrderPartyDto {
  return {
    name: '',
    address: { street: '', city: '', postalCode: '', country: 'AU' },
  }
}

function PartyFields({
  prefix,
  payload,
  onChange,
}: {
  prefix: 'supplierParty' | 'deliveryParty'
  payload: CreateDespatchPayload
  onChange: (next: CreateDespatchPayload) => void
}) {
  const p = payload[prefix]
  const setAddr = (k: keyof OrderPartyDto['address'], v: string) => {
    onChange({
      ...payload,
      [prefix]: { ...p, address: { ...p.address, [k]: v } },
    })
  }
  return (
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
        <Input value={p.address.postalCode} onChange={(e) => setAddr('postalCode', e.target.value)} className="h-9 rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <Label>Country</Label>
        <Input value={p.address.country} onChange={(e) => setAddr('country', e.target.value)} className="h-9 rounded-lg" placeholder="AU" />
      </div>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function defaultDespatchPayload(): CreateDespatchPayload {
  const today = new Date().toISOString().slice(0, 10)
  return {
    orderId: '',
    despatchDate: today,
    despatchStatus: 'despatched',
    carrierName: '',
    trackingId: '',
    notes: '',
    supplierParty: emptyParty(),
    deliveryParty: emptyParty(),
    lines: [{ lineId: '1', description: 'Shipment line', quantity: 1, unitCode: 'C62' }],
  }
}

/** Map a stored order into despatch parties/lines (seller → supplier, buyer/delivery → consignee). */
// eslint-disable-next-line react-refresh/only-export-components
export function despatchPayloadFromOrder(order: {
  orderId: string
  buyer: OrderPartyDto
  seller: OrderPartyDto
  lines: Array<{ lineId?: string; description: string; quantity: number; unitCode?: string }>
  delivery?: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
}): Pick<CreateDespatchPayload, 'orderId' | 'supplierParty' | 'deliveryParty' | 'lines'> {
  const useDelivery =
    order.delivery?.street && order.delivery?.city && order.delivery?.postalCode && order.delivery?.country
  const deliveryParty: OrderPartyDto = useDelivery
    ? {
        name: order.buyer.name,
        id: order.buyer.id,
        email: order.buyer.email,
        address: {
          street: order.delivery!.street!,
          city: order.delivery!.city!,
          postalCode: order.delivery!.postalCode!,
          country: order.delivery!.country!,
        },
      }
    : { ...order.buyer, address: { ...order.buyer.address } }

  const lines: DespatchLineDto[] = order.lines.map((l, i) => ({
    lineId: (l.lineId?.trim() ? l.lineId : `L${i + 1}`) as string,
    description: l.description,
    quantity: l.quantity,
    unitCode: l.unitCode,
  }))

  return {
    orderId: order.orderId,
    supplierParty: { ...order.seller, address: { ...order.seller.address } },
    deliveryParty,
    lines: lines.length ? lines : [{ lineId: '1', description: 'Item', quantity: 1, unitCode: 'C62' }],
  }
}

export function DespatchForm({
  payload,
  onChange,
}: {
  payload: CreateDespatchPayload
  onChange: (p: CreateDespatchPayload) => void
}) {
  const updateLine = (idx: number, patch: Partial<DespatchLineDto>) => {
    const lines = payload.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    onChange({ ...payload, lines })
  }

  const addLine = () => {
    const n = payload.lines.length + 1
    onChange({
      ...payload,
      lines: [...payload.lines, { lineId: String(n), description: 'Item', quantity: 1, unitCode: 'C62' }],
    })
  }

  const removeLine = (idx: number) => {
    if (payload.lines.length <= 1) return
    onChange({ ...payload, lines: payload.lines.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-4">
      {/* Core fields — always visible */}
      <div className={cn(card, 'grid gap-3 sm:grid-cols-2')}>
        <div className="space-y-1.5">
          <Label>Order reference (UBL Order ID)</Label>
          <Input
            value={payload.orderId}
            onChange={(e) => onChange({ ...payload, orderId: e.target.value })}
            className="h-9 rounded-lg"
            placeholder="ORD-…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Despatch ID (optional)</Label>
          <Input
            value={payload.despatchId ?? ''}
            onChange={(e) => onChange({ ...payload, despatchId: e.target.value || undefined })}
            className="h-9 rounded-lg"
            placeholder="Auto-generated if empty"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Despatch date</Label>
          <Input
            type="date"
            value={payload.despatchDate}
            onChange={(e) => onChange({ ...payload, despatchDate: e.target.value })}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Despatch status</Label>
          <Select
            value={payload.despatchStatus ?? 'despatched'}
            onValueChange={(v) =>
              onChange({
                ...payload,
                despatchStatus: v as CreateDespatchPayload['despatchStatus'],
              })
            }
            options={[
              { value: 'despatched', label: 'Despatched' },
              { value: 'partially_despatched', label: 'Partially despatched' },
              { value: 'not_despatched', label: 'Not despatched' },
            ]}
          />
        </div>
      </div>

      {/* Shipping details — collapsible */}
      <CollapsibleSection title="Shipping details" defaultOpen={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Carrier</Label>
            <Input
              value={payload.carrierName ?? ''}
              onChange={(e) => onChange({ ...payload, carrierName: e.target.value })}
              className="h-9 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tracking ID</Label>
            <Input
              value={payload.trackingId ?? ''}
              onChange={(e) => onChange({ ...payload, trackingId: e.target.value })}
              className="h-9 rounded-lg"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={payload.notes ?? ''}
              onChange={(e) => onChange({ ...payload, notes: e.target.value })}
              className="min-h-[72px] rounded-lg"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Supplier party — collapsible */}
      <CollapsibleSection title="Supplier party" defaultOpen={false}>
        <PartyFields prefix="supplierParty" payload={payload} onChange={onChange} />
      </CollapsibleSection>

      {/* Delivery party — collapsible */}
      <CollapsibleSection title="Delivery party" defaultOpen={false}>
        <PartyFields prefix="deliveryParty" payload={payload} onChange={onChange} />
      </CollapsibleSection>

      {/* Line items — always visible */}
      <div className={cn(card, 'space-y-3')}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Despatch line items</h3>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={addLine}>
            <Plus className="size-4" /> Add line
          </Button>
        </div>
        <div className="space-y-3">
          {payload.lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 rounded-lg border border-amber-200/40 p-3 sm:grid-cols-12 dark:border-amber-900/30">
              <div className="sm:col-span-2">
                <Label className="text-xs">Line ID</Label>
                <Input value={line.lineId} onChange={(e) => updateLine(idx, { lineId: e.target.value })} className="h-8 rounded-md text-sm" />
              </div>
              <div className="sm:col-span-5">
                <Label className="text-xs">Description</Label>
                <Input value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} className="h-8 rounded-md text-sm" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input type="number" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} className="h-8 rounded-md text-sm" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Unit</Label>
                <Input value={line.unitCode ?? ''} onChange={(e) => updateLine(idx, { unitCode: e.target.value })} className="h-8 rounded-md text-sm" placeholder="C62" />
              </div>
              <div className="flex items-end sm:col-span-1">
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
