import { useState } from "react"
import { Shield, Eye, Users, Loader2, Check } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import type { Membership, Role } from "../../types"

interface RoleSwitcherModalProps {
  onClose: () => void
}

function roleIcon(name: string) {
  if (name === "Guardian") return <Eye size={14} />
  if (name === "Teacher") return <Users size={14} />
  return <Shield size={14} />
}

function roleNameOf(r: any): string {
  if (!r) return "Member"
  return typeof r.role === "string" ? r.role : (r.role?.name || "Member")
}

interface Option {
  membershipId: string
  role: Role
  schoolName: string
  isCurrentContext: boolean
  isCurrentView: boolean
}

export function RoleSwitcherModal({ onClose }: RoleSwitcherModalProps) {
  const { allMemberships, membership: activeMembership, school, switchContext, switchRole, activeRole } = useAuth()
  const memberships: Membership[] = allMemberships?.length ? allMemberships : (activeMembership ? [activeMembership] : [])

  // Flatten to (membership, role) pairs.
  const options: Option[] = []
  for (const m of memberships) {
    const roles = (m.roles || []).map((r) => ({
      id: r.role?.id || roleNameOf(r),
      name: roleNameOf(r),
      description: r.role?.description,
      permissions: r.role?.permissions || [],
      createdAt: "",
    })) as Role[]
    const schoolName = m.schoolId === school?.id ? (school?.schoolName || "School") : "School"
    const isCurrentContext = m.id === activeMembership?.id
    for (const role of roles) {
      options.push({
        membershipId: m.id,
        role,
        schoolName,
        isCurrentContext,
        isCurrentView: isCurrentContext && role.id === activeRole?.id,
      })
    }
  }

  const [selected, setSelected] = useState<Option | null>(
    options.find((o) => o.isCurrentView) || options.find((o) => o.isCurrentContext) || null
  )
  const [busy, setBusy] = useState(false)

  const handleSwitch = async () => {
    if (!selected) return
    // Already the active view + context: nothing to do.
    if (selected.isCurrentView) {
      onClose()
      return
    }
    setBusy(true)
    try {
      if (!selected.isCurrentContext) {
        // Different membership → re-issue the session as a single action with
        // the chosen role already assumed in that school's context.
        await switchContext(selected.membershipId, selected.role.name)
      } else {
        // Same school context → just assume the chosen role.
        await switchRole(selected.role)
      }
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-lg font-bold text-surface-900">Switch Role & Context</h3>
        <p className="mb-6 text-sm text-surface-500">
          You have multiple roles. Pick the role you want to use. Switching to a
          different school context re-issues your session with those permissions.
        </p>

        <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selected?.membershipId === opt.membershipId && selected?.role.id === opt.role.id
            return (
              <button
                key={`${opt.membershipId}:${opt.role.id}`}
                onClick={() => setSelected(opt)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-accent bg-accent-50 ring-1 ring-accent"
                    : "border-surface-200 bg-white hover:border-surface-300"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isSelected ? "bg-accent text-white" : "bg-surface-100 text-surface-500"
                }`}>
                  {roleIcon(opt.role.name)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-accent-700" : "text-primary-900"}`}>
                    {opt.role.name === "Guardian" ? "Parent / Guardian" : opt.role.name}
                  </p>
                  <p className="text-xs text-primary-400">
                    {opt.schoolName}
                    {opt.isCurrentContext ? " · current context" : ""}
                  </p>
                </div>
                {opt.isCurrentView && (
                  <span className="flex items-center gap-1 text-[10px] text-accent font-semibold">
                    <Check size={12} /> Active
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwitch}
            disabled={busy || !selected || selected.isCurrentView}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Switch
          </button>
        </div>
      </div>
    </div>
  )
}
