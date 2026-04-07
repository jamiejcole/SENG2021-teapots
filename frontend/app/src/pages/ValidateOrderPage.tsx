import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Copy, ShieldCheck } from 'lucide-react'
import { validateOrder, validateInvoice } from '@/api/invoices'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { XmlUploadButton } from '@/components/XmlUploadButton'
import { toast } from '@/lib/toast'

type ValidationSectionProps = {
  title: string
  description: string
  xml: string
  setXml: (v: string) => void
  onValidate: () => void
  isLoading: boolean
}

function ValidationSection({
  title,
  description,
  xml,
  setXml,
  onValidate,
  isLoading,
}: ValidationSectionProps) {
  const canSubmit = xml.trim().length > 0 && !isLoading
  const canCopyXml = xml.trim().length > 0 && !isLoading

  async function copySectionXml() {
    const t = xml.trim()
    if (!t) {
      toast.error('Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(t)
      toast.success('XML copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <XmlUploadButton onUpload={setXml} className="rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>XML</Label>
          <Textarea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            placeholder="XML"
            className="min-h-24 rounded-xl font-mono text-xs resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onValidate}
            disabled={!canSubmit}
            className="rounded-lg bg-amber-400 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500"
          >
            {isLoading ? 'Validating…' : 'Validate'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
            disabled={!canCopyXml}
            onClick={() => void copySectionXml()}
          >
            <Copy className="size-4" />
            Copy XML
          </Button>
          <Button variant="outline" onClick={() => setXml('')} disabled={isLoading} className="rounded-lg">
            Clear
          </Button>
        </div>
        {isLoading && <Skeleton className="h-12 w-full rounded-xl" />}
      </CardContent>
    </Card>
  )
}

export function ValidateOrderPage() {
  const location = useLocation()
  const stateInvoice = (location.state as { invoiceXml?: string } | null)?.invoiceXml
  const [orderXml, setOrderXml] = useState('')
  const [invoiceXml, setInvoiceXml] = useState(stateInvoice ?? '')
  const [orderLoading, setOrderLoading] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  async function onValidateOrder() {
    const trimmed = orderXml.trim()
    if (!trimmed) return
    setOrderLoading(true)
    try {
      const res = await validateOrder(trimmed)
      toast.success('Order is valid', { description: res.message ?? 'UBL Order is valid.' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Validation failed'
      toast.error('Validation failed', { description: msg })
    } finally {
      setOrderLoading(false)
    }
  }

  async function onValidateInvoice() {
    const trimmed = invoiceXml.trim()
    if (!trimmed) return
    setInvoiceLoading(true)
    try {
      const res = await validateInvoice(trimmed)
      toast.success('Invoice is valid', { description: res.message ?? 'UBL Invoice is valid.' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Validation failed'
      toast.error('Validation failed', { description: msg })
    } finally {
      setInvoiceLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <ShieldCheck className="size-3.5" />
            Validation
          </div>
          <h1 className="font-display text-3xl tracking-tight">Validate</h1>
          <p className="text-sm text-muted-foreground">
            Validate UBL Order or Invoice XML against XSD schemas. Results appear as toasts.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ValidationSection
          title="Validate Order XML"
          description="UBL Order XSD validation"
          xml={orderXml}
          setXml={setOrderXml}
          onValidate={onValidateOrder}
          isLoading={orderLoading}
        />
        <ValidationSection
          title="Validate Invoice XML"
          description="UBL Invoice XSD validation"
          xml={invoiceXml}
          setXml={setInvoiceXml}
          onValidate={onValidateInvoice}
          isLoading={invoiceLoading}
        />
      </div>
    </div>
  )
}
