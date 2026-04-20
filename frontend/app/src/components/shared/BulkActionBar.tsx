import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface BulkAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
}

interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  actions: BulkAction[]
  className?: string
}

/**
 * Sticky bar that appears above a list when items are selected.
 * Provides a selected-count label, action buttons, and a clear button.
 */
export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/70 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur',
        'dark:border-amber-800/60 dark:bg-slate-900/95',
        className,
      )}
    >
      <span className="text-sm font-medium text-foreground">
        {selectedCount} selected
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant={action.variant === 'destructive' ? 'destructive' : action.variant ?? 'outline'}
              className={cn(
                'h-8 gap-1.5 rounded-xl text-xs font-semibold',
                action.variant === 'destructive' &&
                  'border-0 bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-400 dark:bg-red-600 dark:hover:bg-red-500',
              )}
              onClick={action.onClick}
              disabled={action.loading || action.disabled}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {action.loading ? 'Working…' : action.label}
            </Button>
          )
        })}

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg"
          onClick={onClearSelection}
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
