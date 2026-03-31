import { Coins, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { SparkArea } from '@/components/dashboard/SparkArea'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <Sparkles className="size-3.5" />
          Premium preview
        </div>
        <h1 className="text-balance font-display text-3xl tracking-tight sm:text-4xl">Overview</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Generate invoices from UBL Orders, validate payloads, and monitor recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Invoices generated" value="128" change="+12% vs last week" tone="positive" icon={ReceiptText} />
        <StatCard label="Orders validated" value="402" change="98.4% pass rate" tone="neutral" icon={ShieldCheck} />
        <StatCard label="Revenue tracked" value="$42,560" change="+3.1% MoM" tone="positive" icon={Coins} />
        <StatCard label="Failed validations" value="6" change="−2 from yesterday" tone="positive" icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 lg:col-span-2 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Invoice throughput</CardTitle>
              <CardDescription>Last 14 days</CardDescription>
            </div>
            <Button variant="secondary" size="sm" className="rounded-full">
              View report
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <SparkArea data={[8, 12, 10, 16, 18, 13, 20, 19, 22, 18, 26, 25, 28, 31]} />
          </CardContent>
        </Card>

        <RecentActivity
          className="border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20"
          items={[
            { id: 'a1', title: 'Invoice generated', meta: 'ORDER-1 • 2m ago', amount: '$236.50', status: 'success' },
            { id: 'a2', title: 'Order validated', meta: 'AEG012345 • 9m ago', status: 'success' },
            { id: 'a3', title: 'PDF created', meta: 'INV-123 • 21m ago', status: 'pending' },
            { id: 'a4', title: 'Validation failed', meta: 'Missing PartyTaxScheme • 1h ago', status: 'failed' },
          ]}
        />
      </div>

    </div>
  )
}

