import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme/ThemeProvider'

export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const isLight = resolved === 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/40 dark:hover:text-amber-300"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5" />
      )}
    </button>
  )
}
