import type { OrderPartyDto, OrderLineDto } from './orders'

export type DespatchLineDto = Pick<OrderLineDto, 'lineId' | 'description' | 'quantity' | 'unitCode'> & {
  lineId: string
}

export type CreateDespatchPayload = {
  orderId: string
  despatchId?: string
  despatchDate: string
  despatchStatus?: 'not_despatched' | 'despatched' | 'partially_despatched'
  carrierName?: string
  trackingId?: string
  notes?: string
  supplierParty: OrderPartyDto
  deliveryParty: OrderPartyDto
  lines: DespatchLineDto[]
}
