import { useEffect, useState } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  CloudMoon,
  CloudSun,
  Download,
  Loader2,
  Mail,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/components/auth/AuthContext'
import { ApiError } from '@/api/client'
import {
  buildStudioOrderPayload,
  createInvoice,
  createInvoicePdf,
  previewInvoiceXml,
  previewStudioInvoice,
  sendInvoiceEmail,
} from '@/api/invoices'
import { toast } from '@/lib/toast'
import { makeLineItem, sampleStudioDraft, studioDraftToPreviewPayload, type StudioDraft, type StudioLineItem } from '@/lib/invoiceStudio'
import { downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'

function buildBusinessDraftFromUser(user: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string | null
  company?: string | null
  businessAddress?: string | null
} | null) {
  return {
    ...(user?.company?.trim() ? { businessName: user.company.trim() } : {}),
    ...(user?.company?.trim() ? { accountName: user.company.trim() } : {}),
    ...(user?.phone?.trim() ? { businessPhone: user.phone.trim() } : {}),
    ...(user?.email?.trim() ? { businessEmail: user.email.trim() } : {}),
    ...(user?.businessAddress?.trim() ? { businessAddress: user.businessAddress.trim() } : {}),
  }
}

function themePanelClass(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'rounded-[34px] border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-black/30'
    : 'rounded-[34px] border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/60 p-3 shadow-2xl shadow-amber-500/10 dark:border-amber-900/40 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20'
}

function themeInnerClass(theme: 'light' | 'dark') {
  return theme === 'dark' ? 'rounded-[28px] bg-slate-900/70' : 'rounded-[28px]'
}

function previewShellClass(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'overflow-hidden rounded-[24px] border border-slate-700 bg-slate-950 shadow-lg'
    : 'overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-lg dark:bg-slate-950'
}

export function InvoiceStudioPage() {
  const { user } = useAuth()
  const [draft, setDraft] = useState<StudioDraft>(sampleStudioDraft)
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [emailTo, setEmailTo] = useState('')
  const [generatedXml, setGeneratedXml] = useState<string | null>(null)
  const [storedInvoiceId, setStoredInvoiceId] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    const businessDraft = buildBusinessDraftFromUser(user)
    setDraft((current) => ({
      ...current,
      ...businessDraft,
    }))
  }, [user])

  function updateDraft<K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateLineItem(id: string, patch: Partial<StudioLineItem>) {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  function addLineItem() {
    setDraft((current) => ({
      ...current,
      lineItems: [...current.lineItems, makeLineItem(String(Date.now()), 'New item', 'What was done?', 1, 0)],
    }))
  }

  function removeLineItem(id: string) {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.filter((item) => item.id !== id),
    }))
  }

  const formReadyForInvoice =
    Boolean(draft.businessName?.trim()) &&
    Boolean(draft.customerName?.trim()) &&
    Boolean(draft.invoiceNumber?.trim()) &&
    draft.lineItems.length > 0

  const canSaveToAccount = !isSaving && formReadyForInvoice

  async function onSaveToAccount() {
    setIsSaving(true)
    setGeneratedXml(null)
    setStoredInvoiceId(null)
    try {
      const base = studioDraftToPreviewPayload(draft)
      const { orderXml, invoiceSupplement } = await buildStudioOrderPayload(base)
      const { invoiceXml: xml, storedInvoiceId: sid } = await createInvoice(orderXml, invoiceSupplement)
      setGeneratedXml(xml)
      setStoredInvoiceId(sid)
      toast.success('Invoice saved', {
        description: sid ? 'Stored in your account.' : 'Invoice XML created.',
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed'
      toast.error('Save failed', { description: msg })
    } finally {
      setIsSaving(false)
    }
  }

  async function onDownloadPdf() {
    if (!formReadyForInvoice) return
    setIsPdfLoading(true)
    try {
      let xml = generatedXml?.trim()
      if (!xml) {
        const base = studioDraftToPreviewPayload(draft)
        const { orderXml, invoiceSupplement } = await buildStudioOrderPayload(base)
        const pre = await previewInvoiceXml(orderXml, invoiceSupplement)
        xml = pre.invoiceXml
      }
      const pdf = await createInvoicePdf(xml)
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
    const to = emailTo.trim()
    if (!to) {
      toast.error('Enter an email address')
      return
    }
    if (!formReadyForInvoice) {
      toast.error('Add business name, customer, invoice number, and at least one line item.')
      return
    }

    setIsEmailSending(true)
    try {
      let xml = generatedXml?.trim() ?? null
      let sid = storedInvoiceId

      if (!xml) {
        const base = studioDraftToPreviewPayload(draft)
        const { orderXml, invoiceSupplement } = await buildStudioOrderPayload(base)
        const created = await createInvoice(orderXml, invoiceSupplement)
        xml = created.invoiceXml
        sid = created.storedInvoiceId
        setGeneratedXml(xml)
        setStoredInvoiceId(sid)
      }

      const result = await sendInvoiceEmail(xml, to, sid)
      toast.success('Invoice email sent', { description: `Sent to ${result.to}` })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send invoice email'
      toast.error('Email send failed', { description: msg })
    } finally {
      setIsEmailSending(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      ;(async () => {
        setPreviewLoading(true)
        setPreviewError(null)

        try {
          const html = await previewStudioInvoice(studioDraftToPreviewPayload(draft, previewTheme))
          if (!cancelled) {
            setPreviewHtml(html)
          }
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof ApiError ? error.message : 'Could not build the live preview'
            setPreviewError(message)
            toast.error('Preview refresh failed', { description: message })
          }
        } finally {
          if (!cancelled) {
            setPreviewLoading(false)
          }
        }
      })()
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [draft, previewTheme])

  return (
    <div className="min-h-0 w-full space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(255,248,232,0.88))] p-6 shadow-sm dark:border-amber-900/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(120,53,15,0.4),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.94))]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 dark:opacity-10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <Sparkles className="size-3.5" />
              Invoice Studio
              <Badge variant="secondary" className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                BETA
              </Badge>
            </div>
            <h1 className="max-w-3xl text-balance font-display text-3xl tracking-tight sm:text-4xl">
              Build an invoice like you would on-site.
            </h1>
            <p className="max-w-4xl text-sm text-muted-foreground sm:text-base">
              Live preview with the same generation and delivery pipeline as Generate — drafts saved in this browser.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500" onClick={() => setDraft(sampleStudioDraft())}>
              <Sparkles className="size-4" />
              Load sample job
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100dvh-18rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-6 lg:sticky lg:top-24 lg:h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:pr-1">
          <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <BriefcaseBusiness className="size-4" />
                Your business
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business name</Label>
                <Input id="businessName" value={draft.businessName} onChange={(e) => updateDraft('businessName', e.target.value)} className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessAddress">Business address</Label>
                <Textarea id="businessAddress" value={draft.businessAddress} onChange={(e) => updateDraft('businessAddress', e.target.value)} className="min-h-20 rounded-xl resize-y" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input id="businessPhone" value={draft.businessPhone} onChange={(e) => updateDraft('businessPhone', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input id="businessEmail" value={draft.businessEmail} onChange={(e) => updateDraft('businessEmail', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="issueDate" className="inline-flex items-center gap-2">
                    <CalendarDays className="size-3.5" />
                    Issue date
                  </Label>
                  <Input id="issueDate" type="date" value={draft.issueDate} onChange={(e) => updateDraft('issueDate', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate">Due date</Label>
                  <Input id="dueDate" type="date" value={draft.dueDate} onChange={(e) => updateDraft('dueDate', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="taxRate">GST / tax</Label>
                  <Input id="taxRate" type="number" step="0.01" min="0" max="1" value={draft.taxRate} onChange={(e) => updateDraft('taxRate', Number(e.target.value) || 0)} className="h-9 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">Customer details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Customer name</Label>
                <Input id="customerName" value={draft.customerName} onChange={(e) => updateDraft('customerName', e.target.value)} className="h-9 rounded-lg" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input id="customerEmail" value={draft.customerEmail} onChange={(e) => updateDraft('customerEmail', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input id="customerPhone" value={draft.customerPhone} onChange={(e) => updateDraft('customerPhone', e.target.value)} className="h-9 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerAddress">Job address</Label>
                <Textarea id="customerAddress" value={draft.customerAddress} onChange={(e) => updateDraft('customerAddress', e.target.value)} className="min-h-24 rounded-xl resize-y" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Job details</CardTitle>
              <Button variant="outline" size="sm" className="rounded-lg border-amber-300" onClick={addLineItem}>
                <Plus className="size-4" /> Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 sm:max-w-xs">
                <Label htmlFor="invoiceNumber">Invoice number</Label>
                <Input id="invoiceNumber" value={draft.invoiceNumber} onChange={(e) => updateDraft('invoiceNumber', e.target.value)} className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobSummary">Job description</Label>
                <Textarea id="jobSummary" value={draft.jobSummary} onChange={(e) => updateDraft('jobSummary', e.target.value)} className="min-h-20 rounded-xl resize-y" />
              </div>

              {draft.lineItems.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background/70 p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Item {index + 1}</p>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:text-red-600" onClick={() => removeLineItem(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Name</Label>
                      <Input value={item.name} onChange={(e) => updateLineItem(item.id, { name: e.target.value })} className="h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Details</Label>
                      <Input value={item.details} onChange={(e) => updateLineItem(item.id, { details: e.target.value })} className="h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Qty</Label>
                      <Input type="number" min="0" step="0.1" value={item.quantity} onChange={(e) => updateLineItem(item.id, { quantity: Number(e.target.value) || 0 })} className="h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rate</Label>
                      <Input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateLineItem(item.id, { rate: Number(e.target.value) || 0 })} className="h-9 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">Payment info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bsb">BSB</Label>
                  <Input id="bsb" value={draft.bsb} onChange={(e) => updateDraft('bsb', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber">Account number</Label>
                  <Input id="accountNumber" value={draft.accountNumber} onChange={(e) => updateDraft('accountNumber', e.target.value)} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountName">Account name</Label>
                  <Input id="accountName" value={draft.accountName} onChange={(e) => updateDraft('accountName', e.target.value)} className="h-9 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentNotes">Payment notes</Label>
                <Textarea id="paymentNotes" value={draft.paymentNotes} onChange={(e) => updateDraft('paymentNotes', e.target.value)} className="min-h-20 rounded-xl resize-y" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extraNotes">Extra notes</Label>
                <Textarea id="extraNotes" value={draft.extraNotes} onChange={(e) => updateDraft('extraNotes', e.target.value)} className="min-h-20 rounded-xl resize-y" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Order / internal notes</Label>
                <Textarea
                  id="notes"
                  value={draft.notes}
                  onChange={(e) => updateDraft('notes', e.target.value)}
                  className="min-h-16 rounded-xl resize-y"
                  placeholder="Included on the UBL order when saving"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className={themePanelClass(previewTheme)}>
            <div className={themeInnerClass(previewTheme)}>
              <div className={previewShellClass(previewTheme)}>
                <div className="flex flex-col gap-2 border-b border-border/60 px-2 pb-2 pt-1.5 sm:px-3 sm:pb-2.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Label htmlFor="previewTheme" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Viewer
                      </Label>
                      <div className="inline-flex items-center rounded-full border border-border/70 bg-background p-1 shadow-sm">
                        <button
                          type="button"
                          id="previewTheme"
                          className={
                            previewTheme === 'light'
                              ? 'inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-900'
                              : 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground'
                          }
                          onClick={() => setPreviewTheme('light')}
                        >
                          <CloudSun className="size-3.5" />
                          Light
                        </button>
                        <button
                          type="button"
                          className={
                            previewTheme === 'dark'
                              ? 'inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                              : 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground'
                          }
                          onClick={() => setPreviewTheme('dark')}
                        >
                          <CloudMoon className="size-3.5" />
                          Dark
                        </button>
                      </div>
                    </div>
                    <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-1.5 sm:ml-auto sm:w-auto sm:max-w-[min(100%,28rem)] sm:justify-end sm:pl-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-amber-100/80 hover:text-foreground dark:hover:bg-slate-800"
                        disabled={!canSaveToAccount}
                        title="Save invoice"
                        aria-label="Save invoice"
                        onClick={() => void onSaveToAccount()}
                      >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-amber-100/80 hover:text-foreground dark:hover:bg-slate-800"
                        disabled={!formReadyForInvoice || isPdfLoading}
                        title={!formReadyForInvoice ? 'Add required fields to build a PDF.' : 'Download PDF'}
                        aria-label="Download PDF"
                        onClick={() => void onDownloadPdf()}
                      >
                        {isPdfLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                      </Button>
                      <div
                        className={cn(
                          'ml-0.5 flex h-9 min-w-0 flex-1 items-center gap-0 overflow-hidden rounded-full border pl-3 pr-1 sm:min-w-[13rem] sm:flex-initial sm:max-w-[16rem]',
                          previewTheme === 'dark'
                            ? 'border-slate-600/55 bg-slate-900/95'
                            : 'border-border/70 bg-muted/50 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40',
                        )}
                      >
                        <Label htmlFor="studio-email-to" className="sr-only">
                          Email invoice
                        </Label>
                        <input
                          id="studio-email-to"
                          type="email"
                          name="studio-email-to"
                          autoComplete="email"
                          placeholder="Send via email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          className={cn(
                            'min-h-0 min-w-0 flex-1 border-0 bg-transparent py-0 pl-0 pr-2 text-xs shadow-none outline-none ring-0 ring-offset-0',
                            'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
                            'placeholder:text-muted-foreground',
                            previewTheme === 'dark' &&
                              'text-slate-100 placeholder:text-slate-500 [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(241_245_249)] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgb(15_23_42)]',
                          )}
                        />
                        <button
                          type="button"
                          className={cn(
                            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                            'disabled:pointer-events-none disabled:opacity-40',
                            previewTheme === 'dark'
                              ? 'text-slate-400 hover:bg-white/10 hover:text-slate-50'
                              : 'text-muted-foreground hover:bg-amber-100/80 hover:text-foreground',
                          )}
                          disabled={!formReadyForInvoice || isEmailSending || isSaving || !emailTo.trim()}
                          title={
                            !emailTo.trim()
                              ? 'Enter a recipient email'
                              : !formReadyForInvoice
                                ? 'Add required invoice fields first'
                                : 'Saves the invoice if needed, then sends email'
                          }
                          aria-label="Send invoice by email"
                          onClick={() => void onEmail()}
                        >
                          {isEmailSending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {storedInvoiceId && (
                    <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                      Stored invoice:{' '}
                      <Link className="font-medium text-amber-700 underline dark:text-amber-400" to={`/invoices/${storedInvoiceId}`}>
                        open detail
                      </Link>
                    </p>
                  )}
                </div>

                <div className={previewTheme === 'dark' ? 'bg-slate-900 p-3 sm:p-4' : 'bg-slate-100 p-3 sm:p-4'}>
                  {previewLoading && !previewHtml ? (
                    <Skeleton className="aspect-[210/297] w-full rounded-[20px]" />
                  ) : previewError ? (
                    <div className="flex aspect-[210/297] w-full items-center justify-center rounded-[20px] border border-dashed border-border bg-background/80 p-8 text-center text-sm text-muted-foreground">
                      {previewError}
                    </div>
                  ) : (
                    <iframe title="Invoice preview" className="aspect-[210/297] w-full rounded-[20px] border-0 bg-transparent" srcDoc={previewHtml} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
