import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function PublicLayout() {
  return (
    <div className="relative min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.3fr)]">
        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="Teapots" className="size-12 rounded-2xl object-contain" />
              <div>
                <div className="font-display text-xl font-semibold tracking-tight">Teapots Invoicing</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Fintech-grade invoicing</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Simple policies. Clear support. Same product tone.
              </h2>
              <p className="max-w-md text-slate-600 dark:text-slate-400">
                Find the privacy policy, terms, and support details for Teapots Invoicing in one place.
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Teapots Invoicing
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white px-6 py-12 dark:bg-slate-900 lg:px-10">
          <div className="w-full max-w-3xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}