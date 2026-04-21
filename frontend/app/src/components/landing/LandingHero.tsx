import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/landing/Reveal'

export function LandingHero() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="hero"
      className="relative overflow-hidden pb-20 pt-10 md:pb-28 md:pt-14"
      aria-labelledby="hero-heading"
    >
      <div className="container grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700 shadow-sm backdrop-blur dark:border-white/[0.1] dark:bg-slate-900/70 dark:text-amber-200/90">
              <Sparkles className="size-3.5 text-sky-600 dark:text-sky-400" aria-hidden />
              UBL XML · Orders · Despatch
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mt-6">
            <h1
              id="hero-heading"
              className="font-display text-balance text-4xl font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
            >
              The calm way to run{' '}
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-sky-600 bg-clip-text text-transparent dark:from-amber-300 dark:via-amber-200 dark:to-sky-300">
                structured invoicing
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.1} className="mt-5 max-w-xl text-pretty text-lg text-stone-600 dark:text-stone-300/95">
            Teapots Invoicing is a modern platform for UBL XML invoices, purchase orders, and despatch
            workflows—paired with validation, analytics, and AI assistance so your team ships correct
            documents faster.
          </Reveal>

          <Reveal delay={0.14} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/auth/sign-up"
              className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-base font-semibold text-amber-950 shadow-md ring-1 ring-amber-600/15 transition hover:brightness-[1.03] dark:ring-amber-300/20"
            >
              Start free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-stone-200/90 bg-white/85 px-6 py-3.5 text-base font-semibold text-stone-900 shadow-sm backdrop-blur transition hover:border-sky-300/70 hover:bg-white dark:border-white/[0.12] dark:bg-slate-900/70 dark:text-amber-50 dark:hover:border-sky-500/45 dark:hover:bg-slate-900"
            >
              See the flow
            </a>
          </Reveal>

          <Reveal delay={0.18} className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-stone-500 dark:text-stone-400">
            <span>Structured UBL XML workflow</span>
            <span className="hidden sm:inline">·</span>
            <span>Invoice studio &amp; dashboard</span>
            <span className="hidden sm:inline">·</span>
            <span>Built for teams that care about accuracy</span>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
          <motion.div
            className="relative aspect-[4/3] w-full"
            initial={false}
            aria-hidden
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/95 via-amber-50/40 to-sky-100/35 p-1 shadow-lift ring-1 ring-stone-200/80 dark:from-slate-900/95 dark:via-slate-900/70 dark:to-sky-950/35 dark:ring-white/[0.08]">
              <div className="flex h-full flex-col overflow-hidden rounded-[1.85rem] bg-white/95 dark:bg-slate-950/85">
                <div className="flex items-center gap-2 border-b border-stone-200/80 px-4 py-3 dark:border-white/[0.08]">
                  <span className="size-2.5 rounded-full bg-red-400/90" />
                  <span className="size-2.5 rounded-full bg-amber-300/90" />
                  <span className="size-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-3 text-xs font-medium text-stone-500 dark:text-stone-400">
                    Studio · Invoice.xml
                  </span>
                </div>
                <div className="grid flex-1 grid-cols-5 gap-0">
                  <div className="col-span-2 border-r border-stone-200/80 bg-amber-50/40 p-4 dark:border-white/[0.08] dark:bg-amber-950/25">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Outline
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-stone-700 dark:text-stone-300/90">
                      <li className="rounded-lg bg-white/90 px-2 py-1.5 shadow-sm ring-1 ring-stone-200/60 dark:bg-slate-900/90 dark:ring-white/[0.06]">
                        Header
                      </li>
                      <li className="px-2 py-1">Tax totals</li>
                      <li className="px-2 py-1">Lines</li>
                      <li className="px-2 py-1">Parties</li>
                    </ul>
                  </div>
                  <div className="col-span-3 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-stone-900 dark:text-amber-50">UBL preview</p>
                      <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950/70 dark:text-sky-200">
                        Valid
                      </span>
                    </div>
                    <pre className="mt-3 max-h-[180px] overflow-hidden rounded-xl bg-slate-950 p-3 text-[10px] leading-relaxed text-emerald-300/95 dark:bg-black/50">
                      {`<Invoice>
  <ID>INV-2048</ID>
  <IssueDate>2026-04-21</IssueDate>
  <LegalMonetaryTotal>
    <PayableAmount>12,480.00</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 -top-6 hidden h-24 w-40 rounded-2xl border border-sky-200/70 bg-white/90 p-3 shadow-soft backdrop-blur dark:border-sky-500/25 dark:bg-slate-900/85 md:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-800/80 dark:text-sky-300/80">
                Dashboard
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-sky-100 dark:bg-sky-950/80" />
              <div className="mt-2 h-2 w-4/5 rounded-full bg-amber-200/80 dark:bg-amber-900/50" />
              <div className="mt-2 h-2 w-3/5 rounded-full bg-amber-100/90 dark:bg-amber-900/30" />
            </div>

            <motion.div
              className="absolute -left-6 bottom-8 hidden rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 shadow-soft dark:border-amber-800/45 dark:bg-amber-950/55 md:block"
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={
                reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 dark:text-amber-200/55">
                AI assist
              </p>
              <p className="mt-1 text-xs text-stone-700 dark:text-amber-100/80">
                Suggest line fixes before export.
              </p>
            </motion.div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}
