import { Moon, Sun, SunMoon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme/ThemeProvider'
import type { ThemeMode } from '@/components/theme/theme'

export function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme()

  function pick(next: ThemeMode) {
    setMode(next)
  }

  const Icon = mode === 'system' ? SunMoon : resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="focus-ring" aria-label="Theme">
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => pick('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => pick('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => pick('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

