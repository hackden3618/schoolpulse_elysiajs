import { useState } from "react"
import { Shield, Eye } from "lucide-react"
import { useAuth } from "../../lib/auth-context"

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
        <h3 className="mb-1 text-lg font-bold text-surface-900">Your Roles</h3>
        <p className="mb-6 text-sm text-surface-500">
          Select a role to filter what you see. Your access is the same regardless — this only changes the view.
        </p>
        
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
                {role.name === "Guardian" ? <Eye size={14} /> : <Shield size={14} />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${selected === role.id ? "text-accent-700" : "text-primary-900"}`}>
                  {role.name === "Guardian" ? "Parent / Guardian" : role.name}
                </p>
                {role.description && <p className="text-xs text-primary-400">{role.description}</p>}
              </div>
              {selected === role.id && (
                <span className="text-[10px] text-accent font-semibold">Active</span>
              )}
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
            Switch View
          </button>
        </div>
      </div>
    </div>
  )
}
