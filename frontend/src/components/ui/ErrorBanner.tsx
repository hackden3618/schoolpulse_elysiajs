import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="rounded-full bg-danger-50 p-4 text-danger-500 mb-4">
        <AlertCircle size={28} />
      </div>
      <p className="text-base font-semibold text-surface-900 mb-1">Something went wrong</p>
      <p className="text-sm text-surface-500 mb-5 text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  )
}
