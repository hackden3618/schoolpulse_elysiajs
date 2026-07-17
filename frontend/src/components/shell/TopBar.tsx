import { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Search,
  Bell,
  Mail,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Settings,
  Repeat,
} from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { RoleSwitcherModal } from "./RoleSwitcherModal"

function countRoles(allMemberships: any[]): number {
  const seen = new Set<string>()
  for (const m of allMemberships || []) {
    for (const r of (m.roles || [])) {
      const id = r.role?.id || (typeof r.role === "string" ? r.role : r.role?.name)
      if (id) seen.add(id)
    }
  }
  return seen.size
}

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, school, allSchools, activeRole, logout, allMemberships } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const canSwitchRole = countRoles(allMemberships) > 1
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toLowerCase()
    if (/^\d+$/.test(q)) {
      navigate(`/students?admission=${q}`)
    } else {
      navigate(`/students?search=${encodeURIComponent(q)}`)
    }
    setSearchQuery("")
  }

  const breadcrumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => ({
      label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + segment,
    }))

  const initials = user
    ? `${user.firstName[0]}${(user.lastName || "")[0] || ""}`
    : "DO"

  return (
    <header className="flex h-16 sm:h-[72px] items-center gap-3 sm:gap-6 border-b border-primary-200 bg-white px-4 sm:px-8 shrink-0 shadow-sm">
      <button
        onClick={onMenuClick}
        className="text-primary-500 hover:text-primary-800 transition-colors p-1"
      >
        <Menu size={20} />
      </button>

      <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold min-w-0">
        <span className="text-primary-400 truncate">{school?.schoolName || "School"}</span>
        {allSchools.length > 1 && school && (
          <span className="text-[10px] text-accent font-medium ml-0.5 px-1.5 py-0.5 rounded bg-accent/10">
            {allSchools.indexOf(school) + 1}/{allSchools.length}
          </span>
        )}
        {breadcrumbs.length > 0 && <span className="text-primary-300 text-xs shrink-0">/</span>}
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2 min-w-0">
            {i > 0 && <span className="text-primary-300 text-xs shrink-0">/</span>}
            <span
              className={
                i === breadcrumbs.length - 1 ? "text-primary-900 truncate" : "text-primary-500 truncate"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <form onSubmit={handleSearch} className="relative hidden md:block w-[380px]">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"
        />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students, admissions, classes, staff..."
          className="w-full rounded-full border border-primary-200 bg-primary-50/50 pl-10 pr-12 py-2 text-xs text-primary-900 placeholder-primary-400 focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
        />
        <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-primary-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-primary-400 uppercase">
          ⌘K
        </kbd>
      </form>

      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate("/communication")}
          className="relative rounded-full p-2 text-primary-500 hover:bg-primary-50 hover:text-primary-800 transition-all"
        >
          <Bell size={18} />
        </button>

        <button
          onClick={() => navigate("/communication")}
          className="relative rounded-full p-2 text-primary-500 hover:bg-primary-50 hover:text-primary-800 transition-all"
        >
          <Mail size={18} />
        </button>

        {canSwitchRole && (
          <button
            onClick={() => setShowRoleSwitcher(true)}
            title="Switch role"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 hover:text-accent-700 transition-all"
          >
            <Repeat size={14} />
            <span className="hidden sm:inline">
              {activeRole?.name === "Guardian" ? "Parent / Guardian" : (activeRole?.name || "Role")}
            </span>
          </button>
        )}

        <div className="h-6 w-px bg-primary-200" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-primary-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 border border-accent-200 text-accent-700 font-bold text-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-primary-900 leading-tight">
                {user ? `${user.firstName} ${user.lastName || ""}` : ""}
              </p>
              <p className="text-[10px] text-primary-400 font-semibold uppercase mt-0.5">
                {activeRole?.name === "Guardian" ? "Parent / Guardian" : (activeRole?.name || "")}
              </p>
            </div>
            <ChevronDown size={12} className="text-primary-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-primary-100 bg-white shadow-lg py-1 z-50">
              <div className="px-4 py-2.5 border-b border-primary-50">
                <p className="text-sm font-semibold text-primary-900">
                  {user ? `${user.firstName} ${user.lastName || ""}` : ""}
                </p>
                <p className="text-xs text-primary-400">{user?.phone || ""}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate("/settings") }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <Settings size={16} className="text-primary-400" />
                Settings
              </button>
              <button
                onClick={() => { setDropdownOpen(false); navigate("/profile") }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <User size={16} className="text-primary-400" />
                Profile
              </button>
              <div className="border-t border-primary-50 mt-1 pt-1">
                <button
                  onClick={() => { setDropdownOpen(false); logout() }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRoleSwitcher && (
        <RoleSwitcherModal onClose={() => setShowRoleSwitcher(false)} />
      )}
    </header>
  )
}
