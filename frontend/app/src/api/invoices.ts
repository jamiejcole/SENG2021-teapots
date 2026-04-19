import { apiBlob, apiJson, apiText, apiTextWithHeaders } from '@/api/client'

export type InvoiceSupplement = {
  invoiceNumber?: string
  issueDate?: string
  dueDate?: string
  note?: string
  currencyCode: string
  taxRate: number
  taxScheme: {
    id: string
    taxTypeCode: string
  }
  paymentMeans: {
    code: string
    payeeFinancialAccount: {
      id: string
      name: string
    }
  }
  paymentTerms?: {
    note: string
  }
}

export type InvoiceStudioLineItem = {
  id?: string
  name: string
  details?: string
  quantity: number
  rate: number
}

export type InvoiceStudioPreviewDraft = {
  businessName: string
  businessPhone: string
  businessEmail: string
  businessAddress: string
  customerName: string
  customerAddress: string
  invoiceNumber: string
  issueDate: string
  dueDate?: string
  jobSummary: string
  notes: string
  paymentNotes: string
  taxRate: number
  theme?: 'light' | 'dark'
  lineItems: InvoiceStudioLineItem[]
}

export type StoredInvoiceParty = {
  name: string
  id?: string
  email?: string
  address: { street: string; city: string; postalCode: string; country: string }
}

export type StoredInvoiceLine = {
  lineId: string
  description: string
  quantity: number
  unitCode?: string
  unitPrice: number
  taxRate: number
}

export type StoredInvoiceActivity = {
  at: string
  type: string
  message: string
  meta?: unknown
}

export type StoredInvoiceSummary = {
  _id: string
  invoiceId: string
  issueDate: string
  currency: string
  lifecycleStatus: string
  status: string
  buyer: StoredInvoiceParty
  seller: StoredInvoiceParty
  lines: StoredInvoiceLine[]
  orderReference?: { orderId?: string }
  paymentTerms?: string
  totals: { subTotal: number; taxTotal: number; payableAmount: number }
  sentAt?: string
  sentTo?: string
  lastError?: string
  pdfInvoiceHash?: string
  activity?: StoredInvoiceActivity[]
  createdAt?: string
  updatedAt?: string
}

export type StoredInvoiceDetail = StoredInvoiceSummary & {
  invoiceXml: string
}

export type DashboardStats = {
  totalInvoices: number
  revenueTotal: number
  sentCount: number
  validatedCount: number
  failedSendCount: number
  pendingCount: number
  totalOrders: number
  ordersCancelled: number
  ordersOpen: number
  totalDespatches: number
  despatchesFulfilmentCancelled: number
  throughputByDay: { date: string; count: number; revenue: number }[]
  recentActivity: {
    id: string
    invoiceMongoId: string
    invoiceId: string
    type: string
    message: string
    at: string
  }[]
}

export async function validateOrder(orderXml: string) {
  return await apiJson<{ message: string }>('/orders/validate', {
    method: 'POST',
    body: JSON.stringify({ orderXml }),
  })
}

export async function validateInvoice(invoiceXml: string) {
  return await apiJson<{ message: string }>('/invoices/validate', {
    method: 'POST',
    body: JSON.stringify({ invoiceXml }),
  })
}

export async function createInvoice(orderXml: string, invoiceSupplement: InvoiceSupplement) {
  const { text, headers } = await apiTextWithHeaders('/invoices', {
    method: 'POST',
    headers: {
      Accept: 'application/xml',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderXml, invoiceSupplement }),
  })
  const storedInvoiceId = headers.get('X-Stored-Invoice-Id')?.trim() || null
  return { invoiceXml: text, storedInvoiceId }
}

export async function createInvoicePdf(invoiceXml: string) {
  return await apiBlob('/invoices/pdf', {
    method: 'POST',
    headers: {
      Accept: 'application/pdf',
      'Content-Type': 'application/xml',
    },
    body: invoiceXml,
  })
}

export async function previewStudioInvoice(draft: InvoiceStudioPreviewDraft) {
  return await apiText('/invoices/studio-preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  })
}

export async function sendInvoiceEmail(invoiceXml: string, to: string, storedInvoiceId?: string | null) {
  return await apiJson<{ message: string; to: string }>('/invoices/email', {
    method: 'POST',
    body: JSON.stringify({
      invoiceXml,
      to,
      ...(storedInvoiceId ? { storedInvoiceId } : {}),
    }),
  })
}

export async function deleteInvoiceById(invoiceId: string) {
  await apiText(`/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'DELETE',
  })
}

export async function fetchDashboardStats() {
  return await apiJson<DashboardStats>('/invoices/dashboard-stats', { method: 'GET' })
}

export async function listStoredInvoices() {
  return await apiJson<{ invoices: StoredInvoiceSummary[] }>('/invoices', { method: 'GET' })
}

export async function getStoredInvoice(invoiceId: string) {
  return await apiJson<StoredInvoiceDetail>(`/invoices/${encodeURIComponent(invoiceId)}`, { method: 'GET' })
}

export async function patchStoredInvoice(
  invoiceId: string,
  body: { lifecycleStatus?: string; paymentTermsNote?: string },
) {
  return await apiJson<StoredInvoiceSummary>(`/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function validateStoredInvoice(invoiceId: string) {
  return await apiJson<StoredInvoiceSummary>(`/invoices/${encodeURIComponent(invoiceId)}/validate`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function regenerateStoredInvoice(invoiceId: string, invoiceSupplement: InvoiceSupplement) {
  return await apiJson<StoredInvoiceDetail>(`/invoices/${encodeURIComponent(invoiceId)}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ invoiceSupplement }),
  })
}
