import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { CollapsibleSection } from '@/components/shared/CollapsibleSection'
import { cn } from '@/lib/utils'
import type { StoredOrderSummary } from '@/api/orders'
import type { CreateOrderPayload, OrderLineDto } from '@/types/orders'
import { DocumentUploader } from '@/components/ai/DocumentUploader'
import type { ExtractedFields } from '@/api/ai'

const card =
  'rounded-xl border border-amber-200/60 bg-white/80 p-3 shadow-sm dark:border-amber-900/40 dark:bg-slate-900/40'

const sectionPairGrid = 'grid gap-3 sm:grid-cols-1 lg:grid-cols-2 lg:items-start'

function summarizeBuyer(p: CreateOrderPayload): string {
  const name = p.buyer.name?.trim()
  const id = p.buyer.id?.trim()
  const email = p.buyer.email?.trim()
  const bits = [name, id, email].filter(Boolean)
  return bits.length ? bits.join(' · ') : 'Add buyer name, ID, or email'
}

function summarizePartyAddress(addr: {
  street: string
  city: string
  postalCode: string
  country: string
}): string {
  const city = addr.city?.trim()
  const pc = addr.postalCode?.trim()
  const c = addr.country?.trim()
  const locality = [city, pc].filter(Boolean).join(', ')
  if (locality && c) return `${locality} · ${c}`
  if (locality) return locality
  if (c) return c
  if (addr.street?.trim()) return addr.street.trim().slice(0, 48) + (addr.street.length > 48 ? '…' : '')
  return 'Add street, city, and country'
}

function summarizeSeller(p: CreateOrderPayload): string {
  const name = p.seller.name?.trim()
  const id = p.seller.id?.trim()
  const email = p.seller.email?.trim()
  const bits = [name, id, email].filter(Boolean)
  return bits.length ? bits.join(' · ') : 'Add seller name, ID, or email'
}

function summarizeOrderDetails(p: CreateOrderPayload): string {
  const bits: string[] = []
  bits.push(p.orderStatus === 'draft' ? 'Draft' : 'Created')
  if (p.invoiceStatusNote?.trim()) bits.push(p.invoiceStatusNote.trim())
  if (p.note?.trim()) {
    const n = p.note.trim()
    bits.push(n.length > 56 ? `${n.slice(0, 56)}…` : n)
  }
  return bits.join(' · ')
}

function summarizeDelivery(p: CreateOrderPayload): string {
  if (p.delivery) {
    const a = p.delivery.address
    const place = [a.city?.trim(), a.country?.trim()].filter(Boolean).join(', ')
    const start = p.delivery.requestedDeliveryStart?.trim()
    const end = p.delivery.requestedDeliveryEnd?.trim()
    const window =
      start && end ? `${start} → ${end}` : start || end || ''
    const head = place || a.street?.trim() || 'Address set'
    const mid = window ? ` · ${window}` : ''
    const terms = p.deliveryTerms?.trim()
    const tail = terms ? ` · ${terms.length > 32 ? `${terms.slice(0, 32)}…` : terms}` : ''
    return `${head}${mid}${tail}`
  }
  if (p.deliveryTerms?.trim()) return `Terms only · ${p.deliveryTerms.trim()}`
  return 'Optional ship-to and dates · add delivery block if needed'
}


function applyExtractedFields(payload: CreateOrderPayload, fields: ExtractedFields): CreateOrderPayload {
  const next = { ...payload }

  if (fields.buyer) {
    next.buyer = {
      ...next.buyer,
      ...(fields.buyer.name ? { name: fields.buyer.name } : {}),
      ...(fields.buyer.address
        ? {
            address: {
              street: fields.buyer.address.street ?? next.buyer.address.street,
              city: fields.buyer.address.city ?? next.buyer.address.city,
              postalCode: fields.buyer.address.postalCode ?? next.buyer.address.postalCode,
              country: fields.buyer.address.country ?? next.buyer.address.country,
            },
          }
        : {}),
    }
  }

  if (fields.seller) {
    next.seller = {
      ...next.seller,
      ...(fields.seller.name ? { name: fields.seller.name } : {}),
      ...(fields.seller.address
        ? {
            address: {
              street: fields.seller.address.street ?? next.seller.address.street,
              city: fields.seller.address.city ?? next.seller.address.city,
              postalCode: fields.seller.address.postalCode ?? next.seller.address.postalCode,
              country: fields.seller.address.country ?? next.seller.address.country,
            },
          }
        : {}),
    }
  }

  if (fields.currency) next.currency = fields.currency
  if (fields.issueDate) next.issueDate = fields.issueDate

  if (fields.lines && fields.lines.length > 0) {
    next.lines = fields.lines.map((l, i) => ({
      description: l.description ?? `Item ${i + 1}`,
      quantity: l.quantity ?? 1,
      unitPrice: l.unitPrice ?? 0,
      unitCode: 'C62',
    }))
  }

  return next
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
    <div className="space-y-3">
      <DocumentUploader
        onExtracted={(fields) => onChange(applyExtractedFields(payload, fields))}
      />

      {/* Essential fields — compact 2×2 summary header */}
      <div className={cn(card)}>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Order summary</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Order ID</Label>
            <Input
              value={payload.orderId}
              onChange={(e) => onChange({ ...payload, orderId: e.target.value })}
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Issue date</Label>
            <Input
              type="date"
              value={payload.issueDate}
              onChange={(e) => onChange({ ...payload, issueDate: e.target.value })}
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Currency</Label>
            <Input
              value={payload.currency}
              onChange={(e) => onChange({ ...payload, currency: e.target.value })}
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tax rate (decimal)</Label>
            <Input
              value={String(payload.taxRate ?? 0)}
              onChange={(e) => onChange({ ...payload, taxRate: Number(e.target.value) || 0 })}
              className="h-9 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className={sectionPairGrid}>
        <CollapsibleSection title="Buyer" defaultOpen={false} summary={summarizeBuyer(payload)}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={payload.buyer.name}
                onChange={(e) => onChange({ ...payload, buyer: { ...payload.buyer, name: e.target.value } })}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint / ID</Label>
              <Input
                value={payload.buyer.id ?? ''}
                onChange={(e) => onChange({ ...payload, buyer: { ...payload.buyer, id: e.target.value } })}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={payload.buyer.email ?? ''}
                onChange={(e) => onChange({ ...payload, buyer: { ...payload.buyer, email: e.target.value } })}
                className="h-9 rounded-lg"
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Buyer address"
          defaultOpen={false}
          summary={summarizePartyAddress(payload.buyer.address)}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Street</Label>
              <Input
                value={payload.buyer.address.street}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    buyer: { ...payload.buyer, address: { ...payload.buyer.address, street: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={payload.buyer.address.city}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    buyer: { ...payload.buyer, address: { ...payload.buyer.address, city: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Postal code</Label>
              <Input
                value={payload.buyer.address.postalCode}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    buyer: { ...payload.buyer, address: { ...payload.buyer.address, postalCode: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                value={payload.buyer.address.country}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    buyer: { ...payload.buyer, address: { ...payload.buyer.address, country: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
                placeholder="AU"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className={sectionPairGrid}>
        <CollapsibleSection title="Seller / supplier" defaultOpen={false} summary={summarizeSeller(payload)}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={payload.seller.name}
                onChange={(e) => onChange({ ...payload, seller: { ...payload.seller, name: e.target.value } })}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint / ID</Label>
              <Input
                value={payload.seller.id ?? ''}
                onChange={(e) => onChange({ ...payload, seller: { ...payload.seller, id: e.target.value } })}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={payload.seller.email ?? ''}
                onChange={(e) => onChange({ ...payload, seller: { ...payload.seller, email: e.target.value } })}
                className="h-9 rounded-lg"
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Seller address"
          defaultOpen={false}
          summary={summarizePartyAddress(payload.seller.address)}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Street</Label>
              <Input
                value={payload.seller.address.street}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    seller: { ...payload.seller, address: { ...payload.seller.address, street: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={payload.seller.address.city}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    seller: { ...payload.seller, address: { ...payload.seller.address, city: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Postal code</Label>
              <Input
                value={payload.seller.address.postalCode}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    seller: { ...payload.seller, address: { ...payload.seller.address, postalCode: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                value={payload.seller.address.country}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    seller: { ...payload.seller, address: { ...payload.seller.address, country: e.target.value } },
                  })
                }
                className="h-9 rounded-lg"
                placeholder="AU"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className={sectionPairGrid}>
        <CollapsibleSection title="Delivery" defaultOpen={false} summary={summarizeDelivery(payload)}>
          <div className="space-y-2">
          {payload.delivery ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ship-to street</Label>
                <Input
                  value={payload.delivery.address.street}
                  onChange={(e) =>
                    onChange({ ...payload, delivery: { ...payload.delivery!, address: { ...payload.delivery!.address, street: e.target.value } } })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={payload.delivery.address.city}
                  onChange={(e) =>
                    onChange({ ...payload, delivery: { ...payload.delivery!, address: { ...payload.delivery!.address, city: e.target.value } } })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Postal</Label>
                <Input
                  value={payload.delivery.address.postalCode}
                  onChange={(e) =>
                    onChange({ ...payload, delivery: { ...payload.delivery!, address: { ...payload.delivery!.address, postalCode: e.target.value } } })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={payload.delivery.address.country}
                  onChange={(e) =>
                    onChange({ ...payload, delivery: { ...payload.delivery!, address: { ...payload.delivery!.address, country: e.target.value } } })
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
                    onChange({ ...payload, delivery: { ...payload.delivery!, requestedDeliveryStart: e.target.value } })
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
                    onChange({ ...payload, delivery: { ...payload.delivery!, requestedDeliveryEnd: e.target.value } })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
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
              {payload.delivery ? 'Reset delivery' : 'Add delivery address'}
            </Button>
            {payload.delivery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onChange({ ...payload, delivery: undefined })}
              >
                Remove
              </Button>
            )}
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
        </CollapsibleSection>

        <CollapsibleSection
          title="Order details"
          defaultOpen={false}
          summary={summarizeOrderDetails(payload)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Order status</Label>
              <Select
                value={payload.orderStatus ?? 'created'}
                onValueChange={(v) =>
                  onChange({ ...payload, orderStatus: v as 'draft' | 'created' })
                }
                options={[
                  { value: 'created', label: 'Created' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice linkage note</Label>
              <Input
                value={payload.invoiceStatusNote ?? ''}
                onChange={(e) => onChange({ ...payload, invoiceStatusNote: e.target.value })}
                className="h-9 rounded-lg"
                placeholder="e.g. awaiting INV-1001"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Note</Label>
              <Textarea
                value={payload.note ?? ''}
                onChange={(e) => onChange({ ...payload, note: e.target.value })}
                className="min-h-14 rounded-lg"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className={cn(card, 'space-y-2')}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Line items</h3>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={addLine}>
            <Plus className="size-4" /> Add line
          </Button>
        </div>
        <div className="space-y-2">
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
