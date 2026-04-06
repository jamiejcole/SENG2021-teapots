import { apiJson, apiText } from '@/api/client'
import type { CreateOrderPayload, OrderLineDto, OrderPartyDto } from '@/types/orders'

export type StoredOrderSummary = {
  _id: string
  orderId: string
  issueDate: string
  currency: string
  orderStatus: string
  status: string
  invoiceStatusNote?: string
  buyer: OrderPartyDto
  seller: OrderPartyDto
  lines: Array<OrderLineDto & { taxRate?: number }>
  totals: { subTotal: number; taxTotal: number; payableAmount: number }
  delivery?: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
    deliveryStart?: string
    deliveryEnd?: string
  }
  deliveryTerms?: string
  createdAt?: string
  updatedAt?: string
}

export async function listOrders() {
  return await apiJson<{ orders: StoredOrderSummary[] }>('/orders', { method: 'GET' })
}

export async function createOrder(payload: CreateOrderPayload) {
  return await apiJson<StoredOrderSummary>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateOrder(orderKey: string, payload: CreateOrderPayload) {
  return await apiJson<StoredOrderSummary>(`/orders/${encodeURIComponent(orderKey)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getOrder(orderKey: string) {
  return await apiJson<StoredOrderSummary>(`/orders/${encodeURIComponent(orderKey)}`, { method: 'GET' })
}

export async function deleteOrder(orderKey: string) {
  await apiText(`/orders/${encodeURIComponent(orderKey)}`, { method: 'DELETE' })
}

export async function fetchOrderXml(orderKey: string) {
  return await apiText(`/orders/${encodeURIComponent(orderKey)}/xml`, {
    method: 'GET',
    headers: { Accept: 'application/xml' },
  })
}

export async function validateOrderPayload(payload: CreateOrderPayload) {
  return await apiJson<{ message: string }>('/orders/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function validateOrderXml(orderXml: string) {
  return await apiJson<{ message: string }>('/orders/validate', {
    method: 'POST',
    body: JSON.stringify({ orderXml }),
  })
}
