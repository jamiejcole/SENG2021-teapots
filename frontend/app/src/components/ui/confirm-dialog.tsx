import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
  variant?: 'destructive' | 'default'
  /** Optional extra content (e.g. an email input) rendered between description and buttons */
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  loading = false,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-md">
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3">
          {variant === 'destructive' && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {children && <div className="mb-4">{children}</div>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={
              variant === 'destructive'
                ? 'rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                : 'rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-500'
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
