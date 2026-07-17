import React from "react"

type Variant = "primary" | "secondary" | "danger" | "ghost"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  success?: boolean
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500",
  secondary: "bg-white text-surface-700 border border-surface-300 hover:bg-surface-50 focus-visible:ring-primary-500",
  danger: "bg-danger-500 text-white hover:bg-danger-600 focus-visible:ring-danger-500",
  ghost: "text-surface-600 hover:bg-surface-100 focus-visible:ring-surface-400",
}

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
}

const successClass = "bg-green-500 text-white border-green-500 hover:bg-green-600 focus-visible:ring-green-500"

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  success = false,
  disabled,
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isSuccess = success && !loading
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variantStyle = isSuccess ? successClass : variantClass[variant]
  const width = fullWidth ? "w-full" : ""

  return (
    <button
      className={`${base} ${variantStyle} ${sizeClass[size]} ${width} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-live={isSuccess ? "polite" : undefined}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {isSuccess && !loading && (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.97 3.97 7.473-9.819a.75.75 0 011.052-.143z" clipRule="evenodd" />
        </svg>
      )}
      {children}
    </button>
  )
}

