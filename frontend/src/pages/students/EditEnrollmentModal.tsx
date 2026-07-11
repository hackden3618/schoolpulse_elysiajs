import { useState, useEffect } from "react"
import { Button } from "../../components/ui/Button"
import { academicApi, studentsApi } from "../../lib/api"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"

interface EditEnrollmentModalProps {
  schoolId: string
  studentId: string
  enrollment: any
  onClose: () => void
  onSaved: () => void
}

export function EditEnrollmentModal({
  schoolId,
  studentId,
  enrollment,
  onClose,
  onSaved,
}: EditEnrollmentModalProps) {
  const [classInstanceId, setClassInstanceId] = useState(enrollment.classInstanceId || "")
  const [status, setStatus] = useState(enrollment.status || "active")
  const [academicYearId, setAcademicYearId] = useState(enrollment.academicYearId || "")
  
  const [classInstances, setClassInstances] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      academicApi.classInstances.list(schoolId),
      academicApi.years.list(schoolId)
    ])
      .then(([ciRes, ayRes]) => {
        setClassInstances(ciRes.data)
        setAcademicYears(ayRes.data)
        setLoadingData(false)
      })
      .catch(err => {
        setError("Failed to load options.")
        setLoadingData(false)
      })
  }, [schoolId])

  const handleSave = async () => {
    setError("")
    setSaving(true)
    try {
      await withMinDelay(
        studentsApi.updateEnrollment(schoolId, studentId, enrollment.id, {
          classInstanceId,
          academicYearId,
          status: status as any,
        })
      )
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update enrollment")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-surface-900">Edit Enrollment</h3>
        
        {loadingData ? (
          <div className="py-8 text-center text-sm text-surface-500">Loading options...</div>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-sm font-medium text-danger-500">{error}</p>}
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-700">Academic Year</label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                required
                className="block w-full rounded-lg border border-primary-300 bg-white px-3 py-2.5 text-sm text-primary-900 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="" disabled>Select Academic Year</option>
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-700">Class</label>
              <select
                value={classInstanceId}
                onChange={(e) => setClassInstanceId(e.target.value)}
                required
                className="block w-full rounded-lg border border-primary-300 bg-white px-3 py-2.5 text-sm text-primary-900 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="" disabled>Select Class</option>
                {classInstances.map(ci => (
                  <option key={ci.id} value={ci.id}>
                    {ci.class?.name || "Class"} — {ci.streamName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="block w-full rounded-lg border border-primary-300 bg-white px-3 py-2.5 text-sm text-primary-900 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="transferred">Transferred</option>
                <option value="expelled">Expelled</option>
                <option value="on_leave">On Leave</option>
                <option value="medical_leave">Medical Leave</option>
                <option value="truant">Truant</option>
                <option value="dropped_out">Dropped Out</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !classInstanceId || !academicYearId}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
