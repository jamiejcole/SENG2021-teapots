import { Link } from 'react-router-dom'
import { LandingLogo } from '@/components/landing/LandingLogo'

const FOOTER_LINKS = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Support', to: '/support' },
] as const

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-t border-stone-200/90 bg-white/60 py-14 backdrop-blur-sm dark:border-white/[0.08] dark:bg-slate-950/50"
      role="contentinfo"
    >
      <div className="container">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <LandingLogo />
            <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300/90">
              Teapots Invoicing helps teams run UBL XML invoicing, purchase orders, and despatch workflows
              with validation, analytics, and AI-assisted drafting—without losing structure or control.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-semibold text-stone-700 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-amber-50"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="#hero"
              className="text-sm font-semibold text-stone-700 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-amber-50"
            >
              Back to top
            </a>
          </nav>
        </div>
        <p className="mt-12 text-xs text-stone-500 dark:text-stone-500">
          © {year} Teapots Invoicing. UBL XML invoicing, invoice order despatch platform, and AI-assisted
          document workflows.
        </p>
      </div>
    </footer>
  )
}
