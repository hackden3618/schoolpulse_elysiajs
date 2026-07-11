import { useState, useEffect } from "react"
import { Button } from "../../components/ui/Button"
import { academicApi, studentsApi } from "../../lib/api"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"

interface EnrollStudentModalProps {
  schoolId: string
  studentId: string
  onClose: () => void
  onSaved: () => void
}

export function EnrollStudentModal({
  schoolId,
  studentId,
  onClose,
  onSaved,
}: EnrollStudentModalProps) {
  const [classInstanceId, setClassInstanceId] = useState("")
  const [academicYearId, setAcademicYearId] = useState("")
  const [termId, setTermId] = useState("")
  
  const [classInstances, setClassInstances] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
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

  // Load terms when academic year changes
  useEffect(() => {
    if (!academicYearId) {
      setTerms([])
      setTermId("")
      return
    }
    academicApi.terms.list(schoolId, academicYearId)
      .then(res => setTerms(res.data))
      .catch(() => setTerms([]))
  }, [schoolId, academicYearId])

  const handleSave = async () => {
    setError("")
    setSaving(true)
    try {
      await withMinDelay(
        studentsApi.enroll(schoolId, studentId, {
          classInstanceId,
          academicYearId,
          termId: termId || undefined,
        })
      )
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enroll student")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-surface-900">Enroll Student</h3>
        
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

            {terms.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-700">Term (Optional)</label>
                <select
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  className="block w-full rounded-lg border border-primary-300 bg-white px-3 py-2.5 text-sm text-primary-900 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Full Year / All Terms</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

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

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !classInstanceId || !academicYearId}>
                {saving ? "Saving..." : "Enroll"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
