import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Download, Mail, ReceiptText, ShieldCheck } from 'lucide-react'
import { createInvoice, createInvoicePdf, type InvoiceSupplement } from '@/api/invoices'
import { ErrorAlertWithTeapot } from '@/components/feedback/ErrorTeapot'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { XmlUploadButton } from '@/components/XmlUploadButton'
import { toast } from '@/lib/toast'

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
  const [orderXml, setOrderXml] = useState('')

  const [currencyCode, setCurrencyCode] = useState('AUD')
  const [taxRate, setTaxRate] = useState('0.1')
  const [taxSchemeId, setTaxSchemeId] = useState('GST')
  const [taxTypeCode, setTaxTypeCode] = useState('GST')
  const [paymentCode, setPaymentCode] = useState('30')
  const [accountId, setAccountId] = useState('12345678')
  const [accountName, setAccountName] = useState('Main account')

  const [isGenerating, setIsGenerating] = useState(false)
  const [invoiceXml, setInvoiceXml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailFormat, setEmailFormat] = useState<'pdf' | 'xml'>('pdf')

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
    }
  }, [accountId, accountName, currencyCode, paymentCode, taxRate, taxSchemeId, taxTypeCode])

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

  async function onGenerate() {
    const trimmed = orderXml.trim()
    if (!trimmed || !supplement) return

    setIsGenerating(true)
    setError(null)
    setInvoiceXml(null)
    try {
      const xml = await createInvoice(trimmed, supplement)
      setInvoiceXml(xml)
      toast.success('Invoice XML generated')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate invoice'
      setError(msg)
      toast.error('Generation failed', { description: msg })
    } finally {
      setIsGenerating(false)
    }
  }

  async function onCopy() {
    if (!invoiceXml) return
    try {
      await navigator.clipboard.writeText(invoiceXml)
      toast.success('Copied to clipboard')
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

  function onEmail() {
    if (!emailTo.trim()) {
      toast.error('Enter an email address')
      return
    }
    if (!invoiceXml) return
    toast.info('Email will be sent when backend is connected', { description: `Would send as ${emailFormat.toUpperCase()} to ${emailTo}` })
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
          <p className="text-sm text-muted-foreground">Generate Invoice XML (and PDF) from a UBL Order.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Input</CardTitle>
              <XmlUploadButton onUpload={setOrderXml} className="rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderXml">Order XML</Label>
              <Textarea
                id="orderXml"
                value={orderXml}
                onChange={(e) => setOrderXml(e.target.value)}
                placeholder="XML"
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
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onGenerate} disabled={!canGenerate} className="rounded-lg bg-amber-400 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500">
                {isGenerating ? 'Generating…' : 'Generate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setOrderXml(''); setInvoiceXml(null); setError(null) }}
                disabled={isGenerating}
                className="rounded-lg"
              >
                Clear
              </Button>
            </div>

            {!supplement && (
              <ErrorAlertWithTeapot variant="destructive" title="Invalid input">
                Tax rate must be a number.
              </ErrorAlertWithTeapot>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Output</CardTitle>
              {invoiceXml ? (
                <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40">
                  <Link to="/validate" state={{ invoiceXml }}>
                    <ShieldCheck className="size-4" />
                    Validate
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="h-8 gap-1.5 rounded-lg border-amber-300 text-amber-800 opacity-50 dark:border-amber-700 dark:text-amber-200">
                  <ShieldCheck className="size-4" />
                  Validate
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <ErrorAlertWithTeapot variant="destructive" title="Generation failed">
                <span className="whitespace-pre-wrap">{error}</span>
              </ErrorAlertWithTeapot>
            )}

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
                onClick={onCopy}
                disabled={!invoiceXml}
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                title="Copy"
              >
                <Copy className="size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => invoiceXml && downloadText('invoice.xml', invoiceXml, 'application/xml')}
                disabled={!invoiceXml}
                className="h-9 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
              >
                <Download className="size-4" />
                XML
              </Button>
              <Button
                variant="outline"
                onClick={onPdf}
                disabled={!invoiceXml || isPdfLoading}
                className="h-9 gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
              >
                <Download className="size-4" />
                {isPdfLoading ? '…' : 'PDF'}
              </Button>
            </div>

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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailFormat('pdf')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${emailFormat === 'pdf' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-800/50'}`}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailFormat('xml')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${emailFormat === 'xml' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-800/50'}`}
                  >
                    XML
                  </button>
                </div>
                <Button
                  onClick={onEmail}
                  disabled={!invoiceXml}
                  className="h-9 gap-1.5 rounded-lg bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500"
                >
                  <Mail className="size-4" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
