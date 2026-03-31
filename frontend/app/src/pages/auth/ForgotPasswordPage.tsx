import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { ErrorAlertWithTeapot } from '@/components/feedback/ErrorTeapot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { requestPasswordReset } from '@/api/auth'

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [didSubmit, setDidSubmit] = useState(false)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required.'
    else if (!validateEmail(email)) e.email = 'Enter a valid email address.'
    return e
  }, [email])

  const canSubmit = Object.keys(errors).length === 0 && !isLoading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDidSubmit(true)
    setFormError(null)
    setSuccessMessage(null)
    if (!canSubmit) return

    setIsLoading(true)
    try {
      const result = await requestPasswordReset({ email: email.trim() })
      setSuccessMessage(result.message)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset request failed'
      setFormError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Reset your password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we’ll send you a magic link to set a new password.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {formError && (
          <ErrorAlertWithTeapot
            title="Couldn’t send reset email"
            className="border-amber-200 bg-amber-50 text-slate-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-slate-100"
          >
            {formError}
          </ErrorAlertWithTeapot>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-semibold">Check your email</p>
            <p className="mt-1">{successMessage}</p>
          </div>
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

          <Button
            type="submit"
            className="w-full rounded-xl bg-amber-400 px-6 font-semibold text-slate-900 shadow-md shadow-amber-400/30 hover:bg-amber-500 disabled:opacity-50"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Sending link
              </span>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered your password?{' '}
          <Link
            to="/auth/sign-in"
            className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}