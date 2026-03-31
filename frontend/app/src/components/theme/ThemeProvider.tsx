import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { applyThemeClass, getStoredTheme, storeTheme, type ThemeMode } from '@/components/theme/theme'

type ThemeContextValue = {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredTheme())
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    storeTheme(mode)
  }, [mode])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = useMemo<'light' | 'dark'>(() => {
    if (mode === 'system') return systemDark ? 'dark' : 'light'
    return mode
  }, [mode, systemDark])

  useEffect(() => {
    // external side-effect: keep DOM in sync
    applyThemeClass(resolved)
    storeTheme(mode)
  }, [mode, resolved])

  const value = useMemo<ThemeContextValue>(() => {
    return {
      mode,
      resolved,
      setMode: setModeState,
      toggle: () => setModeState(resolved === 'dark' ? 'light' : 'dark'),
    }
  }, [mode, resolved])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

