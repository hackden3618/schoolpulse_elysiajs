import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Logo } from "../../components/ui/Logo"
import {
  ChevronLeft,
  ChevronDown,
  School,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { navigation } from "../../lib/constants"
import { useAuth } from "../../lib/auth-context"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, school, logout } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(navigation.map((g) => g.label))
  )

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/"
    }
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  const initials = user
    ? `${user.firstName[0]}${(user.lastName || "")[0] || ""}`
    : "?"

  return (
    <aside
      className={`flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-200 shrink-0 ${
        collapsed ? "w-[80px]" : "w-[260px]"
      }`}
    >
      <div className="flex h-[72px] items-center gap-3 px-5 border-b border-white/5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-inner relative overflow-hidden">
          <Logo size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="block font-bold text-white text-base tracking-tight leading-tight">
              SchoolPulse
            </span>
            <span className="block text-[10px] text-primary-400 font-semibold uppercase tracking-wider mt-0.5">
              by AstraTech
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-5">
        {navigation.map((group) => {
          const isExpanded = expandedGroups.has(group.label)

          return (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-3.5 py-1 text-[10px] font-bold text-primary-500 uppercase tracking-wider hover:text-primary-300 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={10}
                    className={`transition-transform duration-150 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>
              )}
              {(isExpanded || collapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon

                    return (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-150 font-medium ${
                          active
                            ? "bg-accent text-white shadow-md shadow-accent/15"
                            : "text-sidebar-text hover:bg-white/5 hover:text-sidebar-hover-text"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          size={18}
                          className={`shrink-0 ${
                            active ? "text-white" : "text-primary-400"
                          }`}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge && (
                              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                                active ? "bg-white/20 text-white" : "bg-white/10 text-primary-300"
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* School Selector */}
      <div className="px-3 py-3 border-t border-white/5">
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-primary-400 hover:bg-white/5 hover:text-white transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <School size={16} className="shrink-0 text-accent" />
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-white truncate text-xs">
                {school?.schoolName || "School"}
              </p>
              <p className="text-[10px] text-primary-500 font-semibold mt-0.5">&nbsp;</p>
            </div>
          )}
          {!collapsed && <ChevronDown size={12} className="shrink-0 text-primary-500" />}
        </button>
      </div>

      {/* User Summary Footer */}
      <div className="px-3.5 py-4 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-primary-800 border border-white/10 overflow-hidden flex items-center justify-center">
            <span className="text-accent font-bold text-xs">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user ? `${user.firstName} ${user.lastName || ""}` : ""}
              </p>
              <p className="text-[10px] text-primary-400 font-medium mt-0.5">&nbsp;</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="text-primary-500 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="px-3 py-2 border-t border-white/5">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-500 hover:bg-surface-50 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
