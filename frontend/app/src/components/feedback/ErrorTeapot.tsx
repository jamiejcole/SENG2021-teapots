import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

/** Served from `public/` (source: `frontend/media/teapot_gif.gif`). */
export const TEAPOT_ERROR_GIF = '/teapot_gif.gif'

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
    <img
      src={TEAPOT_ERROR_GIF}
      alt=""
      className="size-12 shrink-0 object-contain"
      aria-hidden
    />
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
