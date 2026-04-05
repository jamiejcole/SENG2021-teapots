import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InvoiceSearchProvider } from '@/context/InvoiceSearchContext'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <InvoiceSearchProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 md:grid-cols-[72px_1fr] lg:grid-cols-[280px_1fr]">
          <aside className="hidden border-r md:block md:self-start md:sticky md:top-0 md:h-dvh">
            <div className="flex h-full max-h-dvh flex-col overflow-y-auto overscroll-contain">
              <div className="hidden min-h-0 flex-1 lg:block">
                <Sidebar variant="full" />
              </div>
              <div className="min-h-0 flex-1 lg:hidden">
                <Sidebar variant="compact" />
              </div>
            </div>
          </aside>

          <div className="flex min-h-dvh flex-col">
            <TopNav onOpenMobileNav={() => setMobileOpen(true)} />
            <main id="main" className="mx-auto w-full flex-1 px-4 py-6 md:px-6 md:py-8">
              <Outlet />
            </main>
            <div className="h-16 md:hidden" />
            <MobileBottomNav />
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </InvoiceSearchProvider>
  )
}
