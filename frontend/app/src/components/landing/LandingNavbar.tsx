import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LandingLogo } from '@/components/landing/LandingLogo'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background,backdrop-filter,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-stone-200/90 bg-white/80 shadow-[0_1px_0_rgba(28,25,23,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-3 md:h-[4.25rem]">
        <a href="#hero" className="focus-ring min-w-0 rounded-xl">
          <LandingLogo />
        </a>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="border border-stone-200/90 bg-white/70 text-stone-600 shadow-sm backdrop-blur-sm hover:bg-stone-100 hover:text-stone-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-amber-100/80 dark:hover:bg-slate-800 dark:hover:text-amber-50" />
          <Link
            to="/auth/sign-in"
            className="focus-ring rounded-xl px-2.5 py-2 text-sm font-semibold text-stone-700 transition-colors hover:text-stone-900 sm:px-3 dark:text-stone-200/90 dark:hover:text-amber-50"
          >
            Sign in
          </Link>
          <Link
            to="/auth/sign-up"
            className="focus-ring rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm ring-1 ring-amber-600/15 transition hover:brightness-[1.03] hover:shadow-md dark:from-amber-400 dark:to-amber-500 dark:ring-amber-300/20 sm:px-4"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
