import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

type ToastVariant = "success" | "error" | "info"

interface Toast {
  id: number
  variant: ToastVariant
  message: string
}

interface ToastContextType {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {},
})

// Module-level dispatcher so non-React code (and list-loaders) can surface
// errors without threading useToast through every callback.
let globalErrorReporter: ((message: string) => void) | null = null

export function notifyError(message: string): void {
  if (globalErrorReporter) globalErrorReporter(message)
  else console.error("[notifyError]", message)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, variant, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const success = useCallback((message: string) => push("success", message), [push])
  const error = useCallback((message: string) => push("error", message), [push])
  const info = useCallback((message: string) => push("info", message), [push])

  useEffect(() => {
    globalErrorReporter = error
    return () => {
      if (globalErrorReporter === error) globalErrorReporter = null
    }
  }, [error])

  const variantStyles: Record<ToastVariant, string> = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-surface-800 text-white",
  }

  const variantIcon: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 shrink-0" />,
    info: <Info className="w-5 h-5 shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg transition-all ${variantStyles[t.variant]}`}
          >
            {variantIcon[t.variant]}
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
