import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { ErrorAlertWithTeapot } from '@/components/feedback/ErrorTeapot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { PasswordField } from '@/components/auth/PasswordField'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthContext'

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function SignInPage() {
  const navigate = useNavigate()
  const { login, isLoading: authLoading, error: authError, setError: setAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [didSubmit, setDidSubmit] = useState(false)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required.'
    else if (!validateEmail(email)) e.email = 'Enter a valid email address.'
    if (!password) e.password = 'Password is required.'
    return e
  }, [email, password])

  const canSubmit = Object.keys(errors).length === 0 && !isLoading && !authLoading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDidSubmit(true)
    setFormError(null)
    setAuthError(null)
    if (!canSubmit) return
    setIsLoading(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setFormError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Sign in
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back. Sign in with email or continue with Google below.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {(formError || authError) && (
          <ErrorAlertWithTeapot
            title="Couldn’t sign in"
            className="border-amber-200 bg-amber-50 text-slate-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-slate-100"
          >
            {formError || authError}
          </ErrorAlertWithTeapot>
        )}

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              className={cn(
                'h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800',
                didSubmit && errors.email && 'border-amber-500 focus-visible:ring-amber-400',
              )}
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              aria-invalid={didSubmit && !!errors.email}
            />
            {didSubmit && errors.email && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{errors.email}</p>
            )}
          </div>

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            showError={didSubmit}
            placeholder="Your password"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between gap-4">
            <Link
              to="#"
              className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              Forgot password?
            </Link>
            <Button
              type="submit"
              className="rounded-xl bg-amber-400 px-6 font-semibold text-slate-900 shadow-md shadow-amber-400/30 hover:bg-amber-500 disabled:opacity-50"
              disabled={!canSubmit}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              or
            </span>
          </div>
        </div>

        <GoogleButton isLoading={isLoading} />

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          New here?{' '}
          <Link
            to="/auth/sign-up"
            className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
