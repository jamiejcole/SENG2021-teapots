import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { primaryNav, publicNav } from '@/components/layout/nav'

export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/80 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-6xl px-2 py-2">
        <div className="grid grid-cols-3 gap-1">
        {primaryNav.slice(0, 3).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label.replace('Invoice', '').trim()}</span>
            </NavLink>
          )
        })}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1 border-t border-border/60 pt-2">
          {publicNav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

