import {
  BarChart3,
  Bot,
  ClipboardCheck,
  FileInput,
  LayoutTemplate,
  Mail,
} from 'lucide-react'
import { Reveal } from '@/components/landing/Reveal'

const FEATURES = [
  {
    icon: Bot,
    title: 'AI assistance',
    body: 'Accelerate drafting and cleanup with context-aware suggestions grounded in your document structure.',
  },
  {
    icon: LayoutTemplate,
    title: 'Invoice editor / studio',
    body: 'A focused workspace for XML-backed invoices—fast navigation, clear sections, fewer mistakes.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard analytics',
    body: 'Understand throughput, bottlenecks, and document health without exporting to spreadsheets.',
  },
  {
    icon: FileInput,
    title: 'Order & despatch workflows',
    body: 'Keep operational documents aligned from order capture through to fulfilment signals.',
  },
  {
    icon: ClipboardCheck,
    title: 'Validation & structured XML',
    body: 'Catch structural issues before they reach partners—cleaner handoffs, fewer rejections.',
  },
  {
    icon: Mail,
    title: 'Save, export & share',
    body: 'Export dependable UBL XML, preserve versions, and share confidently with your network.',
  },
] as const

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 py-20 md:py-28"
      aria-labelledby="features-heading"
    >
      <div className="container">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
            Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-4xl"
          >
            Everything you need for a modern invoicing stack
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-stone-600 dark:text-stone-300/90">
            Purpose-built tools for teams that live in structured documents—without sacrificing speed,
            clarity, or control.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={0.04 * i}>
              <li className="h-full rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white/95 to-amber-50/25 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift dark:from-slate-900/75 dark:to-amber-950/15 dark:border-white/[0.08]">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950/55 dark:text-sky-200">
                  <f.icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-stone-900 dark:text-amber-50">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300/90">
                  {f.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
