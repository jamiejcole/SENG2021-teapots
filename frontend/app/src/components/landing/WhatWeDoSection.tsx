import { Bot, FileCode2, LayoutDashboard, Truck } from 'lucide-react'
import { Reveal } from '@/components/landing/Reveal'
import { cn } from '@/lib/utils'

const CARDS = [
  {
    icon: FileCode2,
    title: 'UBL XML invoicing',
    body: 'Author standards-aligned invoices with structured fields, validation, and export-ready XML your partners can trust.',
  },
  {
    icon: Truck,
    title: 'Orders & despatch',
    body: 'Run purchase orders and despatch workflows alongside billing so fulfilment and finance stay in sync.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard & studio',
    body: 'Monitor health at a glance, then switch to the editor for precise, line-level control when it matters.',
  },
  {
    icon: Bot,
    title: 'AI-powered assistance',
    body: 'Get intelligent suggestions for structure and content—without giving up review, approval, or accountability.',
  },
] as const

export function WhatWeDoSection() {
  return (
    <section
      id="what-we-do"
      className="scroll-mt-24 py-20 md:py-28"
      aria-labelledby="what-heading"
    >
      <div className="container">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
            What we do
          </p>
          <h2
            id="what-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-4xl"
          >
            One platform for UBL XML invoicing, orders, and despatch
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-stone-600 dark:text-stone-300/90">
            Teapots Invoicing brings together structured document workflows and modern tooling—so finance
            and operations stay aligned on a single source of truth.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={0.05 * i}>
              <article
                className={cn(
                  'group h-full rounded-2xl border border-stone-200/90 bg-white/90 p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300/50 hover:shadow-lift dark:border-white/[0.08] dark:bg-slate-900/70 dark:hover:border-sky-500/35',
                )}
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-900 shadow-sm ring-1 ring-stone-200/80 dark:from-amber-900/45 dark:to-amber-950/35 dark:text-amber-100 dark:ring-white/[0.08]">
                  <card.icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-stone-900 dark:text-amber-50">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300/90">
                  {card.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
