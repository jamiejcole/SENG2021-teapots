import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'type' | 'size'> {
  onCheckedChange?: (checked: boolean) => void
}

/**
 * Custom checkbox — gold checked state, theme-aware borders, animated checkmark.
 * Renders a visually hidden native input for forms + a11y.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, disabled, checked, defaultChecked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center leading-none',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          disabled={disabled}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={handleChange}
          {...props}
        />
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all duration-200 ease-out',
            'border-amber-300/90 bg-white shadow-sm dark:border-amber-700/80 dark:bg-slate-900/90',
            'peer-hover:border-amber-400 peer-hover:shadow-[0_0_0_3px_hsl(47_100%_58%/0.18)] dark:peer-hover:border-amber-500',
            'peer-checked:border-amber-500 peer-checked:bg-amber-400 dark:peer-checked:border-amber-400 dark:peer-checked:bg-amber-500',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/90 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            'peer-disabled:pointer-events-none',
            '[&_svg]:scale-50 [&_svg]:opacity-0 peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100',
          )}
          aria-hidden
        >
          <Check className="h-2.5 w-2.5 stroke-[3] text-white" stroke="currentColor" aria-hidden />
        </span>
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
