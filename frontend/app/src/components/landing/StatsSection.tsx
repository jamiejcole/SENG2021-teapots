import { Reveal } from '@/components/landing/Reveal'
import { CountUp } from '@/components/landing/CountUp'

const STATS = [
  {
    label: 'Documents processed (sample)',
    render: () => (
      <>
        <CountUp value={2.4} decimals={1} suffix="M+" className="font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-amber-50 md:text-5xl" />
      </>
    ),
    caption: 'Structured XML workflows at scale',
  },
  {
    label: 'Faster cycle time (sample)',
    render: () => (
      <>
        <CountUp value={42} suffix="%" className="font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-amber-50 md:text-5xl" />
      </>
    ),
    caption: 'Less back-and-forth on corrections',
  },
  {
    label: 'Validation accuracy (sample)',
    render: () => (
      <>
        <CountUp value={99.8} decimals={1} suffix="%" className="font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-amber-50 md:text-5xl" />
      </>
    ),
    caption: 'Catch issues before partners do',
  },
  {
    label: 'Teams supported (sample)',
    render: () => (
      <>
        <CountUp value={500} suffix="+" className="font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-amber-50 md:text-5xl" />
      </>
    ),
    caption: 'Finance & ops on one system',
  },
] as const

export function StatsSection() {
  return (
    <section
      id="stats"
      className="scroll-mt-24 border-y border-stone-200/80 bg-gradient-to-br from-amber-100/40 via-white to-sky-100/35 py-20 dark:border-white/[0.06] dark:from-amber-950/20 dark:via-slate-950 dark:to-sky-950/28 md:py-28"
      aria-labelledby="stats-heading"
    >
      <div className="container">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
            Trust
          </p>
          <h2
            id="stats-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-4xl"
          >
            Built for teams that measure twice and ship once
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-stone-600 dark:text-stone-300/90">
            Sample indicators of what a structured UBL XML invoicing and order platform can unlock—fewer
            surprises, faster handoffs, and calmer month-end.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={0.06 * i}>
              <div className="rounded-2xl border border-stone-200/90 bg-white/90 p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lift dark:border-white/[0.08] dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {s.label}
                </p>
                <div className="mt-4">{s.render()}</div>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{s.caption}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
