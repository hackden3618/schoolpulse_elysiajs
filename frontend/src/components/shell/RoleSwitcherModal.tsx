import { useState } from "react"
import { useAuth } from "../../lib/auth-context"
import { Shield } from "lucide-react"

interface RoleSwitcherModalProps {
  onClose: () => void
}

export function RoleSwitcherModal({ onClose }: RoleSwitcherModalProps) {
  const { activeRole, roles, switchRole } = useAuth()
  const [selected, setSelected] = useState(activeRole?.id)

  const handleSwitch = () => {
    const role = roles.find(r => r.id === selected)
    if (role) {
      switchRole(role)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-surface-900">Switch Role</h3>
        
        <div className="space-y-2 mb-6">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                selected === role.id
                  ? "border-accent bg-accent-50 ring-1 ring-accent"
                  : "border-surface-200 bg-white hover:border-surface-300"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                selected === role.id ? "bg-accent text-white" : "bg-surface-100 text-surface-500"
              }`}>
                <Shield size={14} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${selected === role.id ? "text-accent-700" : "text-primary-900"}`}>
                  {role.name === "guardian" ? "Parent / Guardian" : role.name}
                </p>
                {role.description && <p className="text-xs text-primary-400">{role.description}</p>}
              </div>
            </button>
          ))}
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
            disabled={!selected || selected === activeRole?.id}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
          >
            Switch Role
          </button>
        </div>
      </div>
    </div>
  )
}
