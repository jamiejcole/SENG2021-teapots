import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function PublicLayout() {
  return (
    <div className="relative min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.3fr)]">
        <div className="relative hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto lg:overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20" />
          <div className="relative flex min-h-dvh flex-col justify-between p-12">
            <div>
              <div className="inline-flex items-center gap-3">
                <img src="/logo.png" alt="Teapots" className="size-12 rounded-2xl object-contain" />
                <div>
                  <div className="font-display text-xl font-semibold tracking-tight">Teapots Invoicing</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Fintech-grade invoicing</div>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Simple policies. Clear support. Same product tone.
                </h2>
                <p className="max-w-md text-slate-600 dark:text-slate-400">
                  Find the privacy policy, terms, and support details for Teapots Invoicing in one place.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-8 text-xs text-slate-500 dark:text-slate-400">
              <div>© {new Date().getFullYear()} Teapots Invoicing</div>
              <div className="flex flex-wrap gap-4">
                <a href="/privacy" className="underline-offset-4 hover:text-slate-700 hover:underline dark:hover:text-slate-200">
                  Privacy policy
                </a>
                <a href="/terms" className="underline-offset-4 hover:text-slate-700 hover:underline dark:hover:text-slate-200">
                  Terms
                </a>
                <a href="/support" className="underline-offset-4 hover:text-slate-700 hover:underline dark:hover:text-slate-200">
                  Support
                </a>
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="/auth/sign-in" className="underline-offset-4 hover:text-slate-700 hover:underline dark:hover:text-slate-200">
                  Sign in
                </a>
                <a href="/" className="underline-offset-4 hover:text-slate-700 hover:underline dark:hover:text-slate-200">
                  Home
                </a>
              </div>
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