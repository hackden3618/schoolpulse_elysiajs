import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-surface-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-surface-50 disabled:text-surface-500 ${error ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  )
}
