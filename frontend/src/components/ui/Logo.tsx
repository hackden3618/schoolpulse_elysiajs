import React from "react"

interface LogoProps {
  size?: number | string
  className?: string
}

export function Logo({ size = 24, className = "" }: LogoProps) {
  const s = typeof size === "number" ? size : 24

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Shield Body */}
      <path
        d="M12 2C12 2 4 6 4 11V15C4 18.5 7 21 12 22C17 21 20 18.5 20 15V11C20 6 12 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Inner Circuitry - Shield-shaped inner cutout */}
      <path
        d="M12 5L7 8V12C7 14.5 9 16.5 12 17C15 16.5 17 14.5 17 12V8L12 5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      
      {/* Circuit Nodes & Lines */}
      <path
        d="M12 5V8M8 9H12M12 9H16M12 12V15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="5" r="0.8" fill="currentColor" />
      <circle cx="8" cy="9" r="0.8" fill="currentColor" />
      <circle cx="16" cy="9" r="0.8" fill="currentColor" />
      <circle cx="12" cy="15" r="0.8" fill="currentColor" />
    </svg>
  )
}
