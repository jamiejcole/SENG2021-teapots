import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/landing/Reveal'

export function FinalCTASection() {
  return (
    <section
      id="get-started"
      className="scroll-mt-24 pb-24 pt-4 md:pb-32"
      aria-labelledby="cta-heading"
    >
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/80 bg-gradient-to-br from-amber-300/95 via-amber-200/90 to-sky-400/85 p-10 shadow-lift ring-1 ring-amber-900/10 dark:border-amber-700/30 dark:from-amber-800/50 dark:via-amber-950/60 dark:to-sky-950/75 dark:ring-amber-500/15 md:p-14">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/30 blur-3xl dark:bg-sky-400/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-amber-950/12 blur-3xl dark:bg-amber-950/30"
              aria-hidden
            />

            <div className="relative max-w-2xl">
              <h2
                id="cta-heading"
                className="font-display text-3xl font-semibold tracking-tight text-amber-950 dark:text-amber-50 md:text-4xl"
              >
                Ready for calmer UBL XML invoicing?
              </h2>
              <p className="mt-4 text-pretty text-lg text-amber-950/90 dark:text-amber-100/85">
                Join teams using Teapots Invoicing to run structured invoices, orders, and despatch with a
                dashboard and studio experience that feels as good as the outcomes it produces.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/auth/sign-up"
                  className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-amber-950 px-6 py-3.5 text-base font-semibold text-amber-50 shadow-md transition hover:bg-amber-900 dark:bg-amber-100 dark:text-amber-950 dark:hover:bg-white"
                >
                  Create account
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  to="/auth/sign-in"
                  className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-amber-950/20 bg-white/50 px-6 py-3.5 text-base font-semibold text-amber-950 backdrop-blur transition hover:bg-white/80 dark:border-white/25 dark:bg-slate-950/40 dark:text-amber-50 dark:hover:bg-slate-950/60"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
