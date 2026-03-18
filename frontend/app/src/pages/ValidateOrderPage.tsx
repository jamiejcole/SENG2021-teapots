import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { validateOrder } from '@/api/invoices'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ValidateOrderPage() {
  const [orderXml, setOrderXml] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const canSubmit = useMemo(() => orderXml.trim().length > 0 && !isLoading, [orderXml, isLoading])

  async function onValidate() {
    const trimmed = orderXml.trim()
    if (!trimmed) {
      setResult({ ok: false, message: 'Order XML cannot be empty.' })
      return
    }

    setIsLoading(true)
    setResult(null)
    try {
      const res = await validateOrder(trimmed)
      setResult({ ok: true, message: res.message ?? 'UBL Order is valid.' })
      toast.success('Order is valid')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Validation failed'
      setResult({ ok: false, message: msg })
      toast.error('Validation failed', { description: msg })
    } finally {
      setIsLoading(false)
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
          <h1 className="font-display text-3xl tracking-tight">Validate Order</h1>
          <p className="text-sm text-muted-foreground">Runs UBL XSD validation against your Order XML.</p>
        </div>
      </div>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base">Order XML</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderXml">Paste UBL Order XML</Label>
            <Textarea
              id="orderXml"
              value={orderXml}
              onChange={(e) => setOrderXml(e.target.value)}
              placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<Order>...</Order>'}
              className="min-h-64 rounded-2xl font-mono text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onValidate} disabled={!canSubmit} className="rounded-xl bg-amber-400 font-semibold text-slate-900 shadow-md shadow-amber-400/25 hover:bg-amber-500">
              {isLoading ? 'Validating…' : 'Validate'}
            </Button>
            <Button variant="secondary" onClick={() => setOrderXml('')} disabled={isLoading} className="rounded-full">
              Clear
            </Button>
          </div>

          {isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}

          {!isLoading && result && (
            <Alert variant={result.ok ? 'default' : 'destructive'}>
              <AlertTitle>{result.ok ? 'Valid' : 'Invalid'}</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

