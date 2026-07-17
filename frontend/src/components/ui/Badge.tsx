import React from "react"

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  default: "bg-surface-100 text-surface-700",
  success: "bg-success-50 text-success-500",
  warning: "bg-warning-50 text-warning-500",
  danger: "bg-danger-50 text-danger-500",
  info: "bg-info-50 text-info-500",
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
