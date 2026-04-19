import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  /** Shown under the title when collapsed — one-line preview (e.g. key field values). */
  summary?: React.ReactNode
  /** Additional element rendered in the header beside the title (e.g. a badge) */
  headerExtra?: React.ReactNode
}

/**
 * Animated expand / collapse — grid 0fr→1fr for smooth height without measuring.
 * Optional `summary` keeps collapsed rows scannable.
 */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  className,
  summary,
  headerExtra,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-amber-200/60 bg-white/80 shadow-sm dark:border-amber-900/40 dark:bg-slate-900/40',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left',
          'transition-colors',
          'hover:bg-amber-50/50 dark:hover:bg-amber-950/25',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-inset',
        )}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {headerExtra}
          </div>
          {!open && summary != null && summary !== '' && (
            <p className="mt-0.5 line-clamp-2 text-xs font-normal leading-snug text-muted-foreground">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="border-t border-amber-200/40 px-3 pb-3 pt-2 dark:border-amber-900/30"
            aria-hidden={!open}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
