import React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl border border-primary-100/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),_0_1px_2px_rgba(15,23,42,0.015)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all duration-200 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`px-5 py-4 border-b border-primary-50/80 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-base font-semibold text-primary-900 ${className}`}>{children}</h3>
}
