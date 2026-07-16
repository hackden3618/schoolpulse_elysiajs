import { useState } from "react"
import { Shield, Eye, Users, Loader2 } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import type { Membership } from "../../types"

interface RoleSwitcherModalProps {
  onClose: () => void
}

function roleIcon(name: string) {
  if (name === "Guardian") return <Eye size={14} />
  if (name === "Teacher") return <Users size={14} />
  return <Shield size={14} />
}

export function RoleSwitcherModal({ onClose }: RoleSwitcherModalProps) {
  const { allMemberships, membership: activeMembership, school, switchContext } = useAuth()
  const [selectedId, setSelectedId] = useState(activeMembership?.id)
  const [busy, setBusy] = useState(false)

  // Distinct memberships, each carrying its own roles/permissions.
  const memberships: Membership[] = allMemberships?.length ? allMemberships : (activeMembership ? [activeMembership] : [])

  const handleSwitch = async () => {
    if (!selectedId || selectedId === activeMembership?.id) {
      onClose()
      return
    }
    setBusy(true)
    try {
      await switchContext(selectedId)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-lg font-bold text-surface-900">Switch Context</h3>
        <p className="mb-6 text-sm text-surface-500">
          You have multiple roles across this school. Switch context to change
          which permissions and views are active.
        </p>

        <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
          {memberships.map((m) => {
            const isActive = m.id === activeMembership?.id
            const selected = m.id === selectedId
            const roleNames = (m.roles || []).map((r) => (typeof r.role === "string" ? r.role : r.role?.name) || "Member")
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  selected
                    ? "border-accent bg-accent-50 ring-1 ring-accent"
                    : "border-surface-200 bg-white hover:border-surface-300"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  selected ? "bg-accent text-white" : "bg-surface-100 text-surface-500"
                }`}>
                  {roleIcon(roleNames[0] || "Staff")}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${selected ? "text-accent-700" : "text-primary-900"}`}>
                    {roleNames.join(" · ") || "Member"}
                  </p>
                  <p className="text-xs text-primary-400">
                    {m.schoolId === school?.id ? school?.schoolName : "School"}
                    {isActive && " · current"}
                  </p>
                </div>
                {isActive && (
                  <span className="text-[10px] text-accent font-semibold">Active</span>
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
            disabled={busy || !selectedId || selectedId === activeMembership?.id}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Switch Context
          </button>
        </div>
      </div>
    </div>
  )
}
