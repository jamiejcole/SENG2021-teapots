import { useNavigate } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface RecordAction {
  label: string
  icon?: LucideIcon
  onClick: (e: React.MouseEvent) => void
  variant?: 'default' | 'destructive'
}

interface RecordListItemProps {
  id: string
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  title: string
  subtitle?: string
  meta?: string
  badge?: { label: string; className?: string }
  /** Icon/avatar element to render on the left */
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  actions?: RecordAction[]
  className?: string
  /** Tighter row: checkbox + row menu fade in on hover (always visible when selected). */
  density?: 'default' | 'compact'
}

/**
 * Reusable themed row for lists of records (orders, invoices, despatches).
 * Handles checkbox selection, hover / selected ring, quick-action menu, and navigation.
 */
export function RecordListItem({
  id,
  selected,
  onSelect,
  title,
  subtitle,
  meta,
  badge,
  icon,
  href,
  onClick,
  actions = [],
  className,
  density = 'default',
}: RecordListItemProps) {
  const navigate = useNavigate()

  const handleRowClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      navigate(href)
    }
  }

  return (
    <div
      role="row"
      className={cn(
        // Base
        'group relative flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3',
        'transition-all duration-150',
        // Default state
        'border-amber-200/50 bg-white/80 dark:border-amber-900/30 dark:bg-slate-900/40',
        // Hover
        'hover:border-amber-300 hover:shadow-sm dark:hover:border-amber-800/60',
        // Selected
        selected &&
          'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/50 dark:border-amber-500 dark:bg-amber-950/20 dark:ring-amber-500/40',
        className,
      )}
      onClick={handleRowClick}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'shrink-0',
          density === 'compact' &&
            'max-sm:!opacity-100 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          density === 'compact' && selected && '!opacity-100',
        )}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={(c) => onSelect(id, c)}
          aria-label="Select record"
        />
      </div>

      {/* Optional icon/avatar */}
      {icon && <div className="shrink-0">{icon}</div>}

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{title}</span>
          {badge && (
            <Badge
              className={cn(
                'h-5 px-2 text-xs',
                badge.className ??
                  'border-amber-300/70 bg-amber-100 text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300',
              )}
            >
              {badge.label}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Meta (amount / date) */}
      {meta && (
        <div className="shrink-0 text-right">
          <span className="text-sm font-medium text-foreground">{meta}</span>
        </div>
      )}

      {/* Quick-action menu */}
      {actions.length > 0 && (
        <div
          className={cn(
            'shrink-0 transition-opacity duration-150',
            density === 'compact'
              ? 'max-sm:opacity-100 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
              : 'opacity-80 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg"
                aria-label="Row actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      'cursor-pointer gap-2',
                      action.variant === 'destructive' &&
                        'text-red-600 hover:!bg-red-50 focus:text-red-600 dark:text-red-400 dark:hover:!bg-red-950/35 dark:focus:text-red-400',
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {action.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
