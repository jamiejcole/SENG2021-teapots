import { getApiBaseUrl } from '@/config'

function defaultHeaders(): HeadersInit {
  const key = (import.meta.env.VITE_API_KEY as string | undefined)?.trim()
  return key ? { 'x-api-key': key } : {}
}

export type ApiErrorShape = {
  message?: string
  error?: string
  details?: unknown
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function readErrorBody(res: Response) {
  const contentType = res.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) return (await res.json()) as unknown
    return await res.text()
  } catch {
    return null
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...defaultHeaders(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await readErrorBody(res)
    const msg =
      (typeof body === 'object' && body && 'message' in body && typeof (body as ApiErrorShape).message === 'string'
        ? (body as ApiErrorShape).message
        : `Request failed (${res.status})`) ?? `Request failed (${res.status})`
    throw new ApiError(msg, res.status, body)
  }

  return (await res.json()) as T
}

export async function apiText(path: string, init?: RequestInit): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...defaultHeaders(), ...(init?.headers ?? {}) },
  })

  if (!res.ok) {
    const body = await readErrorBody(res)
    const msg =
      (typeof body === 'object' && body && 'message' in body && typeof (body as ApiErrorShape).message === 'string'
        ? (body as ApiErrorShape).message
        : `Request failed (${res.status})`) ?? `Request failed (${res.status})`
    throw new ApiError(msg, res.status, body)
  }

  return await res.text()
}

export async function apiBlob(path: string, init?: RequestInit): Promise<Blob> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...defaultHeaders(), ...(init?.headers ?? {}) },
  })

  if (!res.ok) {
    const body = await readErrorBody(res)
    const msg =
      (typeof body === 'object' && body && 'message' in body && typeof (body as ApiErrorShape).message === 'string'
        ? (body as ApiErrorShape).message
        : `Request failed (${res.status})`) ?? `Request failed (${res.status})`
    throw new ApiError(msg, res.status, body)
  }

  return await res.blob()
}

