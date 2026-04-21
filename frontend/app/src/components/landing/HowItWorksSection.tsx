import { CheckCircle2 } from 'lucide-react'
import { Reveal } from '@/components/landing/Reveal'

const STEPS = [
  {
    title: 'Create / import',
    body: 'Start from templates or bring existing UBL XML and order data into the workspace.',
  },
  {
    title: 'Edit',
    body: 'Refine lines, parties, and tax in the studio with structured fields and helpful checks.',
  },
  {
    title: 'Validate',
    body: 'Catch issues early with validation tuned for XML structure and business rules.',
  },
  {
    title: 'Manage',
    body: 'Track status across invoices, orders, and despatch from a unified dashboard.',
  },
  {
    title: 'Export / use',
    body: 'Export clean XML, share with partners, and archive a dependable audit trail.',
  },
] as const

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-stone-200/80 bg-gradient-to-b from-amber-50/35 via-white/60 to-sky-50/25 py-20 dark:border-white/[0.06] dark:from-slate-950/50 dark:via-slate-950/30 dark:to-sky-950/25 md:py-28"
      aria-labelledby="how-heading"
    >
      <div className="container">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
            How it works
          </p>
          <h2
            id="how-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-4xl"
          >
            A simple flow from document to delivery
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-stone-600 dark:text-stone-300/90">
            From first draft to partner-ready UBL XML—Teapots keeps the path obvious, so teams spend less
            time fixing files and more time running the business.
          </p>
        </Reveal>

        <div className="relative mt-16 max-w-3xl">
          <div
            className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-gradient-to-b from-amber-300 via-sky-200 to-amber-200 dark:from-amber-700 dark:via-sky-900 dark:to-amber-900 md:left-[1.6rem]"
            aria-hidden
          />
          <ol className="space-y-0">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={0.06 * i}>
                <li className="relative flex gap-5 pb-12 last:pb-0 md:gap-7">
                  <div className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-amber-950 shadow-soft md:size-12 md:text-base">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-stone-200/90 bg-white/90 p-5 shadow-soft backdrop-blur transition hover:border-sky-300/50 dark:border-white/[0.08] dark:bg-slate-900/65 dark:hover:border-sky-500/40">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400"
                        aria-hidden
                      />
                      <div>
                        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-amber-50">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300/90">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-6 max-w-3xl rounded-[2rem] border border-stone-200/90 bg-white/85 p-6 shadow-soft backdrop-blur dark:border-white/[0.08] dark:bg-slate-900/65 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-400">
              XML document workflow
            </p>
            <p className="mt-3 text-pretty text-base leading-relaxed text-stone-600 dark:text-stone-300/90">
              Teapots is built around structured documents: predictable fields, reliable validation, and
              exports that behave consistently—whether you are issuing invoices, confirming orders, or
              recording despatch.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300/95 shadow-inner dark:bg-black/50">
              {`<!-- UBL-ready, team-friendly -->
<Invoice>
  <!-- ... -->
</Invoice>`}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
