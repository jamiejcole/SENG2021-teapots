import { useMemo, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { createInvoice, createInvoicePdf, type InvoiceSupplement } from '@/api/invoices'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

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
      toast.success('Copied Invoice XML')
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
        <Badge variant="secondary" className="w-fit">
          No Zod
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-base">Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orderXml">Order XML</Label>
              <Textarea
                id="orderXml"
                value={orderXml}
                onChange={(e) => setOrderXml(e.target.value)}
                placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<Order>...</Order>'}
                className="min-h-72 rounded-2xl font-mono text-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Currency code</Label>
                <Input id="currencyCode" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax rate</Label>
                <Input id="taxRate" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxSchemeId">Tax scheme id</Label>
                <Input id="taxSchemeId" value={taxSchemeId} onChange={(e) => setTaxSchemeId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxTypeCode">Tax type code</Label>
                <Input id="taxTypeCode" value={taxTypeCode} onChange={(e) => setTaxTypeCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentCode">Payment means code</Label>
                <Input id="paymentCode" value={paymentCode} onChange={(e) => setPaymentCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountId">Payee account id</Label>
                <Input id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="accountName">Payee account name</Label>
                <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={onGenerate} disabled={!canGenerate} className="rounded-xl bg-amber-400 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500">
                {isGenerating ? 'Generating…' : 'Generate invoice'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setOrderXml('')
                  setInvoiceXml(null)
                  setError(null)
                }}
                disabled={isGenerating}
                className="rounded-full"
              >
                Clear
              </Button>
            </div>

            {!supplement && (
              <Alert variant="destructive">
                <AlertTitle>Invalid input</AlertTitle>
                <AlertDescription>Tax rate must be a number.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-base">Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Generation failed</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="invoiceXml">Invoice XML</Label>
              {isGenerating ? (
                <Skeleton className="h-72 w-full rounded-2xl" />
              ) : (
                <Textarea
                  id="invoiceXml"
                  value={invoiceXml ?? ''}
                  readOnly
                  placeholder="Generate an invoice to see the XML here."
                  className="min-h-72 rounded-2xl font-mono text-xs"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={onCopy} disabled={!invoiceXml} className="rounded-xl bg-amber-400 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500">
                Copy XML
              </Button>
              <Button
                variant="secondary"
                onClick={() => invoiceXml && downloadText('invoice.xml', invoiceXml, 'application/xml')}
                disabled={!invoiceXml}
                className="rounded-full"
              >
                Download XML
              </Button>
              <Button variant="secondary" onClick={onPdf} disabled={!invoiceXml || isPdfLoading} className="rounded-full">
                {isPdfLoading ? 'Creating PDF…' : 'Download PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

