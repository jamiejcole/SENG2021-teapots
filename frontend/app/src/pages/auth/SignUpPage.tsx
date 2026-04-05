import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { ErrorAlertWithTeapot } from '@/components/feedback/ErrorTeapot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordField } from '@/components/auth/PasswordField'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthContext'

const MIN_PASSWORD_LENGTH = 8

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function SignUpPage() {
  const navigate = useNavigate()
  const { signup, isLoading: authLoading, error: authError, setError: setAuthError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [didSubmit, setDidSubmit] = useState(false)
  const submitLockRef = useRef(false)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (!email.trim()) e.email = 'Email is required.'
    else if (!validateEmail(email)) e.email = 'Enter a valid email address.'
    if (password.length < MIN_PASSWORD_LENGTH) e.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    if (confirm !== password) e.confirm = 'Passwords do not match.'
    return e
  }, [name, email, password, confirm])

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

  const canSubmit = Object.keys(errors).length === 0 && !isLoading && !authLoading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitLockRef.current) return
    setDidSubmit(true)
    setFormError(null)
    setAuthError(null)
    if (!canSubmit) return
    submitLockRef.current = true
    setIsLoading(true)
    try {
      // Parse name into first and last name
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || nameParts[0]

      const result = await signup({
        email: email.trim(),
        password,
        firstName,
        lastName,
      })

      // Redirect to 2FA verification page
      navigate('/auth/verify-2fa', {
        state: {
          userId: result.userId,
          email: email.trim(),
          firstName,
          lastName,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setFormError(message)
    } finally {
      submitLockRef.current = false
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Register with email and a password that meets the length requirement.
        </p>
      </div>

      <div className="mt-6 space-y-5">
      {(formError || authError) && (
        <ErrorAlertWithTeapot
          title="Couldn’t create account"
          className="border-amber-200 bg-amber-50 text-slate-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-slate-100"
        >
          {formError || authError}
        </ErrorAlertWithTeapot>
      )}

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
              Name
            </Label>
            <Input
              id="name"
              className={cn(
                'h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800',
                didSubmit && errors.name && 'border-amber-500 focus-visible:ring-amber-400',
              )}
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={didSubmit && !!errors.name}
            />
            {didSubmit && errors.name && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{errors.name}</p>
            )}
          </div>

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
            placeholder="Create a password"
            autoComplete="new-password"
            helperText={passwordHint}
            helperTone={passwordHintTone}
          />

          <PasswordField
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            showError={didSubmit}
            placeholder="Repeat your password"
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
                Creating account
              </span>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
            privacy policy
          </Link>.
        </p>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
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
