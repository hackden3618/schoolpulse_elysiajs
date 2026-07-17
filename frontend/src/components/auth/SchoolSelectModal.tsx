import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Eye, Users, Shield, Check, Loader2 } from "lucide-react"
import { Modal } from "../ui/Modal"
import { useAuth } from "../../lib/auth-context"
import type { Membership, School, Role } from "../../types"

interface SchoolSelectModalProps {
  open: boolean
  memberships: Membership[]
  schools: School[]
}

function roleName(r: any): string {
  if (!r) return "Member"
  return typeof r.role === "string" ? r.role : (r.role?.name || "Member")
}

function roleIcon(name: string) {
  if (name === "Guardian") return <Eye size={14} />
  if (name === "Teacher") return <Users size={14} />
  return <Shield size={14} />
}

export function SchoolSelectModal({ open, memberships, schools }: SchoolSelectModalProps) {
  const navigate = useNavigate()
  const { switchSchool, switchRole, activeRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"school" | "role">("school")
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const membershipForSchool = (schoolId: string) =>
    memberships.find((m) => m.schoolId === schoolId) || null

  const rolesForSchool = (schoolId: string): Role[] => {
    const m = membershipForSchool(schoolId)
    if (!m) return []
    return (m.roles || []).map((r) => ({
      id: (r.role?.id || roleName(r)) as string,
      name: roleName(r),
      description: r.role?.description,
      permissions: r.role?.permissions || [],
      createdAt: "",
    })) as Role[]
  }

  const beginSchoolSelect = (schoolId: string, membershipId: string) => {
    const roles = rolesForSchool(schoolId)
    setSelectedSchoolId(schoolId)
    setSelectedMembershipId(membershipId)
    if (roles.length > 1) {
      // Multi-role within this school: let the user pick the active role.
      const current = activeRole && roles.some((r) => r.id === activeRole.id)
        ? (roles.find((r) => r.id === activeRole.id) as Role)
        : (roles[0] ?? null)
      setSelectedRole(current)
      setStep("role")
    } else {
      // Single role: switch context (re-issue token) and go straight in.
      complete(membershipId, roles[0] ?? null)
    }
  }

  const complete = async (membershipId: string, role: Role | null) => {
    if (loading || !role) return
    setLoading(true)
    try {
      switchSchool(membershipId)
      switchRole(role)
      navigate("/dashboard", { replace: true })
    } catch {
      setLoading(false)
    }
  }

  const handleRoleConfirm = () => {
    if (!selectedMembershipId) return
    complete(selectedMembershipId, selectedRole)
  }

  const reset = () => {
    setStep("school")
    setSelectedSchoolId(null)
    setSelectedMembershipId(null)
    setSelectedRole(null)
    setLoading(false)
  }

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title={step === "role" ? "Select Your Role" : "Select School"}
      description={
        step === "role"
          ? "You have more than one role in this school. Choose the role you want to use."
          : "You have access to multiple schools. Choose one to continue."
      }
      size="sm"
      showClose={false}
      closeOnOverlay={false}
    >
      {step === "school" ? (
        <div className="space-y-2 pt-1">
          {schools.map((school) => {
            const membership = membershipForSchool(school.id)
            const isSelected = selectedSchoolId === membership?.id
            return (
              <button
                key={school.id}
                onClick={() => membership?.id && beginSchoolSelect(school.id, membership.id)}
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
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 text-sm text-primary-600">
            <Building2 size={16} className="text-accent" />
            <span className="truncate font-medium">
              {schools.find((s) => s.id === selectedSchoolId)?.schoolName}
            </span>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {rolesForSchool(selectedSchoolId!).map((role) => {
              const isSelected = selectedRole?.id === role.id
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-accent bg-accent-50 ring-1 ring-accent"
                      : "border-surface-200 bg-white hover:border-surface-300"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isSelected ? "bg-accent text-white" : "bg-surface-100 text-surface-500"
                  }`}>
                    {roleIcon(role.name)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isSelected ? "text-accent-700" : "text-primary-900"}`}>
                      {role.name === "Guardian" ? "Parent / Guardian" : role.name}
                    </p>
                    {role.description && (
                      <p className="text-xs text-primary-400">{role.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] text-accent font-semibold">
                      <Check size={12} /> Active
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={reset}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleRoleConfirm}
              disabled={loading || !selectedRole || !selectedMembershipId}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Continue
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
