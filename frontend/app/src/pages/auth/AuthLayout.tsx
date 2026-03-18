import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Left: Light hero panel - clean, bright, sunshine yellow accent */}
        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="Teapots" className="size-12 rounded-2xl object-contain" />
              <div>
                <div className="font-display text-xl font-semibold tracking-tight">Teapots</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Fintech-grade invoicing</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Build invoices with confidence.
              </h2>
              <p className="max-w-sm text-slate-600 dark:text-slate-400">
                A polished admin dashboard for validating UBL orders and generating compliant invoices.
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Teapots
            </div>
          </div>
        </div>

        {/* Right: Form area - light card on light bg */}
        <div className="flex items-center justify-center bg-white px-6 py-12 dark:bg-slate-900">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
