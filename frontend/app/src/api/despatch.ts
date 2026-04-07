import { apiJson } from '@/api/client'
import type { CreateDespatchPayload } from '@/types/despatch'
import type { OrderPartyDto } from '@/types/orders'

export type DespatchLine = {
  lineId: string
  description: string
  quantity: number
  unitCode?: string
}

export type DespatchRecord = {
  _id: string
  despatchId: string
  orderId: string
  despatchStatus: string
  despatchDate: string
  carrierName?: string
  trackingId?: string
  notes?: string
  supplierParty: OrderPartyDto
  deliveryParty: OrderPartyDto
  lines: DespatchLine[]
  createdAt?: string
  updatedAt?: string
}

export async function createDespatch(payload: CreateDespatchPayload) {
  return await apiJson<DespatchRecord>('/despatch/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listDespatches(activeOnly?: boolean) {
  const q = activeOnly ? '?active=1' : ''
  return await apiJson<{ despatches: DespatchRecord[] }>(`/despatch/list${q}`, { method: 'GET' })
}

export async function retrieveDespatch(despatchId: string) {
  return await apiJson<DespatchRecord>(`/despatch/retrieve/${encodeURIComponent(despatchId)}`, { method: 'GET' })
}

export async function cancelOrderApi(orderId: string) {
  return await apiJson<unknown>('/despatch/cancel/order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  })
}

export async function listCancelledOrdersApi() {
  return await apiJson<{ orders: import('./orders').StoredOrderSummary[] }>('/despatch/cancel/order', {
    method: 'GET',
  })
}

export async function cancelFulfilmentApi(despatchId: string) {
  return await apiJson<DespatchRecord>('/despatch/cancel/fulfilment', {
    method: 'POST',
    body: JSON.stringify({ despatchId }),
  })
}

export async function listFulfilmentCancelledApi() {
  return await apiJson<{ despatches: DespatchRecord[] }>('/despatch/cancel/fulfilment', { method: 'GET' })
}

export async function sendDespatchEmail(despatchId: string, to: string) {
  return await apiJson<{ message: string; to: string }>('/despatch/email', {
    method: 'POST',
    body: JSON.stringify({ despatchId, to }),
  })
}
