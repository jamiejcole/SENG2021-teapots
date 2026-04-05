import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

/** Served from `public/` (source: `frontend/media/teapot_gif.gif`). */
export const TEAPOT_ERROR_GIF = '/teapot_gif.gif'

/** Served from `public/` (source: `frontend/media/happy_teapot.gif`). */
export const TEAPOT_SUCCESS_GIF = '/happy_teapot.gif'

const frameSizes = {
  sm: 'size-14',
  md: 'size-[4.5rem]',
  lg: 'size-20',
} as const

export function ErrorTeapot({
  className,
  size = 'md',
}: {
  className?: string
  size?: keyof typeof frameSizes
}) {
  return (
    <img
      src={TEAPOT_ERROR_GIF}
      alt=""
      className={cn('pointer-events-none shrink-0 object-contain object-center', frameSizes[size], className)}
      aria-hidden
    />
  )
}

export function ErrorTeapotToastIcon() {
  return (
    <span className="flex h-20 w-20 shrink-0 items-center justify-center [&>img]:max-h-full [&>img]:max-w-full">
      <img
        src={TEAPOT_ERROR_GIF}
        alt=""
        className="h-20 w-20 object-contain"
        aria-hidden
      />
    </span>
  )
}

export function SuccessTeapotToastIcon() {
  return (
    <span className="flex h-20 w-20 shrink-0 items-center justify-center [&>img]:max-h-full [&>img]:max-w-full">
      <img
        src={TEAPOT_SUCCESS_GIF}
        alt=""
        className="h-20 w-20 object-contain"
        aria-hidden
      />
    </span>
  )
}

export function ErrorAlertWithTeapot({
  title,
  children,
  variant = 'default',
  className,
  teapotSize = 'sm',
}: {
  title: string
  children: React.ReactNode
  variant?: 'default' | 'destructive'
  className?: string
  teapotSize?: keyof typeof frameSizes
}) {
  return (
    <Alert
      variant={variant}
      className={cn('flex flex-row items-start gap-3.5 border py-4 [&>svg~*]:pl-0', className)}
    >
      <ErrorTeapot size={teapotSize} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{children}</AlertDescription>
      </div>
    </Alert>
  )
}
