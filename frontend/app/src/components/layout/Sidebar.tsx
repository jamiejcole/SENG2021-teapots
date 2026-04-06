import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { primaryNav, publicNav, secondaryNav } from '@/components/layout/nav'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type SidebarProps = {
  variant?: 'full' | 'compact'
  onNavigate?: () => void
}

function Item({
  to,
  label,
  icon: Icon,
  compact,
  onNavigate,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  compact: boolean
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground',
          compact && 'justify-center px-2',
        )
      }
      aria-label={label}
      title={compact ? label : undefined}
    >
      <Icon className={cn('size-4 shrink-0', compact && 'size-5')} />
      {!compact && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export function Sidebar({ variant = 'full', onNavigate }: SidebarProps) {
  const compact = variant === 'compact'

  return (
    <div className="flex h-full flex-col">
      <div className={cn('px-6 py-6', compact && 'px-3')}>
        <div className={cn('flex items-center gap-3', compact ? 'justify-center' : 'justify-between')}>
          {!compact && (
            <div className="flex items-center gap-3">
              <img src={"/logo.png"} alt="Teapots" className="size-9 rounded-lg object-contain" />
              <div>
                <div className="font-display text-lg leading-none tracking-tight">Teapots</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Admin dashboard</div>
              </div>
            </div>
          )}
          {compact && <img src={"/logo.png"} alt="Teapots" className="size-8 rounded-lg object-contain" />}
          <Badge
            variant="secondary"
            className={cn('rounded-full bg-amber-100 text-[11px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-200', compact && 'px-2')}
          >
            v2
          </Badge>
        </div>
      </div>

      <Separator />

      <nav className={cn('flex flex-col gap-1 px-3 py-3', compact && 'px-2')}>
        {primaryNav.map((item) => (
          <Item key={item.to} {...item} compact={compact} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto">
        <Separator />
        <nav className={cn('flex flex-col gap-1 px-3 py-3', compact && 'px-2')}>
          {secondaryNav.map((item) => (
            <Item key={item.to} {...item} compact={compact} onNavigate={onNavigate} />
          ))}
        </nav>
        <Separator />
        <nav className={cn('flex flex-col gap-1 px-3 py-3', compact && 'px-2')}>
          {publicNav.map((item) => (
            <Item key={item.to} {...item} compact={compact} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>
    </div>
  )
}

