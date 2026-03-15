import { Outlet } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/generate', label: 'Generate Invoice' },
  { to: '/validate', label: 'Validate Order' },
] as const

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="hidden border-r md:block">
          <div className="flex h-dvh flex-col">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium leading-none">Teapots</div>
                  <div className="mt-1 text-xs text-muted-foreground">Invoice builder</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  v1
                </Badge>
              </div>
            </div>
            <Separator />
            <nav className="flex flex-col gap-1 px-3 py-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto px-6 py-6 text-xs text-muted-foreground">
              API: <code className="rounded bg-muted px-1.5 py-0.5">/api/v1</code>
            </div>
          </div>
        </aside>

        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
              <div className="text-sm font-medium">SENG2021 Teapots</div>
              <div className="text-xs text-muted-foreground">Frontend</div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

