import { apiJson, apiText } from '@/api/client'

export type OrderListItem = {
  _id: string
  orderId: string
  status: string
  issueDate: string
  currency: string
  buyer: { name: string; address: { city?: string; country?: string } }
  seller: { name: string }
  lines: Array<{ lineId: string; description: string; quantity: number; unitPrice: number }>
  totals: { subTotal: number; taxTotal: number; payableAmount: number }
  createdAt: string
  updatedAt: string
}

export type CreateOrderResponse = {
  orderId: string
  status: string
  ublXmlUrl: string
}

export async function createOrder(data: Record<string, unknown>): Promise<CreateOrderResponse> {
  return apiJson<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({ data }),
  })
}

export async function listOrders(): Promise<OrderListItem[]> {
  return apiJson<OrderListItem[]>('/orders')
}

export async function getOrder(orderId: string): Promise<OrderListItem> {
  return apiJson<OrderListItem>(`/orders/${encodeURIComponent(orderId)}`)
}

export async function getOrderXml(orderId: string): Promise<string> {
  return apiText(`/orders/${encodeURIComponent(orderId)}/xml`)
}

export async function deleteOrder(orderId: string): Promise<void> {
  await apiJson(`/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' })
}

export async function validateOrderXml(orderXml: string): Promise<{ message: string }> {
  return apiJson<{ message: string }>('/orders/validate', {
    method: 'POST',
    body: JSON.stringify({ orderXml }),
  })
}
