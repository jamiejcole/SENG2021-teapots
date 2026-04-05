import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordField({
  label,
  value,
  onChange,
  error,
  showError,
  placeholder,
  autoComplete,
  helperText,
  helperTone = 'default',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  showError?: boolean
  placeholder?: string
  autoComplete?: string
  helperText?: string
  helperTone?: 'default' | 'error' | 'success'
}) {
  const id = useId()
  const [show, setShow] = useState(false)

  const helperToneClasses = {
    default: 'text-slate-500 dark:text-slate-400',
    error: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  } as const

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={showError && !!error}
          className={cn(
            'h-11 rounded-xl border-slate-200 bg-slate-50 pr-10 dark:border-slate-700 dark:bg-slate-800',
            showError && error && 'border-amber-500 focus-visible:ring-amber-400',
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {helperText && (
        <p className={cn('text-sm', helperToneClasses[helperTone])}>{helperText}</p>
      )}
      {showError && error && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
      )}
    </div>
  )
}

