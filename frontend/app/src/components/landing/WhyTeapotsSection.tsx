import { Reveal } from '@/components/landing/Reveal'

export function WhyTeapotsSection() {
  return (
    <section
      id="why-teapots"
      className="scroll-mt-24 py-20 md:py-28"
      aria-labelledby="why-heading"
    >
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
              Why Teapots
            </p>
            <h2
              id="why-heading"
              className="mt-3 font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-4xl"
            >
              Structured documents, human-friendly workflow
            </h2>
            <p className="mt-5 text-pretty text-lg text-stone-600 dark:text-stone-300/90">
              Most teams do not struggle with XML because they love syntax—they struggle because tools
              split the story across spreadsheets, inboxes, and one-off exports. Teapots Invoicing keeps
              UBL XML invoicing, orders, and despatch inside one calm, modern experience—so validation,
              analytics, and collaboration live where the document lives.
            </p>
          </Reveal>

          <div className="space-y-5">
            {[
              {
                title: 'Smooth end-to-end flow',
                body: 'Move from draft to partner-ready output without tab-hopping or brittle copy/paste between systems.',
              },
              {
                title: 'Modern UI with serious depth',
                body: 'A polished interface that still respects structure—fields, sections, and lineage stay visible.',
              },
              {
                title: 'AI where it helps',
                body: 'Assistance that accelerates drafting and review, while keeping humans in control of approvals.',
              },
              {
                title: 'All-in-one document hub',
                body: 'Invoices, orders, and despatch signals in one place—better alignment for finance and operations.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={0.05 * i}>
                <div className="rounded-2xl border border-stone-200/90 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-white/[0.08] dark:bg-slate-900/65">
                  <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-amber-50">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300/90">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
