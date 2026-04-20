import * as React from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type SelectBadge = { label: string; className?: string }

export type SelectOption = {
  value: string
  label: string
  secondary?: string
  badge?: SelectBadge
}

export type SelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  id?: string
  'aria-labelledby'?: string
  listMaxHeight?: string
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches',
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  listMaxHeight = '16rem',
}: SelectProps) {
  const uid = useId().replace(/:/g, '')
  const listboxId = `${uid}-listbox`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options
    const q = normalize(query)
    return options.filter(
      (o) =>
        normalize(o.label).includes(q) ||
        (o.secondary && normalize(o.secondary).includes(q)) ||
        normalize(o.value).includes(q),
    )
  }, [options, query, searchable])

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      if (searchable) searchRef.current?.focus()
      else panelRef.current?.focus()
    }, 0)
    return () => clearTimeout(t)
  }, [open, searchable])

  useEffect(() => {
    setHighlighted((h) => {
      if (filtered.length === 0) return 0
      return Math.min(h, filtered.length - 1)
    })
  }, [filtered.length, query])

  useEffect(() => {
    if (!open) return
    const idx = filtered.findIndex((o) => o.value === value)
    if (idx >= 0) setHighlighted(idx)
  }, [open, filtered, value])

  useEffect(() => {
    const el = optionRefs.current[highlighted]
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const selectIndex = (i: number) => {
    const opt = filtered[i]
    if (!opt) return
    onValueChange(opt.value)
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  const moveHighlight = (delta: number) => {
    if (filtered.length === 0) return
    setHighlighted((h) => Math.max(0, Math.min(filtered.length - 1, h + delta)))
  }

  const onKeyDownTrigger = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((o) => !o)
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onKeyDownPanel = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveHighlight(1)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveHighlight(-1)
    }
    if (e.key === 'Home') {
      e.preventDefault()
      setHighlighted(0)
    }
    if (e.key === 'End') {
      e.preventDefault()
      setHighlighted(Math.max(0, filtered.length - 1))
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault()
      selectIndex(highlighted)
    }
  }

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveHighlight(1)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveHighlight(-1)
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault()
      selectIndex(highlighted)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
      triggerRef.current?.focus()
    }
  }

  const displayLabel = selected ? selected.label : placeholder
  const displaySecondary = selected?.secondary

  optionRefs.current = []

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
        aria-activedescendant={open && filtered[highlighted] ? `${uid}-opt-${highlighted}` : undefined}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm shadow-sm transition-all duration-150',
          'border-amber-200/90 bg-white text-foreground dark:border-amber-800/55 dark:bg-slate-900/95',
          'hover:border-amber-300 dark:hover:border-amber-700/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/85 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          disabled && 'cursor-not-allowed opacity-50',
          open && 'border-amber-400 ring-1 ring-amber-400/30',
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDownTrigger}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selected ? (
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{displayLabel}</span>
              {displaySecondary && (
                <span className="truncate text-xs text-muted-foreground">{displaySecondary}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        {selected?.badge && (
          <Badge
            className={cn(
              'hidden shrink-0 text-[10px] sm:inline-flex',
              selected.badge.className,
            )}
          >
            {selected.badge.label}
          </Badge>
        )}
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-amber-600 transition-transform duration-200 dark:text-amber-400',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg outline-none select-panel-pop"
          onKeyDown={onKeyDownPanel}
        >
          {searchable && (
            <div className="border-b border-border/60 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setHighlighted(0)
                  }}
                  placeholder={searchPlaceholder}
                  className="h-8 rounded-lg border-amber-200/60 bg-background pl-8 text-sm dark:border-amber-800/50"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={onSearchKeyDown}
                  aria-autocomplete="list"
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto p-1" style={{ maxHeight: listMaxHeight }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value
                const isHi = i === highlighted
                return (
                  <div
                    key={`${opt.value}-${i}`}
                    id={`${uid}-opt-${i}`}
                    ref={(el) => {
                      optionRefs.current[i] = el
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors duration-100',
                      isHi && 'bg-amber-50 dark:bg-amber-950/40',
                      isSelected && !isHi && 'bg-amber-100/60 dark:bg-amber-950/30',
                      !isHi && !isSelected && 'hover:bg-muted/70',
                    )}
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectIndex(i)
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium leading-tight">{opt.label}</div>
                      {opt.secondary && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{opt.secondary}</div>
                      )}
                    </div>
                    {opt.badge && (
                      <Badge className={cn('shrink-0 text-[10px]', opt.badge.className)}>{opt.badge.label}</Badge>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes select-panel-in {
          from { opacity: 0; transform: scale(0.98) translateY(-3px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .select-panel-pop { animation: select-panel-in 0.16s ease-out; }
      `}</style>
    </div>
  )
}
