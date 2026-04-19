import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Download,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  createInvoicePdf,
  deleteInvoiceById,
  getStoredInvoice,
  patchStoredInvoice,
  regenerateStoredInvoice,
  sendInvoiceEmail,
  validateStoredInvoice,
  type InvoiceSupplement,
  type StoredInvoiceDetail,
} from '@/api/invoices'
import { getPublicAppOrigin } from '@/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { ApiError } from '@/api/client'

const outlineBtn =
  'rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40'

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

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  downloadBlob(filename, blob)
}

const LIFECYCLE_EDIT = ['DRAFT', 'SAVED', 'PAID', 'OVERDUE'] as const

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<StoredInvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  /** Subset allowed by API for manual PATCH; empty string = do not change lifecycle. */
  const [lifecyclePick, setLifecyclePick] = useState('')
  const [paymentTermsNote, setPaymentTermsNote] = useState('')

  const [currencyCode, setCurrencyCode] = useState('AUD')
  const [taxRate, setTaxRate] = useState('0.1')
  const [taxSchemeId, setTaxSchemeId] = useState('GST')
  const [taxTypeCode, setTaxTypeCode] = useState('GST')
  const [paymentCode, setPaymentCode] = useState('30')
  const [accountId, setAccountId] = useState('12345678')
  const [accountName, setAccountName] = useState('Main account')
  const [invIssueDate, setInvIssueDate] = useState('')
  const [invDueDate, setInvDueDate] = useState('')
  const [invNote, setInvNote] = useState('')
  const [invNumberTail, setInvNumberTail] = useState('')

  const [emailTo, setEmailTo] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!invoiceId) return
    setLoading(true)
    try {
      const d = await getStoredInvoice(invoiceId)
      setDoc(d)
      setLifecyclePick('')
      setPaymentTermsNote(d.paymentTerms ?? '')
      setCurrencyCode(d.currency)
      const tr = d.lines[0]?.taxRate
      setTaxRate(String(tr ?? 0.1))
      setInvIssueDate(d.issueDate)
      const tail = d.invoiceId.replace(/^INV-/u, '')
      setInvNumberTail(/^\d+$/u.test(tail) ? tail : '')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Not found'
      toast.error('Invoice load failed', { description: msg })
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }, [invoiceId, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const supplement: InvoiceSupplement | null = useMemo(() => {
    const parsedTax = Number(taxRate)
    if (!Number.isFinite(parsedTax)) return null
    return {
      currencyCode: currencyCode.trim(),
      taxRate: parsedTax,
      taxScheme: { id: taxSchemeId.trim(), taxTypeCode: taxTypeCode.trim() },
      paymentMeans: {
        code: paymentCode.trim(),
        payeeFinancialAccount: { id: accountId.trim(), name: accountName.trim() },
      },
      ...(paymentTermsNote.trim() ? { paymentTerms: { note: paymentTermsNote.trim() } } : {}),
      ...(invIssueDate.trim() ? { issueDate: invIssueDate.trim() } : {}),
      ...(invDueDate.trim() ? { dueDate: invDueDate.trim() } : {}),
      ...(invNote.trim() ? { note: invNote.trim() } : {}),
      ...(invNumberTail.trim() ? { invoiceNumber: invNumberTail.trim() } : {}),
    }
  }, [
    accountId,
    accountName,
    currencyCode,
    invDueDate,
    invIssueDate,
    invNote,
    invNumberTail,
    paymentCode,
    paymentTermsNote,
    taxRate,
    taxSchemeId,
    taxTypeCode,
  ])

  async function onSaveMeta() {
    if (!invoiceId) return
    setBusy('meta')
    try {
      const updated = await patchStoredInvoice(invoiceId, {
        lifecycleStatus:
          lifecyclePick && LIFECYCLE_EDIT.includes(lifecyclePick as (typeof LIFECYCLE_EDIT)[number])
            ? lifecyclePick
            : undefined,
        paymentTermsNote: paymentTermsNote.trim() || undefined,
      })
      setDoc((prev) => (prev ? { ...prev, ...updated } : prev))
      toast.success('Invoice updated')
      setLifecyclePick('')
      void load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Save failed'
      toast.error('Could not save', { description: msg })
    } finally {
      setBusy(null)
    }
  }

  async function onValidateStored() {
    if (!invoiceId) return
    setBusy('val')
    try {
      await validateStoredInvoice(invoiceId)
      toast.success('Stored invoice validated')
      void load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Validation failed'
      toast.error('UBL validation failed', { description: msg })
    } finally {
      setBusy(null)
    }
  }

  async function onRegenerate() {
    if (!invoiceId || !supplement) return
    setBusy('regen')
    try {
      const updated = await regenerateStoredInvoice(invoiceId, supplement)
      setDoc(updated)
      toast.success('Invoice regenerated from stored order')
      void load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Regenerate failed'
      toast.error('Regeneration failed', { description: msg })
    } finally {
      setBusy(null)
    }
  }

  async function onPdf() {
    if (!doc?.invoiceXml) return
    setBusy('pdf')
    try {
      const pdf = await createInvoicePdf(doc.invoiceXml)
      downloadBlob(`${doc.invoiceId}.pdf`, pdf)
      toast.success('PDF downloaded')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'PDF failed'
      toast.error('PDF failed', { description: msg })
    } finally {
      setBusy(null)
    }
  }

  async function onCopyInvoiceXml() {
    if (!doc?.invoiceXml?.trim()) return
    try {
      await navigator.clipboard.writeText(doc.invoiceXml)
      toast.success('Invoice XML copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  function onDownloadInvoiceXml() {
    if (!doc?.invoiceXml) return
    downloadText(`${doc.invoiceId}.xml`.replace(/[^a-zA-Z0-9._-]/g, '_'), doc.invoiceXml, 'application/xml')
    toast.success('XML downloaded')
  }

  async function onEmail() {
    if (!doc?.invoiceXml || !emailTo.trim() || !invoiceId) return
    setBusy('email')
    try {
      await sendInvoiceEmail(doc.invoiceXml, emailTo.trim(), invoiceId)
      toast.success('Invoice emailed')
      void load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Send failed'
      toast.error('Email failed', { description: msg })
      void load()
    } finally {
      setBusy(null)
    }
  }

  async function onDelete() {
    if (!invoiceId) return
    if (!window.confirm('Delete this invoice from storage? This cannot be undone.')) return
    setBusy('del')
    try {
      await deleteInvoiceById(invoiceId)
      toast.success('Invoice deleted')
      navigate('/invoices')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Delete failed'
      toast.error('Delete failed', { description: msg })
    } finally {
      setBusy(null)
    }
  }

  if (!invoiceId) {
    return null
  }

  if (loading || !doc) {
    return (
      <div className="space-y-4 text-sm text-muted-foreground">
        <Link to="/invoices" className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <p>Loading…</p>
      </div>
    )
  }

  const pdfPublic =
    doc.pdfInvoiceHash && /^[a-f0-9]{64}$/u.test(doc.pdfInvoiceHash)
      ? `${getPublicAppOrigin()}/invoices/${doc.pdfInvoiceHash}.pdf`
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/invoices"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400"
          >
            <ArrowLeft className="size-4" /> All invoices
          </Link>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">{doc.invoiceId}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{doc.lifecycleStatus}</Badge>
            <span>UBL {doc.status}</span>
            {doc.orderReference?.orderId && <span>Order {doc.orderReference.orderId}</span>}
          </div>
          {doc.lastError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">Last error: {doc.lastError}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className={outlineBtn} disabled={!!busy} onClick={() => void onValidateStored()}>
            <ShieldCheck className="size-4" />
            {busy === 'val' ? '…' : 'Validate UBL'}
          </Button>
          <Button variant="outline" size="sm" className={outlineBtn} disabled={!!busy} onClick={() => void onPdf()}>
            <Download className="size-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={outlineBtn}
            disabled={!!busy || !doc.invoiceXml}
            onClick={() => void onCopyInvoiceXml()}
          >
            <Copy className="size-4" />
            Copy XML
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={outlineBtn}
            disabled={!!busy || !doc.invoiceXml}
            onClick={onDownloadInvoiceXml}
          >
            <Download className="size-4" />
            XML
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
            disabled={!!busy}
            onClick={() => void onDelete()}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-amber-200/60 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle className="text-base">Parties & totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Seller</p>
              <p>{doc.seller.name}</p>
              <p className="text-muted-foreground">{doc.seller.email}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Buyer</p>
              <p>{doc.buyer.name}</p>
              <p className="text-muted-foreground">{doc.buyer.email}</p>
            </div>
            <div className="rounded-lg border border-amber-200/50 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-muted-foreground">Payable</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat(undefined, { style: 'currency', currency: doc.currency }).format(
                  doc.totals.payableAmount,
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Subtotal {doc.totals.subTotal} · Tax {doc.totals.taxTotal}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 dark:border-amber-900/40">
          <CardHeader>
            <CardTitle className="text-base">Status & payment terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Set lifecycle (optional)</Label>
              <Select
                value={lifecyclePick}
                onValueChange={setLifecyclePick}
                options={[
                  { value: '', label: `No change (keep ${doc.lifecycleStatus})` },
                  ...LIFECYCLE_EDIT.map((s) => ({ value: s, label: s })),
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Email send sets SENT or SEND_FAILED automatically. Validated is set by the Validate UBL action.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Payment terms note</Label>
              <Textarea value={paymentTermsNote} onChange={(e) => setPaymentTermsNote(e.target.value)} className="min-h-20 rounded-lg" />
            </div>
            <Button size="sm" className="bg-amber-400 text-slate-900 hover:bg-amber-500" disabled={busy === 'meta'} onClick={() => void onSaveMeta()}>
              {busy === 'meta' ? 'Saving…' : 'Save metadata'}
            </Button>
            {pdfPublic && (
              <a href={pdfPublic} target="_blank" rel="noreferrer" className="block text-sm font-medium text-amber-700 underline dark:text-amber-400">
                Open stored public PDF
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200/60 dark:border-amber-900/40">
        <CardHeader>
          <CardTitle className="text-base">Regenerate UBL from stored order</CardTitle>
          <p className="text-sm text-muted-foreground">
            Updates stored XML and totals from the linked order using the supplement below (same rules as Generate).
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Tax rate</Label>
            <Input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Tax scheme id</Label>
            <Input value={taxSchemeId} onChange={(e) => setTaxSchemeId(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Tax type code</Label>
            <Input value={taxTypeCode} onChange={(e) => setTaxTypeCode(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Payment means code</Label>
            <Input value={paymentCode} onChange={(e) => setPaymentCode(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Account ID</Label>
            <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Account name</Label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Issue date</Label>
            <Input value={invIssueDate} onChange={(e) => setInvIssueDate(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label>Invoice number (suffix, optional)</Label>
            <Input
              value={invNumberTail}
              onChange={(e) => setInvNumberTail(e.target.value)}
              placeholder="e.g. 1001 → INV-1001"
              className="h-9 rounded-lg"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Note</Label>
            <Input value={invNote} onChange={(e) => setInvNote(e.target.value)} className="h-9 rounded-lg" />
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={!supplement || busy === 'regen'}
              onClick={() => void onRegenerate()}
              className="gap-2 bg-amber-400 text-slate-900 hover:bg-amber-500"
            >
              <RefreshCw className="size-4" />
              {busy === 'regen' ? 'Regenerating…' : 'Regenerate & save XML'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200/60 dark:border-amber-900/40">
        <CardHeader>
          <CardTitle className="text-base">Resend email</CardTitle>
        </CardHeader>
        <CardContent className="flex max-w-md flex-col gap-3">
          <Input type="email" placeholder="recipient@example.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="rounded-lg" />
          <Button
            className="gap-2 bg-amber-400 text-slate-900 hover:bg-amber-500"
            disabled={!emailTo.trim() || busy === 'email'}
            onClick={() => void onEmail()}
          >
            <Mail className="size-4" />
            {busy === 'email' ? 'Sending…' : 'Send'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200/60 dark:border-amber-900/40">
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(doc.activity ?? []).length === 0 ? (
            <p className="text-muted-foreground">No events recorded.</p>
          ) : (
            [...(doc.activity ?? [])]
              .slice()
              .reverse()
              .map((a, idx) => (
                <div key={`${a.at}-${idx}`} className="rounded-lg border bg-background/50 px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{a.type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                  </div>
                  <p className="text-muted-foreground">{a.message}</p>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Invoice XML (read-only)</Label>
        <Textarea readOnly value={doc.invoiceXml} className="min-h-48 rounded-xl font-mono text-xs" />
      </div>
    </div>
  )
}
