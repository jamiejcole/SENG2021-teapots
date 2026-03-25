import { apiBlob, apiJson, apiText } from '@/api/client'

export type InvoiceSupplement = {
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
  return await apiText('/invoices', {
    method: 'POST',
    headers: {
      Accept: 'application/xml',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderXml, invoiceSupplement }),
  })
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

export async function deleteInvoiceById(invoiceId: string) {
  await apiText(`/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'DELETE',
  })
}

