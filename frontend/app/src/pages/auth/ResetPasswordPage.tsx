import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { ErrorAlertWithTeapot } from '@/components/feedback/ErrorTeapot'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/auth/PasswordField'
import { resetPassword } from '@/api/auth'

const MIN_PASSWORD_LENGTH = 8

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [didSubmit, setDidSubmit] = useState(false)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!token) e.token = 'Your reset link is missing its token.'
    if (password.length < MIN_PASSWORD_LENGTH) e.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    if (confirm !== password) e.confirm = 'Passwords do not match.'
    return e
  }, [token, password, confirm])

  const canSubmit = Object.keys(errors).length === 0 && !isLoading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDidSubmit(true)
    setFormError(null)
    setSuccessMessage(null)
    if (!canSubmit) return

    setIsLoading(true)
    try {
      const result = await resetPassword({ token, password })
      setSuccessMessage(result.message)
      setTimeout(() => navigate('/auth/sign-in', { replace: true }), 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      setFormError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Invalid reset link
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This password reset page needs a valid token from your email.
            </p>
          </div>
          <Button
            onClick={() => navigate('/auth/forgot-password')}
            className="w-full rounded-xl bg-amber-400 px-6 font-semibold text-slate-900 shadow-md shadow-amber-400/30 hover:bg-amber-500"
          >
            Request a new link
          </Button>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <Link
              to="/auth/sign-in"
              className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const passwordHint = !password
    ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    : password.length < MIN_PASSWORD_LENGTH
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      : 'Password length looks good.'
  const passwordHintTone = !password
    ? 'default'
    : password.length < MIN_PASSWORD_LENGTH
      ? 'error'
      : 'success'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Choose a new password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create a new password for your account. The link only works once.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {formError && (
          <ErrorAlertWithTeapot
            title="Couldn’t reset password"
            className="border-amber-200 bg-amber-50 text-slate-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-slate-100"
          >
            {formError}
          </ErrorAlertWithTeapot>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-semibold">Password updated</p>
            <p className="mt-1">{successMessage}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            showError={didSubmit}
            placeholder="Create a new password"
            autoComplete="new-password"
            helperText={passwordHint}
            helperTone={passwordHintTone}
          />

          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            showError={didSubmit}
            placeholder="Repeat your new password"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            className="w-full rounded-xl bg-amber-400 px-6 font-semibold text-slate-900 shadow-md shadow-amber-400/30 hover:bg-amber-500 disabled:opacity-50"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Saving password
              </span>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Want to go back?{' '}
          <Link
            to="/auth/sign-in"
            className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}