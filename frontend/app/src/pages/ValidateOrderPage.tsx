import { useMemo, useState } from 'react'
import { validateOrder } from '@/api/invoices'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Validate Order</h1>
        <p className="text-sm text-muted-foreground">POSTs to the backend at `/invoices/validate`.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order XML</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderXml">Paste UBL Order XML</Label>
            <Textarea
              id="orderXml"
              value={orderXml}
              onChange={(e) => setOrderXml(e.target.value)}
              placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<Order>...</Order>'}
              className="min-h-64 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onValidate} disabled={!canSubmit}>
              {isLoading ? 'Validating…' : 'Validate'}
            </Button>
            <Button variant="secondary" onClick={() => setOrderXml('')} disabled={isLoading}>
              Clear
            </Button>
          </div>

          {result && (
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

