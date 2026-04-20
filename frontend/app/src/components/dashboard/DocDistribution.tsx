import { Link } from 'react-router-dom'
import { FileText, Package, Truck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DocDistributionProps {
  invoices: number
  orders: number
  despatches: number
  className?: string
}

const rows = [
  {
    key: 'invoices' as const,
    label: 'Invoices',
    icon: FileText,
    href: '/invoices',
    barLight: 'bg-amber-400',
    barDark: 'dark:bg-amber-500',
    countClass: 'text-amber-700 dark:text-amber-300',
  },
  {
    key: 'orders' as const,
    label: 'Orders',
    icon: Package,
    href: '/orders',
    barLight: 'bg-amber-300',
    barDark: 'dark:bg-amber-600',
    countClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'despatches' as const,
    label: 'Despatches',
    icon: Truck,
    href: '/despatch',
    barLight: 'bg-amber-200',
    barDark: 'dark:bg-amber-700',
    countClass: 'text-amber-500 dark:text-amber-500',
  },
]

export function DocDistribution({ invoices, orders, despatches, className }: DocDistributionProps) {
  const values = { invoices, orders, despatches }
  const max = Math.max(invoices, orders, despatches, 1)
  const total = invoices + orders + despatches

  return (
    <Card
      className={cn(
        'flex h-full flex-col border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30',
        'dark:border-amber-900/40 dark:from-slate-900 dark:to-amber-950/20',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Document activity</CardTitle>
        <CardDescription>Stored document distribution</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center gap-5 pb-5">
        {rows.map(({ key, label, icon: Icon, href, barLight, barDark, countClass }) => {
          const val = values[key]
          const pct = (val / max) * 100

          return (
            <Link
              key={key}
              to={href}
              className="group space-y-1.5"
              aria-label={`${label}: ${val}`}
            >
              {/* Label row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon className="size-3.5 shrink-0" />
                  {label}
                </div>
                <span className={cn('text-sm font-bold tabular-nums', countClass)}>
                  {val.toLocaleString()}
                </span>
              </div>

              {/* Bar track */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    barLight,
                    barDark,
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          )
        })}

        {/* Total */}
        <p className="mt-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{total.toLocaleString()}</span> total documents
        </p>
      </CardContent>
    </Card>
  )
}
