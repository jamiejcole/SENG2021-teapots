import type { ExternalToast } from 'sonner'
import { toast as sonnerToast } from 'sonner'
import { ErrorTeapotToastIcon } from '@/components/feedback/ErrorTeapot'

function error(message: React.ReactNode, data?: ExternalToast) {
  return sonnerToast.error(message, {
    ...data,
    icon: data?.icon !== undefined ? data.icon : <ErrorTeapotToastIcon />,
  })
}

export const toast = Object.assign(sonnerToast, { error })
