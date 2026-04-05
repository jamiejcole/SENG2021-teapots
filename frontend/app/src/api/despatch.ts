import { apiJson } from '@/api/client'
import { getApiBaseUrl } from '@/config'

export type DespatchAdviceItem = {
  'advice-id': string
  'executed-at': number
  'despatch-advice'?: string
}

export type CreateDespatchResponse = {
  success: boolean
  adviceIds: string[]
  'executed-at': number
}

export type ListDespatchResponse = {
  results: DespatchAdviceItem[]
  'executed-at': number
}

export type RetrieveDespatchResponse = {
  'despatch-advice': string
  'advice-id': string
  'executed-at': number
}

export type OrderCancellationResponse = {
  'order-cancellation': string
  'order-cancellation-reason': string
  'order-cancellation-id': string
  'advice-id': string
  'executed-at': string
}

export type FulfilmentCancellationResponse = {
  'fulfilment-cancellation': string
  'fulfilment-cancellation-reason': string
  'fulfilment-cancellation-id': string
  'advice-id': string
  'executed-at': string
}

export async function createDespatchAdvice(orderXml: string): Promise<CreateDespatchResponse> {
  const res = await fetch(`${getApiBaseUrl()}/despatch/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      Authorization: `Bearer ${localStorage.getItem('auth_access_token') ?? ''}`,
    },
    body: orderXml,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(body.message ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<CreateDespatchResponse>
}

export async function listDespatchAdvices(): Promise<ListDespatchResponse> {
  return apiJson<ListDespatchResponse>('/despatch/list')
}

export async function retrieveDespatchAdvice(adviceId: string): Promise<RetrieveDespatchResponse> {
  return apiJson<RetrieveDespatchResponse>(
    `/despatch/retrieve?search-type=advice-id&query=${encodeURIComponent(adviceId)}`
  )
}

export async function cancelOrder(
  adviceId: string,
  cancellationDocument: string
): Promise<OrderCancellationResponse> {
  return apiJson<OrderCancellationResponse>('/despatch/cancel/order', {
    method: 'POST',
    body: JSON.stringify({ 'advice-id': adviceId, 'order-cancellation-document': cancellationDocument }),
  })
}

export async function cancelFulfilment(
  adviceId: string,
  reason: string
): Promise<FulfilmentCancellationResponse> {
  return apiJson<FulfilmentCancellationResponse>('/despatch/cancel/fulfilment', {
    method: 'POST',
    body: JSON.stringify({ 'advice-id': adviceId, 'fulfilment-cancellation-reason': reason }),
  })
}

export async function getOrderCancellation(adviceId: string): Promise<OrderCancellationResponse | null> {
  try {
    return await apiJson<OrderCancellationResponse>(
      `/despatch/cancel/order?advice-id=${encodeURIComponent(adviceId)}`
    )
  } catch {
    return null
  }
}

export async function getFulfilmentCancellation(
  adviceId: string
): Promise<FulfilmentCancellationResponse | null> {
  try {
    return await apiJson<FulfilmentCancellationResponse>(
      `/despatch/cancel/fulfilment?advice-id=${encodeURIComponent(adviceId)}`
    )
  } catch {
    return null
  }
}
