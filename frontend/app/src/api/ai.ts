import { getApiBaseUrl } from '@/config'
import { ApiError } from './client'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface ExtractedFields {
  buyer?: {
    name?: string
    address?: { street?: string; city?: string; postalCode?: string; country?: string }
  }
  seller?: {
    name?: string
    address?: { street?: string; city?: string; postalCode?: string; country?: string }
  }
  lines?: Array<{ description?: string; quantity?: number; unitPrice?: number; taxRate?: number }>
  currency?: string
  issueDate?: string
  orderReference?: string
}

export async function extractDocument(file: File): Promise<ExtractedFields> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${getApiBaseUrl()}/ai/extract`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(body?.message ?? `Extraction failed (${res.status})`, res.status, body)
  }

  const data = (await res.json()) as { fields: ExtractedFields }
  return data.fields
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/ai/chat`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    onError(new ApiError(body?.message ?? `Chat failed (${res.status})`, res.status, body))
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    onError(new Error('No response body'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as { text?: string; done?: boolean; error?: string }
          if (parsed.error) {
            onError(new Error(parsed.error))
            return
          }
          if (parsed.text) onChunk(parsed.text)
          if (parsed.done) {
            onDone()
            return
          }
        } catch {
          // skip malformed SSE line
        }
      }
    }
    onDone()
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  } finally {
    reader.releaseLock()
  }
}
