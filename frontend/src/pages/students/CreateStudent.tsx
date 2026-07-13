import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, UserPlus, Heart, Stethoscope, Plus, Trash2, Check, AlertCircle } from "lucide-react"
import { studentsApi, academicApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { withMinDelay } from "../../lib/ux"
import type { ClassInstance } from "../../types"

const RELATIONSHIP_OPTIONS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "legal_guardian", label: "Legal Guardian" },
  { value: "sibling", label: "Sibling" },
  { value: "step_parent", label: "Step Parent" },
  { value: "relative", label: "Relative" },
  { value: "sponsor", label: "Sponsor" },
  { value: "emergency", label: "Emergency Contact" },
  { value: "other", label: "Other" },
]

const SPECIAL_NEED_CATEGORIES = [
  "Medical Condition",
  "Dietary Restriction",
  "Physical Disability",
  "Learning Support",
  "Allergy",
  "Medication",
  "Other",
] as const

interface SpecialNeedEntry { category: string; details: string }
interface GuardianEntry { firstName: string; lastName: string; phone: string; email: string; relationship: string }

export function CreateStudent() {
  const navigate = useNavigate()
  const { school } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [classInstances, setClassInstances] = useState<ClassInstance[]>([])

  // Learner fields
  const [firstName, setFirstName] = useState("")
  const [secondName, setSecondName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [classInstanceId, setClassInstanceId] = useState("")

  // Special needs
  const [specialNeeds, setSpecialNeeds] = useState<SpecialNeedEntry[]>([])

  // Guardians
  const [guardians, setGuardians] = useState<GuardianEntry[]>([
    { firstName: "", lastName: "", phone: "", email: "", relationship: "legal_guardian" }
  ])

  useEffect(() => {
    if (!school) return
    withMinDelay(academicApi.classInstances.list(school.id))
      .then(r => setClassInstances(r.data))
      .catch(() => {})
  }, [school])

  const addSpecialNeed = () => setSpecialNeeds(prev => [...prev, { category: SPECIAL_NEED_CATEGORIES[0], details: "" }])
  const removeSpecialNeed = (idx: number) => setSpecialNeeds(prev => prev.filter((_, i) => i !== idx))
  const updateSpecialNeed = (idx: number, field: "category" | "details", value: string) => 
    setSpecialNeeds(prev => prev.map((n, i) => i === idx ? { ...n, [field]: value } : n))

  const addGuardian = () => setGuardians(prev => [...prev, { firstName: "", lastName: "", phone: "", email: "", relationship: "legal_guardian" }])
  const removeGuardian = (idx: number) => setGuardians(prev => prev.filter((_, i) => i !== idx))
  const updateGuardian = (idx: number, field: keyof GuardianEntry, value: string) =>
    setGuardians(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g))

  const buildSpecialNeedsJson = () => {
    const obj: Record<string, string> = {}
    specialNeeds.forEach(({ category, details }) => {
      if (details.trim()) obj[category] = details.trim()
    })
    return obj
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName || !lastName || !dateOfBirth || !admissionNumber) {
      setError("First name, last name, date of birth, and admission number are required.")
      return
    }

    const invalidGuardian = guardians.find(g => !g.firstName || !g.lastName || !g.phone)
    if (invalidGuardian) {
      setError("All guardians must have a first name, last name, and phone number.")
      return
    }

    setLoading(true)
    try {
      await withMinDelay(
        studentsApi.create(school!.id, {
          firstName,
          secondName: secondName || undefined,
          lastName,
          dateOfBirth,
          admissionNumber,
          gender: gender || undefined,
          classInstanceId: classInstanceId || undefined,
          specialNeeds: Object.keys(buildSpecialNeedsJson()).length ? buildSpecialNeedsJson() : undefined,
          guardians: guardians.map(g => ({
            ...g,
            email: g.email || undefined,
          })),
        })
      )
      setSuccess(true)
      setTimeout(() => navigate("/students"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to admit student.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
          <Check size={32} />
        </div>
        <h2 className="text-xl font-semibold text-surface-900">Student Admitted!</h2>
        <p className="text-sm text-surface-500">Redirecting to students list…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admit Student"
        description="Register a new learner and link guardians."
        actions={
          <Button variant="secondary" onClick={() => navigate("/students")}>
            <ArrowLeft size={16} /> Back to Students
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner message={error} />}

        {/* SECTION 1: Learner Details */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={18} className="text-primary-500" />
              <h3 className="text-base font-semibold text-surface-900">Learner Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Aisha" />
              <Input label="Middle Name" value={secondName} onChange={e => setSecondName(e.target.value)} placeholder="Optional" />
              <Input label="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Wanjiku" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Admission Number *" value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)} placeholder="e.g. ADM/2024/001" />
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {classInstances.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Enroll in Class (Optional)</label>
                <select
                  value={classInstanceId}
                  onChange={e => setClassInstanceId(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">— Skip enrollment for now —</option>
                  {classInstances.map(ci => (
                    <option key={ci.id} value={ci.id}>
                      {ci.class?.name} — {ci.streamName} ({ci.academicYear?.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: Special Needs */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={18} className="text-warning-500" />
                <h3 className="text-base font-semibold text-surface-900">Special Needs</h3>
                <span className="text-xs text-surface-400 ml-1">(Optional)</span>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={addSpecialNeed}>
                <Plus size={14} /> Add Need
              </Button>
            </div>

            {specialNeeds.length === 0 ? (
              <p className="text-sm text-surface-400 py-2">
                No special needs recorded. Click "Add Need" to document medical conditions, dietary restrictions, or other requirements.
              </p>
            ) : (
              <div className="space-y-3">
                {specialNeeds.map((need, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-surface-50 border border-surface-100">
                    <select
                      value={need.category}
                      onChange={e => updateSpecialNeed(idx, "category", e.target.value)}
                      className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 w-48 shrink-0"
                    >
                      {SPECIAL_NEED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea
                      value={need.details}
                      onChange={e => updateSpecialNeed(idx, "details", e.target.value)}
                      placeholder="Describe the condition, restriction, or requirement..."
                      rows={2}
                      className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder-surface-400 resize-none focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button type="button" onClick={() => removeSpecialNeed(idx)} className="p-2 text-surface-400 hover:text-danger-500 transition-colors mt-0.5">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: Guardians */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-rose-500" />
                <h3 className="text-base font-semibold text-surface-900">Guardians</h3>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={addGuardian}>
                <Plus size={14} /> Add Guardian
              </Button>
            </div>
            
            <p className="text-xs text-surface-400 -mt-3">
              The first guardian added will be marked as the primary guardian. If a guardian's phone number is already registered, their account will be linked automatically.
            </p>

            <div className="space-y-6">
              {guardians.map((g, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-surface-200 bg-surface-50 relative">
                  {idx > 0 && (
                    <button 
                      type="button" 
                      onClick={() => removeGuardian(idx)}
                      className="absolute top-4 right-4 p-1.5 text-surface-400 hover:text-danger-500 hover:bg-danger-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <h4 className="text-sm font-semibold text-surface-700 mb-4">{idx === 0 ? "Primary Guardian" : `Additional Guardian ${idx}`}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input label="First Name *" value={g.firstName} onChange={e => updateGuardian(idx, "firstName", e.target.value)} placeholder="e.g. John" />
                    <Input label="Last Name *" value={g.lastName} onChange={e => updateGuardian(idx, "lastName", e.target.value)} placeholder="e.g. Kamau" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Phone Number *" value={g.phone} onChange={e => updateGuardian(idx, "phone", e.target.value)} placeholder="e.g. 0712345678" />
                    <Input label="Email Address" type="email" value={g.email} onChange={e => updateGuardian(idx, "email", e.target.value)} placeholder="Optional" />
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Relationship *</label>
                      <select
                        value={g.relationship}
                        onChange={e => updateGuardian(idx, "relationship", e.target.value)}
                        className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {RELATIONSHIP_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="secondary" onClick={() => navigate("/students")} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Admit Student
          </Button>
        </div>
      </form>
    </div>
  )
}

