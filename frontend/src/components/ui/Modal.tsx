import React, { useEffect, useCallback, useRef } from "react"
import { X } from "lucide-react"

type ModalSize = "sm" | "md" | "lg" | "xl"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: ModalSize
  closeOnOverlay?: boolean
  showClose?: boolean
}

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  showClose = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleKeyDown])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === overlayRef.current) onClose()
  }

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${sizeClass[size]} rounded-xl border border-surface-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className={`flex items-start gap-4 px-5 pt-5 ${!description && !children && !footer ? "pb-5" : "pb-3"}`}>
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-base font-bold text-primary-900 leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-primary-500 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children && (
          <div className="px-5 pb-5 max-h-[60vh] overflow-y-auto">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-surface-100 bg-surface-50 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  variant?: "danger" | "primary"
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "danger",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:pointer-events-none ${
              variant === "danger"
                ? "bg-danger-500 hover:bg-danger-600"
                : "bg-primary-500 hover:bg-primary-600"
            }`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </>
      }
    />
  )
}
