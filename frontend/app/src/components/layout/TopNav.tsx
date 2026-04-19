import { Bell, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useAuth } from '@/components/auth/AuthContext'
import { useInvoiceSearch } from '@/context/InvoiceSearchContext'

type TopNavProps = {
  onOpenMobileNav: () => void
}

export function TopNav({ onOpenMobileNav }: TopNavProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { invoiceSearch, setInvoiceSearch } = useInvoiceSearch()

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  const initials = (fullName.slice(0, 2) || user?.email?.slice(0, 2) || 'TA').toUpperCase()
  const displayName = fullName || user?.email || 'Admin'

  function handleSignOut() {
    logout()
    navigate('/auth/sign-in', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-soft"
      >
        Skip to content
      </a>
      <div className="flex h-14 w-full items-center gap-2 px-4 md:gap-3">
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="focus-ring"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" />
          </Button>
          <img src="/logo.png" alt="Teapots" className="size-8 rounded-lg object-contain" />
        </div>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            className="h-9 rounded-full pl-9 pr-3 text-sm md:text-base"
            placeholder="Search by customer name, email, invoice #…"
            aria-label="Search invoices"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ThemeToggle />

          <Button variant="ghost" size="icon" className="focus-ring" aria-label="Notifications">
            <span className="relative">
              <Bell className="size-4" />
              <span
                className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-400 ring-2 ring-background"
                aria-hidden="true"
              />
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="focus-ring h-9 gap-2 rounded-full px-2">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/account')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Billing settings are coming soon.')}>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

