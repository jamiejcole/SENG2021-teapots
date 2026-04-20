import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Download, Mail, Package, ReceiptText, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Select } from '@/components/ui/select'
import {
  createInvoice,
  createInvoicePdf,
  sendInvoiceEmail,
  validateInvoice,
  validateOrder,
  validateStoredInvoice,
  type InvoiceSupplement,
} from '@/api/invoices'
import { fetchOrderXml, getOrder, listOrders, type StoredOrderSummary } from '@/api/orders'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { XmlUploadButton } from '@/components/XmlUploadButton'
import { DocumentUploader } from '@/components/ai/DocumentUploader'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

/** Same outline treatment as the Output card “Validate” control */
const outlineValidateStyle =
  'h-8 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40'

const orderStatusBadge: Record<string, string> = {
  draft: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  created: 'border-sky-300/70 bg-sky-100 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300',
  cancelled: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300',
  fulfilled: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300',
  partially_fulfilled: 'border-amber-300/70 bg-amber-100 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300',
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function GenerateInvoicePage() {
  const [searchParams] = useSearchParams()
  const orderKeyFromUrl = searchParams.get('orderKey')?.trim() ?? ''

  const [orderXml, setOrderXml] = useState('')
  const [storedOrders, setStoredOrders] = useState<StoredOrderSummary[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrderKey, setSelectedOrderKey] = useState('')

  const [currencyCode, setCurrencyCode] = useState('AUD')
  const [taxRate, setTaxRate] = useState('0.1')
  const [taxSchemeId, setTaxSchemeId] = useState('GST')
  const [taxTypeCode, setTaxTypeCode] = useState('GST')
  const [paymentCode, setPaymentCode] = useState('30')
  const [accountId, setAccountId] = useState('12345678')
  const [accountName, setAccountName] = useState('Main account')
  const [paymentTermsNote, setPaymentTermsNote] = useState('Net 30 days')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [invoiceNote, setInvoiceNote] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [invoiceXml, setInvoiceXml] = useState<string | null>(null)
  const [storedInvoiceId, setStoredInvoiceId] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isValidatingOrder, setIsValidatingOrder] = useState(false)
  const [isValidatingInvoice, setIsValidatingInvoice] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [emailTo, setEmailTo] = useState('')

  const loadOrdersList = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const r = await listOrders()
      setStoredOrders(r.orders ?? [])
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not load orders'
      toast.error('Orders list failed', { description: msg })
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrdersList()
  }, [loadOrdersList])

  const orderPickOptions = useMemo(() => {
    const placeholder = { value: '', label: ordersLoading ? 'Loading…' : 'Select an order…' }
    if (ordersLoading) return [placeholder]
    return [
      placeholder,
      ...storedOrders.map((o) => ({
        value: o._id,
        label: o.orderId,
        secondary: `${o.currency} · ${o.buyer.name}`,
        badge: { label: o.orderStatus, className: orderStatusBadge[o.orderStatus] ?? '' },
      })),
    ]
  }, [storedOrders, ordersLoading])

  useEffect(() => {
    if (!orderKeyFromUrl) return
    setSelectedOrderKey(orderKeyFromUrl)
    let cancelled = false
    ;(async () => {
      try {
        const xml = await fetchOrderXml(orderKeyFromUrl)
        if (cancelled) return
        setOrderXml(xml)
        setInvoiceXml(null)
        setStoredInvoiceId(null)
        try {
          const row = await getOrder(orderKeyFromUrl)
          if (!cancelled && row.buyer.email?.trim()) setEmailTo(row.buyer.email.trim())
        } catch {
          /* optional */
        }
        toast.success('Loaded order XML from your account')
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : 'Could not load order XML'
          toast.error('Load order failed', { description: msg })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderKeyFromUrl])

  async function loadSelectedOrderIntoEditor() {
    if (!selectedOrderKey) {
      toast.error('Select a stored order')
      return
    }
    try {
      const xml = await fetchOrderXml(selectedOrderKey)
      setOrderXml(xml)
      setInvoiceXml(null)
      setStoredInvoiceId(null)
      try {
        const row = await getOrder(selectedOrderKey)
        if (row.buyer.email?.trim()) setEmailTo(row.buyer.email.trim())
      } catch {
        /* optional */
      }
      toast.success('Order XML loaded — ready to generate invoice')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not load order XML'
      toast.error('Load failed', { description: msg })
    }
  }

  const supplement: InvoiceSupplement | null = useMemo(() => {
    const parsedTaxRate = Number(taxRate)
    if (!Number.isFinite(parsedTaxRate)) return null
    return {
      currencyCode: currencyCode.trim(),
      taxRate: parsedTaxRate,
      taxScheme: { id: taxSchemeId.trim(), taxTypeCode: taxTypeCode.trim() },
      paymentMeans: {
        code: paymentCode.trim(),
        payeeFinancialAccount: { id: accountId.trim(), name: accountName.trim() },
      },
      ...(paymentTermsNote.trim() ? { paymentTerms: { note: paymentTermsNote.trim() } } : {}),
      ...(issueDate.trim() ? { issueDate: issueDate.trim() } : {}),
      ...(dueDate.trim() ? { dueDate: dueDate.trim() } : {}),
      ...(invoiceNote.trim() ? { note: invoiceNote.trim() } : {}),
    }
  }, [
    accountId,
    accountName,
    currencyCode,
    dueDate,
    invoiceNote,
    issueDate,
    paymentCode,
    paymentTermsNote,
    taxRate,
    taxSchemeId,
    taxTypeCode,
  ])

  const canGenerate = useMemo(() => {
    if (isGenerating) return false
    if (!orderXml.trim()) return false
    if (!supplement) return false
    if (!supplement.currencyCode) return false
    if (!supplement.taxScheme.id || !supplement.taxScheme.taxTypeCode) return false
    if (!supplement.paymentMeans.code) return false
    if (!supplement.paymentMeans.payeeFinancialAccount.id || !supplement.paymentMeans.payeeFinancialAccount.name) return false
    return true
  }, [isGenerating, orderXml, supplement])

  const canValidateOrder = orderXml.trim().length > 0 && !isGenerating && !isValidatingOrder

  const canValidateInvoice =
    !!invoiceXml?.trim() && !isGenerating && !isValidatingInvoice

  async function onValidateOrder() {
    const trimmed = orderXml.trim()
    if (!trimmed) return
    setIsValidatingOrder(true)
    try {
      const res = await validateOrder(trimmed)
      const message = res.message ?? 'UBL Order is valid.'
      toast.success('Order is valid', { description: message })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Validation failed'
      toast.error('Order validation failed', { description: msg })
    } finally {
      setIsValidatingOrder(false)
    }
  }

  async function onValidateInvoiceOutput() {
    const trimmed = invoiceXml?.trim()
    if (!trimmed) return
    setIsValidatingInvoice(true)
    try {
      const res = await validateInvoice(trimmed)
      const message = res.message ?? 'UBL Invoice is valid.'
      toast.success('Invoice is valid', { description: message })
      if (storedInvoiceId) {
        try {
          await validateStoredInvoice(storedInvoiceId)
          toast.success('Stored copy marked validated', { description: 'Server-side UBL check passed.' })
        } catch {
          /* optional — ignore if duplicate validate */
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Validation failed'
      toast.error('Invoice validation failed', { description: msg })
    } finally {
      setIsValidatingInvoice(false)
    }
  }

  async function onGenerate() {
    const trimmed = orderXml.trim()
    if (!trimmed || !supplement) return

    setIsGenerating(true)
    setInvoiceXml(null)
    setStoredInvoiceId(null)
    try {
      const { invoiceXml: xml, storedInvoiceId: sid } = await createInvoice(trimmed, supplement)
      setInvoiceXml(xml)
      setStoredInvoiceId(sid)
      toast.success('Invoice XML generated', {
        description: sid ? 'Saved to your account.' : 'Persisted id not returned (duplicate XML hash or legacy row).',
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate invoice'
      toast.error('Generation failed', { description: msg })
    } finally {
      setIsGenerating(false)
    }
  }

  async function onCopyOrderXml() {
    const t = orderXml.trim()
    if (!t) {
      toast.error('No order XML to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(t)
      toast.success('Order XML copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  async function onCopyInvoiceXml() {
    if (!invoiceXml?.trim()) return
    try {
      await navigator.clipboard.writeText(invoiceXml)
      toast.success('Invoice XML copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  async function onPdf() {
    if (!invoiceXml) return
    setIsPdfLoading(true)
    try {
      const pdf = await createInvoicePdf(invoiceXml)
      downloadBlob('invoice.pdf', pdf)
      toast.success('PDF downloaded')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create PDF'
      toast.error('PDF failed', { description: msg })
    } finally {
      setIsPdfLoading(false)
    }
  }

  async function onEmail() {
    if (!emailTo.trim()) {
      toast.error('Enter an email address')
      return
    }
    if (!invoiceXml) return
    setIsEmailSending(true)
    try {
      const result = await sendInvoiceEmail(invoiceXml, emailTo.trim(), storedInvoiceId)
      toast.success('Invoice email sent', { description: `Sent to ${result.to}` })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send invoice email'
      toast.error('Email send failed', { description: msg })
    } finally {
      setIsEmailSending(false)
    }
  }

  async function loadSampleUbl() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample-ubl-order.xml`)
      if (!res.ok) throw new Error('Not found')
      const text = await res.text()
      setOrderXml(text)
      setInvoiceXml(null)
      setStoredInvoiceId(null)
      toast.success('Sample UBL order loaded')
    } catch {
      toast.error('Could not load sample UBL file')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <ReceiptText className="size-3.5" />
            Generation
          </div>
          <h1 className="font-display text-3xl tracking-tight">Generate Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Generate Invoice XML (and PDF) from a <strong className="font-medium text-foreground">UBL 2.x Order</strong> — not plain custom XML.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Input</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onValidateOrder()}
                disabled={!canValidateOrder}
                className={cn(outlineValidateStyle, 'shrink-0')}
              >
                <ShieldCheck className="size-4" />
                {isValidatingOrder ? 'Validating…' : 'Validate'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-xl border border-amber-200/50 bg-amber-50/40 p-3 dark:border-amber-800/40 dark:bg-amber-950/25">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">From stored order</span>
                <p className="text-xs text-muted-foreground">
                  Load UBL order XML saved under Orders — same payload used when generating an invoice from scratch.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label htmlFor="stored-order-pick" className="text-xs">
                    Order
                  </Label>
                  <Select
                    id="stored-order-pick"
                    value={selectedOrderKey}
                    onValueChange={setSelectedOrderKey}
                    options={orderPickOptions}
                    disabled={ordersLoading}
                    searchable={storedOrders.length > 5}
                    searchPlaceholder="Search orders…"
                    placeholder="Select an order…"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 shrink-0 rounded-lg"
                  disabled={!selectedOrderKey || ordersLoading}
                  onClick={() => void loadSelectedOrderIntoEditor()}
                >
                  Load order XML
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 rounded-lg" asChild>
                  <Link to="/orders" className="inline-flex items-center gap-1.5">
                    <Package className="size-4" /> Orders
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label htmlFor="orderXml">Order XML</Label>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
                    disabled={!orderXml.trim()}
                    onClick={() => void onCopyOrderXml()}
                  >
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
                    onClick={() => void loadSampleUbl()}
                  >
                    Load sample UBL
                  </Button>
                </div>
              </div>
              <Textarea
                id="orderXml"
                value={orderXml}
                onChange={(e) => setOrderXml(e.target.value)}
                placeholder="UBL 2.x Order XML"
                className="min-h-24 rounded-xl font-mono text-xs resize-y"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currencyCode">Currency</Label>
                <Input id="currencyCode" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxRate">Tax rate</Label>
                <Input id="taxRate" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxSchemeId">Tax scheme</Label>
                <Input id="taxSchemeId" value={taxSchemeId} onChange={(e) => setTaxSchemeId(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxTypeCode">Tax type</Label>
                <Input id="taxTypeCode" value={taxTypeCode} onChange={(e) => setTaxTypeCode(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentCode">Payment code</Label>
                <Input id="paymentCode" value={paymentCode} onChange={(e) => setPaymentCode(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountId">Account ID</Label>
                <Input id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="accountName">Account name</Label>
                <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="paymentTermsNote">Payment terms (note)</Label>
                <Input
                  id="paymentTermsNote"
                  value={paymentTermsNote}
                  onChange={(e) => setPaymentTermsNote(e.target.value)}
                  className="h-8 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issueDate">Issue date</Label>
                <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 rounded-lg" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="invoiceNote">Invoice note (optional)</Label>
                <Input id="invoiceNote" value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} className="h-8 rounded-lg" />
              </div>
            </div>

            <DocumentUploader
              onExtracted={(fields) => {
                if (fields.currency) setCurrencyCode(fields.currency)
                if (fields.issueDate) setIssueDate(fields.issueDate)
              }}
            />

            <div className="mx-auto grid w-full max-w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="min-w-0">
                <XmlUploadButton
                  onUpload={(xml) => {
                    setOrderXml(xml)
                    setInvoiceXml(null)
                    setStoredInvoiceId(null)
                  }}
                  className={cn(
                    outlineValidateStyle,
                    'h-10 w-full min-w-0 justify-center gap-1.5 px-2 text-sm sm:px-3',
                  )}
                />
              </div>
              <Button
                onClick={onGenerate}
                disabled={!canGenerate}
                className="h-10 w-full min-w-0 justify-center rounded-lg bg-amber-400 px-2 text-sm font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500 sm:px-3"
              >
                {isGenerating ? 'Generating…' : 'Generate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOrderXml('')
                  setInvoiceXml(null)
                  setStoredInvoiceId(null)
                }}
                disabled={isGenerating}
                className="h-10 w-full min-w-0 justify-center rounded-lg px-2 text-sm sm:px-3"
              >
                Clear
              </Button>
            </div>

          </CardContent>
        </Card>

        <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Output</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onValidateInvoiceOutput()}
                disabled={!canValidateInvoice}
                className={cn(outlineValidateStyle, 'shrink-0')}
              >
                <ShieldCheck className="size-4" />
                {isValidatingInvoice ? 'Validating…' : 'Validate'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceXml">Invoice XML</Label>
              {isGenerating ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : (
                <Textarea
                  id="invoiceXml"
                  value={invoiceXml ?? ''}
                  readOnly
                  placeholder="XML"
                  className="min-h-24 rounded-xl font-mono text-xs resize-y"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void onCopyInvoiceXml()}
                disabled={!invoiceXml}
                variant="outline"
                className="h-9 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-400 dark:hover:text-slate-900"
              >
                <Copy className="size-4" />
                Copy XML
              </Button>
              <Button
                variant="outline"
                onClick={() => invoiceXml && downloadText('invoice.xml', invoiceXml, 'application/xml')}
                disabled={!invoiceXml}
                className="h-9 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-400 dark:hover:text-slate-900"
              >
                <Download className="size-4" />
                XML
              </Button>
              <Button
                variant="outline"
                onClick={onPdf}
                disabled={!invoiceXml || isPdfLoading}
                className="h-9 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-400 dark:hover:text-slate-900"
              >
                <Download className="size-4" />
                {isPdfLoading ? '…' : 'PDF'}
              </Button>
            </div>

            {storedInvoiceId && (
              <p className="text-xs text-muted-foreground">
                Stored invoice ID:{' '}
                <Link className="font-medium text-amber-700 underline dark:text-amber-400" to={`/invoices/${storedInvoiceId}`}>
                  open detail
                </Link>
              </p>
            )}

            <div className="space-y-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <Label className="text-amber-900 dark:text-amber-100">Email invoice</Label>
              <div className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="h-9 w-full rounded-lg border-amber-300 bg-white dark:border-amber-700 dark:bg-slate-900"
                />
                <Button
                  onClick={onEmail}
                  disabled={!invoiceXml || isEmailSending}
                  className="h-9 gap-1.5 rounded-lg bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
                >
                  <Mail className="size-4" />
                  {isEmailSending ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
