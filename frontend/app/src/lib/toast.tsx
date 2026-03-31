import type { ExternalToast } from 'sonner'
import { toast as sonnerToast } from 'sonner'
import { ErrorTeapotToastIcon } from '@/components/feedback/ErrorTeapot'

const sonnerError = sonnerToast.error.bind(sonnerToast)

function error(message: React.ReactNode, data?: ExternalToast) {
  return sonnerError(message, {
    ...data,
    icon: data?.icon !== undefined ? data.icon : <ErrorTeapotToastIcon />,
  })
}

export const toast = {
  success: sonnerToast.success,
  error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
  message: sonnerToast.message,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
  promise: sonnerToast.promise,
}
