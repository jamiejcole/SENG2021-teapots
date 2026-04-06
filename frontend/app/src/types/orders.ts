/** Shared order form / API types (v2 Orders CRUD). */

export type OrderAddressDto = {
  street: string
  city: string
  postalCode: string
  country: string
}

export type OrderPartyDto = {
  name: string
  id?: string
  email?: string
  address: OrderAddressDto
}

export type OrderLineDto = {
  lineId?: string
  description: string
  quantity: number
  unitCode?: string
  unitPrice: number
}

export type OrderDeliveryDto = {
  address: OrderAddressDto
  requestedDeliveryStart?: string
  requestedDeliveryEnd?: string
}

export type CreateOrderPayload = {
  orderId: string
  issueDate: string
  currency: string
  taxRate?: number
  note?: string
  buyer: OrderPartyDto
  seller: OrderPartyDto
  lines: OrderLineDto[]
  delivery?: OrderDeliveryDto
  deliveryTerms?: string
  orderStatus?: 'draft' | 'created'
  invoiceStatusNote?: string
}
