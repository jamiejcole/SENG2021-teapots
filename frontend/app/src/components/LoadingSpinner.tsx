import { Loader } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}
