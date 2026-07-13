import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Building2 } from "lucide-react"
import { useAuth } from "../../lib/auth-context"

export function SchoolSwitcher() {
  const { allSchools, allMemberships, school, switchSchool } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const currentName = school?.schoolName || "School"
  const multiSchool = allSchools.length > 1

  if (!multiSchool) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-primary-400">
        <Building2 size={16} className="shrink-0 text-accent" />
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-white truncate text-xs">{currentName}</p>
        </div>
      </div>
    )
  }

  const handleSelect = async (membershipId: string) => {
    setOpen(false)
    await switchSchool(membershipId)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-primary-400 hover:bg-white/5 hover:text-white transition-all"
      >
        <Building2 size={16} className="shrink-0 text-accent" />
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-white truncate text-xs">{currentName}</p>
        </div>
        <ChevronDown size={12} className="shrink-0 text-primary-500" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-white/10 bg-sidebar-bg shadow-xl py-1 z-50">
          {allSchools.map((s, i) => {
            const membership = allMemberships[i]
            const isActive = s.id === school?.id
            return (
              <button
                key={s.id}
                onClick={() => membership?.id && handleSelect(membership.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-primary-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Building2 size={14} className="shrink-0 text-accent/70" />
                <span className="flex-1 truncate font-medium">{s.schoolName}</span>
                {isActive && <Check size={12} className="text-accent shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
