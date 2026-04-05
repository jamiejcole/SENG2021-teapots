import type { ExternalToast } from 'sonner'
import { toast as sonnerToast } from 'sonner'
import { ErrorTeapotToastIcon, SuccessTeapotToastIcon } from '@/components/feedback/ErrorTeapot'

/** Original Sonner methods — must not call `sonnerToast.error` after `Object.assign` overwrites them. */
const sonnerError = sonnerToast.error.bind(sonnerToast)
const sonnerSuccess = sonnerToast.success.bind(sonnerToast)

function error(message: React.ReactNode, data?: ExternalToast) {
  return sonnerError(message, {
    ...data,
    icon: data?.icon !== undefined ? data.icon : <ErrorTeapotToastIcon />,
  })
}

function success(message: React.ReactNode, data?: ExternalToast) {
  return sonnerSuccess(message, {
    ...data,
    icon: data?.icon !== undefined ? data.icon : <SuccessTeapotToastIcon />,
  })
}

export const toast = Object.assign(sonnerToast, { error, success })
