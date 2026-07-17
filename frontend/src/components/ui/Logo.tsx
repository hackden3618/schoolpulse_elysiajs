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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield Outer Path */}
      <path
        d="M 23 24 Q 50 29 77 24 L 77 52 Q 77 74 50 86 Q 23 74 23 52 Z"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Circuit Middle Node and Line */}
      <circle
        cx="50"
        cy="35"
        r="4.5"
        stroke="currentColor"
        strokeWidth="4.5"
      />
      <path
        d="M 50 39.5 L 50 81"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Circuit Left Node and Line */}
      <circle
        cx="37"
        cy="45"
        r="4.5"
        stroke="currentColor"
        strokeWidth="4.5"
      />
      <path
        d="M 37 49.5 L 37 57 L 43.5 64.5 L 43.5 81"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Circuit Right Node and Line */}
      <circle
        cx="63"
        cy="45"
        r="4.5"
        stroke="currentColor"
        strokeWidth="4.5"
      />
      <path
        d="M 63 49.5 L 63 57 L 56.5 64.5 L 56.5 81"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
