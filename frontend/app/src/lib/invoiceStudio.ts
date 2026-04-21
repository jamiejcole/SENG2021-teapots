import type { InvoiceStudioPreviewDraft } from '@/api/invoices'

export type StudioLineItem = {
  id: string
  name: string
  details: string
  quantity: number
  rate: number
}

export type StudioDraft = {
  businessName: string
  businessPhone: string
  businessEmail: string
  businessAddress: string
  customerName: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  jobSummary: string
  notes: string
  paymentNotes: string
  extraNotes: string
  accountName: string
  accountNumber: string
  bsb: string
  taxRate: number
  lineItems: StudioLineItem[]
}

export function studioDraftToPreviewPayload(draft: StudioDraft, theme?: 'light' | 'dark'): InvoiceStudioPreviewDraft {
  return {
    ...draft,
    theme,
    lineItems: draft.lineItems.map(({ id, name, details, quantity, rate }) => ({
      id,
      name,
      details,
      quantity,
      rate,
    })),
  }
}

export function makeLineItem(id: string, name: string, details: string, quantity: number, rate: number): StudioLineItem {
  return { id, name, details, quantity, rate }
}

export function sampleStudioDraft(): StudioDraft {
  const today = new Date().toISOString().slice(0, 10)
  return {
    businessName: 'Northside Handyman Co.',
    businessPhone: '0400 123 456',
    businessEmail: 'hello@northsidehandyman.co',
    businessAddress: '14 Workshop Lane, Newcastle NSW 2300',
    customerName: 'John Doe',
    customerPhone: '+61 400 000 000',
    customerEmail: 'johndoe@example.com',
    customerAddress: '12 Station Street, Newcastle NSW 2300',
    invoiceNumber: 'STUDIO-1001',
    issueDate: today,
    dueDate: '',
    jobSummary: 'Fix loose gate latch, replace one damaged hinge, and do a quick tidy-up.',
    notes: 'Thanks for supporting a local sole trader.',
    paymentNotes: 'Pay by bank transfer within 7 days.',
    extraNotes: 'Please call before arrival.',
    accountName: 'Northside Handyman Co.',
    accountNumber: '12345678',
    bsb: '123-456',
    taxRate: 0.1,
    lineItems: [
      makeLineItem('1', 'Call-out fee', 'Initial visit and diagnosis', 1, 85),
      makeLineItem('2', 'Labour', '1.5 hours on site', 1.5, 72),
      makeLineItem('3', 'Parts', 'Hinge and fixings', 1, 28.5),
    ],
  }
}
