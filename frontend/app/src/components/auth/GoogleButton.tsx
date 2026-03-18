import { Button } from '@/components/ui/button'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-4">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.77 32.656 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.39 4.327-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.736-3.317-11.271-7.946l-6.52 5.023C9.479 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.712 2.019-2.053 3.74-3.909 4.765h.003l6.19 5.238C36.629 39.02 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export function GoogleButton({ isLoading }: { isLoading?: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      disabled={isLoading}
      aria-label="Sign in with Google"
    >
      <GoogleIcon />
      <span className="ml-2">Continue with Google</span>
    </Button>
  )
}

