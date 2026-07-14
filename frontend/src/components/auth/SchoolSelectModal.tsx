import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2 } from "lucide-react"
import { Modal } from "../ui/Modal"
import { useAuth } from "../../lib/auth-context"
import type { Membership, School } from "../../types"

interface SchoolSelectModalProps {
  open: boolean
  memberships: Membership[]
  schools: School[]
}

export function SchoolSelectModal({ open, memberships, schools }: SchoolSelectModalProps) {
  const navigate = useNavigate()
  const { switchSchool } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = async (membershipId: string) => {
    if (loading) return
    setLoading(true)
    setSelectedId(membershipId)
    try {
      await switchSchool(membershipId)
      navigate("/dashboard", { replace: true, state: { promptRoleSwitch: true } })
    } catch {
      setLoading(false)
      setSelectedId(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title="Select School"
      description="You have access to multiple schools. Choose one to continue."
      size="sm"
      showClose={false}
      closeOnOverlay={false}
    >
      <div className="space-y-2 pt-1">
        {schools.map((school, i) => {
          const membership = memberships[i]
          const isSelected = selectedId === membership?.id
          return (
            <button
              key={school.id}
              onClick={() => membership?.id && handleSelect(membership.id)}
              disabled={loading}
              className={`w-full flex items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-all ${
                isSelected && loading
                  ? "border-accent bg-accent/5"
                  : "border-surface-200 hover:border-accent/40 hover:bg-accent/5"
              } disabled:opacity-60 disabled:cursor-wait`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Building2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-900 truncate">
                  {school.schoolName}
                </p>
                <p className="text-xs text-primary-500 truncate">
                  {school.town || school.county || school.country || "School"}
                </p>
              </div>
              {isSelected && loading && (
                <svg className="h-5 w-5 animate-spin text-accent shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {!isSelected && !loading && (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-surface-300" />
              )}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
