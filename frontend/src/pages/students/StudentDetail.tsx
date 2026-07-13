import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Mail, Phone, User, AlertCircle, CalendarDays,
  Trash2, Plus, CreditCard, Stethoscope, X, Save,
} from "lucide-react"
import { studentsApi, financeApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { CardSkeleton } from "../../components/ui/Skeleton"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { MpesaPaymentModal } from "../../components/finance/MpesaPaymentModal"
import { BulkMpesaPaymentModal } from "../../components/finance/BulkMpesaPaymentModal"
import { EnrollStudentModal } from "./EnrollStudentModal"
import { EditEnrollmentModal } from "./EditEnrollmentModal"
import { withMinDelay } from "../../lib/ux"
import type { Student, Invoice } from "../../types"

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

const ARCHIVE_REASONS = [
  { value: "graduated", label: "Graduated" },
  { value: "dropped_out", label: "Dropped Out" },
  { value: "expelled", label: "Expelled" },
  { value: "transferred", label: "Transferred" },
  { value: "deceased", label: "Deceased" },
  { value: "other", label: "Other" },
]

// ─── Inline Modal Shell ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold text-surface-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ student, schoolId, onClose, onSaved }: {
  student: Student; schoolId: string; onClose: () => void; onSaved: () => void
}) {
  const [firstName, setFirstName] = useState(student.firstName)
  const [secondName, setSecondName] = useState(student.secondName || "")
  const [lastName, setLastName] = useState(student.lastName)
  const [gender, setGender] = useState<string>(student.gender || "")
  const [dateOfBirth, setDateOfBirth] = useState(
    student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!firstName || !lastName) { setError("First and last name are required."); return }
    setError(""); setLoading(true)
    try {
      await withMinDelay(studentsApi.update(schoolId, student.id, {
        firstName, secondName: secondName || undefined, lastName,
        gender: (gender as "male" | "female") || undefined,
        dateOfBirth: dateOfBirth || undefined,
      }))
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.")
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Edit Student Profile" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <Input label="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <Input label="Middle Name" value={secondName} onChange={e => setSecondName(e.target.value)} placeholder="Optional" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}><Save size={14} className="mr-1" /> Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Archive Modal ────────────────────────────────────────────────────────────
function ArchiveModal({ student, schoolId, onClose, onArchived }: {
  student: Student; schoolId: string; onClose: () => void; onArchived: () => void
}) {
  const navigate = useNavigate()
  const [reason, setReason] = useState("graduated")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleArchive = async () => {
    setError(""); setLoading(true)
    try {
      await withMinDelay(studentsApi.archive(schoolId, student.id, { reason, details: details || undefined }))
      onArchived()
      navigate("/students")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive student.")
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Archive Student" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-4 mt-2">
        <p className="text-sm text-surface-600">
          Archiving <span className="font-semibold text-surface-900">{student.firstName} {student.lastName}</span> will mark them as inactive.
          This action is recorded in the audit log.
        </p>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Reason *</label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
            {ARCHIVE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Additional Details</label>
          <textarea value={details} onChange={e => setDetails(e.target.value)}
            placeholder="Optional notes..."
            rows={3}
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 placeholder-surface-400 resize-none focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={handleArchive} loading={loading}>Archive Student</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Add Guardian Modal ───────────────────────────────────────────────────────
function AddGuardianModal({ student, schoolId, onClose, onAdded }: {
  student: Student; schoolId: string; onClose: () => void; onAdded: () => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [relationship, setRelationship] = useState("legal_guardian")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAdd = async () => {
    if (!firstName || !lastName || !phone) { setError("First name, last name, and phone are required."); return }
    setError(""); setLoading(true)
    try {
      await withMinDelay(studentsApi.addGuardianByDetails(schoolId, student.id, {
        firstName, lastName, phone, email: email || undefined, relationship,
      }))
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add guardian.")
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Add Guardian" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      <p className="text-xs text-surface-400 mb-4">
        If the phone number is already registered in the system, the existing account will be linked. Otherwise a new guardian account will be created.
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. John" />
          <Input label="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Kamau" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0712345678" />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Relationship</label>
          <select value={relationship} onChange={e => setRelationship(e.target.value)}
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
            {RELATIONSHIP_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAdd} loading={loading}><Plus size={14} className="mr-1" /> Add Guardian</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Unlink Guardian Modal ────────────────────────────────────────────────────
function UnlinkGuardianModal({ guardian, student, schoolId, onClose, onUnlinked }: {
  guardian: { guardianId: string; name: string };
  student: Student;
  schoolId: string;
  onClose: () => void;
  onUnlinked: () => void;
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleUnlink = async () => {
    setError("")
    setLoading(true)
    try {
      await withMinDelay(studentsApi.removeGuardian(schoolId, student.id, guardian.guardianId))
      onUnlinked()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink guardian.")
      setLoading(false)
    }
  }

  return (
    <Modal title="Remove Guardian" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      <p className="text-sm text-surface-600 mb-6">
        Are you sure you want to remove <span className="font-semibold text-surface-900">{guardian.name}</span> as a guardian
        of <span className="font-semibold text-surface-900">{student.firstName} {student.lastName}</span>? This only removes the
        link — the guardian's account will not be deleted.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={handleUnlink} loading={loading}>Remove Guardian</Button>
      </div>
    </Modal>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showAddGuardianModal, setShowAddGuardianModal] = useState(false)
  const [unlinkingGuardian, setUnlinkingGuardian] = useState<{ guardianId: string; name: string } | null>(null)

  const { school } = useAuth()

  const loadData = async () => {
    if (!id || !school) return
    setLoading(true)
    setError("")
    try {
      const [studentRes, invoicesRes] = await withMinDelay(Promise.all([
        studentsApi.get(school.id, id),
        financeApi.invoices.list(school.id, id).catch(() => ({ data: [] })),
      ]))
      setStudent(studentRes.data)
      setInvoices(invoicesRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load student")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <div className="lg:col-span-2"><CardSkeleton /></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Error" description="" actions={
          <Button variant="secondary" onClick={() => navigate("/students")}><ArrowLeft size={16} /> Back</Button>
        } />
        <Card><CardContent className="p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-danger-500 mb-3" />
          <p className="text-sm text-danger-700">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  if (!student) return null

  const currentEnrollment = student.currentEnrollment || student.enrollments?.[0]
  const specialNeeds = (student as any).specialNeeds || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`Admission No. ${student.admissionNumber}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/students")}>
              <ArrowLeft size={16} /> Back to Students
            </Button>
          </div>
        }
      />

      {actionError && <ErrorBanner message={actionError} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xl font-bold">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-surface-900">
                {student.firstName} {student.lastName}
              </h2>
              <Badge variant={student.status === "active" ? "success" : "default"} className="mt-1">{student.status}</Badge>
              <div className="mt-4 space-y-2 text-sm text-surface-500">
                <p>Class: <span className="text-surface-700 font-medium">{currentEnrollment?.classInstance?.class?.name || "—"} {currentEnrollment?.classInstance?.streamName || ""}</span></p>
                <p>Gender: <span className="text-surface-700 font-medium capitalize">{student.gender || "—"}</span></p>
                <p>DOB: <span className="text-surface-700 font-medium">{new Date(student.dateOfBirth).toLocaleDateString()}</span></p>
                <p>Admitted: <span className="text-surface-700 font-medium">{new Date(student.admissionDate).toLocaleDateString()}</span></p>
              </div>
              <div className="mt-6 flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Profile
                </Button>
                {student.status !== "archived" && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setShowArchiveModal(true)}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Special Needs */}
          {Object.keys(specialNeeds).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope size={18} className="text-warning-500" />
                  <h3 className="text-sm font-semibold text-surface-900">Special Needs</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {Object.entries(specialNeeds).map(([category, details]) => (
                    <div key={category} className="p-3 bg-warning-50 border border-warning-100 rounded-lg">
                      <p className="text-xs font-semibold text-warning-700">{category}</p>
                      <p className="text-sm text-warning-900 mt-1">{String(details)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Finance & Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900">Outstanding Invoices</h3>
                {invoices.filter(i => i.status !== "paid").length > 1 && (
                  <Button size="sm" onClick={() => setShowBulkModal(true)}>
                    <CreditCard size={14} className="mr-1" /> Pay All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.filter(i => i.status !== "paid").length === 0 ? (
                <div className="p-6 text-center text-sm text-surface-400">No outstanding invoices.</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {invoices.filter(i => i.status !== "paid").map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-surface-900">{inv.term?.name || "Invoice"}</p>
                          <Badge variant="warning">{inv.status}</Badge>
                        </div>
                        <p className="text-sm text-surface-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        <p className="text-sm font-medium mt-1">Outstanding: KES {Number(inv.outstanding ?? inv.totalAmount).toLocaleString()}</p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedInvoice(inv)}>
                        <CreditCard size={14} className="mr-1" /> Pay via M-Pesa
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guardians */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900">Guardians</h3>
                <Button size="sm" variant="secondary" onClick={() => setShowAddGuardianModal(true)}>
                  <Plus size={14} className="mr-1" /> Add Guardian
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(student.guardians?.length ?? 0) === 0 ? (
                <div className="p-6 text-center text-sm text-surface-400">No guardians linked.</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {student.guardians?.map((g) => (
                    <div key={g.id} className="flex items-center gap-4 px-6 py-4 group">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-surface-600">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900">
                          {g.guardian?.firstName} {g.guardian?.lastName || ""}
                          {g.isPrimary && <Badge variant="info" className="ml-2">Primary</Badge>}
                        </p>
                        <p className="text-xs text-surface-500 capitalize">{g.relationship?.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-surface-500">
                          <Phone size={14} />
                          <span className="text-sm">{g.guardian?.phone || "—"}</span>
                        </div>
                        <button
                          onClick={() => setUnlinkingGuardian({
                            guardianId: g.guardianId ?? g.id,
                            name: `${g.guardian?.firstName || ""} ${g.guardian?.lastName || ""}`.trim()
                          })}
                          className="p-1.5 text-surface-400 hover:text-danger-500 hover:bg-danger-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove guardian"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollment History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900">Enrollment History</h3>
                <Button size="sm" variant="secondary" onClick={() => setShowEnrollModal(true)}>
                  <Plus size={14} className="mr-1" /> Add Enrollment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(student.enrollments?.length || 0) === 0 ? (
                <div className="p-6 text-center text-sm text-surface-400">Not enrolled in any class.</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {student.enrollments?.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent">
                          <CalendarDays size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900">
                            {e.classInstance?.class?.name} — {e.classInstance?.streamName}
                          </p>
                          <p className="text-xs text-surface-400">{e.academicYear?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={e.status === "active" ? "success" : "default"}>{e.status}</Badge>
                        <Button size="sm" variant="secondary" onClick={() => setEditingEnrollment(e)}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && student && (
        <EditProfileModal
          student={student}
          schoolId={school!.id}
          onClose={() => setShowEditModal(false)}
          onSaved={async () => { setShowEditModal(false); await loadData() }}
        />
      )}

      {showArchiveModal && student && (
        <ArchiveModal
          student={student}
          schoolId={school!.id}
          onClose={() => setShowArchiveModal(false)}
          onArchived={() => setShowArchiveModal(false)}
        />
      )}

      {showAddGuardianModal && student && (
        <AddGuardianModal
          student={student}
          schoolId={school!.id}
          onClose={() => setShowAddGuardianModal(false)}
          onAdded={async () => { setShowAddGuardianModal(false); await loadData() }}
        />
      )}

      {selectedInvoice && (
        <MpesaPaymentModal
          invoice={selectedInvoice}
          studentName={`${student.firstName} ${student.lastName}`}
          guardianPhone={student.guardians?.find(g => g.isPrimary)?.guardian?.phone || student.guardians?.[0]?.guardian?.phone}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={loadData}
        />
      )}

      {showBulkModal && (
        <BulkMpesaPaymentModal
          invoices={invoices.filter(i => i.status !== "paid")}
          studentId={student.id}
          studentName={`${student.firstName} ${student.lastName}`}
          guardianPhone={student.guardians?.find(g => g.isPrimary)?.guardian?.phone || student.guardians?.[0]?.guardian?.phone}
          onClose={() => setShowBulkModal(false)}
          onSuccess={loadData}
        />
      )}

      {showEnrollModal && (
        <EnrollStudentModal
          schoolId={school!.id}
          studentId={student.id}
          onClose={() => setShowEnrollModal(false)}
          onSaved={async () => { setShowEnrollModal(false); await loadData() }}
        />
      )}

      {editingEnrollment && (
        <EditEnrollmentModal
          schoolId={school!.id}
          studentId={student.id}
          enrollment={editingEnrollment}
          onClose={() => setEditingEnrollment(null)}
          onSaved={async () => { setEditingEnrollment(null); await loadData() }}
        />
      )}

      {unlinkingGuardian && student && (
        <UnlinkGuardianModal
          guardian={unlinkingGuardian}
          student={student}
          schoolId={school!.id}
          onClose={() => setUnlinkingGuardian(null)}
          onUnlinked={async () => { setUnlinkingGuardian(null); await loadData() }}
        />
      )}
    </div>
  )
}
