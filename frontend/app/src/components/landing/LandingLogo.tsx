import { cn } from '@/lib/utils'
import { teapotLogoUrl } from '@/brand/teapotLogo'

type LandingLogoProps = {
  className?: string
  compact?: boolean
}

export function LandingLogo({ className, compact }: LandingLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={teapotLogoUrl}
        alt="Teapots Invoicing logo"
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        className="size-9 shrink-0 object-contain drop-shadow-[0_1px_2px_rgba(28,25,23,0.12)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] md:size-11"
      />
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-stone-900 dark:text-amber-50 md:text-xl">
          Teapots
        </span>
        {!compact && (
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300/95">
            Invoicing
          </span>
        )}
      </div>
    </div>
  )
}
