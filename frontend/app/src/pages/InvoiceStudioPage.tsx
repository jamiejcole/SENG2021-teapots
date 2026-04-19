import { useEffect, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, CloudMoon, CloudSun, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/api/client'
import { previewStudioInvoice, type InvoiceStudioPreviewDraft } from '@/api/invoices'
import { toast } from '@/lib/toast'

type StudioLineItem = {
  id: string
  name: string
  details: string
  quantity: number
  rate: number
}

type StudioDraft = {
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

function makeLineItem(id: string, name: string, details: string, quantity: number, rate: number): StudioLineItem {
  return { id, name, details, quantity, rate }
}

function sampleDraft(): StudioDraft {
  const today = new Date().toISOString().slice(0, 10)
  return {
    businessName: 'Northside Handyman Co.',
    businessPhone: '0400 123 456',
    businessEmail: 'hello@northsidehandyman.co',
    businessAddress: '14 Workshop Lane, Newcastle NSW 2300',
    customerName: 'Jordan Taylor',
    customerPhone: '+61 409 111 222',
    customerEmail: 'jordan@example.com',
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
    bsb: '032-000',
    taxRate: 0.1,
    lineItems: [
      makeLineItem('1', 'Call-out fee', 'Initial visit and diagnosis', 1, 85),
      makeLineItem('2', 'Labour', '1.5 hours on site', 1.5, 72),
      makeLineItem('3', 'Parts', 'Hinge and fixings', 1, 28.5),
    ],
  }
}

function themePanelClass(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'rounded-[34px] border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-black/30'
    : 'rounded-[34px] border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/60 p-3 shadow-2xl shadow-amber-500/10 dark:border-amber-900/40 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20'
}

function themeInnerClass(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'rounded-[28px] bg-slate-900/70 p-4 sm:p-6'
    : 'rounded-[28px] bg-[linear-gradient(rgba(255,255,255,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.32)_1px,transparent_1px)] bg-[size:26px_26px] p-4 sm:p-6'
}

function previewShellClass(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'overflow-hidden rounded-[24px] border border-slate-700 bg-slate-950 shadow-lg lg:min-h-[calc(100dvh-14rem)]'
    : 'overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-lg dark:bg-slate-950 lg:min-h-[calc(100dvh-14rem)]'
}

export function InvoiceStudioPage() {
  const [draft, setDraft] = useState<StudioDraft>(sampleDraft)
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)

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

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      ;(async () => {
        setPreviewLoading(true)
        setPreviewError(null)

        try {
          const html = await previewStudioInvoice({
            ...(draft as InvoiceStudioPreviewDraft),
            theme: previewTheme,
          })
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
            <h1 className="max-w-2xl text-balance font-display text-3xl tracking-tight sm:text-4xl">
              Build an invoice like you would in the garage, on the ute, or at the kitchen table.
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Focused on sole traders: plain-language fields, live pricing, and a live invoice preview that updates as you type.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full border-amber-300 bg-background/70">
              <Link to="/generate">Use existing invoice flow</Link>
            </Button>
            <Button className="rounded-full bg-amber-400 font-semibold text-slate-900 hover:bg-amber-500" onClick={() => setDraft(sampleDraft())}>
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
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:self-start">
          <div className={themePanelClass(previewTheme)}>
            <div className={themeInnerClass(previewTheme)}>
              <div className={previewShellClass(previewTheme)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                      <Check className="size-3.5" />
                      Exact PDF preview
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Rendered from the same XSLT HTML used by export.</p>
                  </div>

                  <div className="flex items-center gap-2">
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
                </div>

                <div className={previewTheme === 'dark' ? 'bg-slate-900 p-3 sm:p-4' : 'bg-slate-100 p-3 sm:p-4'}>
                  {previewLoading && !previewHtml ? (
                    <Skeleton className="h-[72rem] w-full rounded-[20px]" />
                  ) : previewError ? (
                    <div className="flex min-h-[32rem] items-center justify-center rounded-[20px] border border-dashed border-border bg-background/80 p-8 text-center text-sm text-muted-foreground">
                      {previewError}
                    </div>
                  ) : (
                    <iframe title="Invoice preview" className="h-[72rem] w-full rounded-[20px] border-0 bg-transparent" srcDoc={previewHtml} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full border-amber-300" asChild>
              <Link to="/generate">
                Continue to invoice generation
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
    )
  }
