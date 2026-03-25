import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { verify2FA } from '@/api/auth'
import { useAuth } from '@/components/auth/AuthContext'

export function Verify2FAPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { handle2FAVerification } = useAuth()
  const userId = (location.state as { userId?: string })?.userId
  const email = (location.state as { email?: string })?.email
  
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [didSubmit, setDidSubmit] = useState(false)

  const codeError = useMemo(() => {
    if (!code) return 'Code is required.'
    if (code.length !== 6) return 'Code must be 6 digits.'
    if (!/^\d+$/.test(code)) return 'Code must contain only numbers.'
    return ''
  }, [code])

  // Redirect to signup if no userId
  if (!userId) {
    // const validatedUserId = ''
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              No 2FA Session
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please sign up first to get a verification code.
            </p>
          </div>
          <Button
            onClick={() => navigate('/auth/sign-up')}
            className="w-full rounded-xl bg-amber-400 px-6 font-semibold text-slate-900 shadow-md shadow-amber-400/30 hover:bg-amber-500"
          >
            Go to Sign Up
          </Button>
        </div>
      </div>
    )
  }
  
  // After the check above, userId is guaranteed to be a string
  const validatedUserId = userId as string

  const canSubmit = !codeError && !isLoading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDidSubmit(true)
    setError(null)
    if (!canSubmit) return
    
    setIsLoading(true)
    try {
      const result = await verify2FA({ userId: validatedUserId, code })
      
      // Auto-login with the tokens from 2FA verification
      if (!email) {
        throw new Error('Email not found in session')
      }
      handle2FAVerification(
        { accessToken: result.accessToken, refreshToken: result.refreshToken },
        email
      )
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Verify your email
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter the 6-digit code we sent to your email.<br />Nothing there? Check your spam folder.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-700 dark:text-slate-300">
              Verification Code
            </Label>
            <Input
              id="code"
              className={cn(
                'h-11 rounded-xl border-slate-200 bg-slate-50 text-center text-2xl tracking-widest dark:border-slate-700 dark:bg-slate-800',
                didSubmit && codeError && 'border-red-500 focus-visible:ring-red-400',
              )}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(ev) => setCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoComplete="one-time-code"
              aria-invalid={didSubmit && !!codeError}
            />
            {didSubmit && codeError && (
              <p className="text-sm text-red-600 dark:text-red-400">{codeError}</p>
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
                Verifying
              </span>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Didn't receive the code?</p>
          <button
            onClick={() => navigate('/auth/sign-up')}
            className="font-medium text-amber-600 underline-offset-4 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Sign up again
          </button>
        </div>
      </div>
    </div>
  )
}
