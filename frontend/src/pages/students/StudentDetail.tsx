import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, Phone, User, AlertCircle, CalendarDays } from "lucide-react"
import { studentsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { CardSkeleton, Skeleton } from "../../components/ui/Skeleton"
import type { Student } from "../../types"

export function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { school } = useAuth()

  useEffect(() => {
    if (!id || !school) return
    setLoading(true)
    setError("")
    studentsApi.get(school.id, id)
      .then((res) => setStudent(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load student"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." description="" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Error" description="" actions={<Button variant="secondary" onClick={() => navigate("/students")}><ArrowLeft size={16} /> Back</Button>} />
        <Card><CardContent className="p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-danger-500 mb-3" />
          <p className="text-sm text-danger-700">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  if (!student) return null

  const currentEnrollment = student.currentEnrollment || student.enrollments?.[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`Admission No. ${student.admissionNumber}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/students")}>
              <ArrowLeft size={16} />
              Back to Students
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
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
              <Button size="sm" variant="secondary">Edit Profile</Button>
              <Button size="sm" variant="danger">Archive</Button>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guardian */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900">Guardians</h3>
                <Button size="sm" variant="secondary">Add Guardian</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {student.guardians?.length === 0 ? (
                <div className="p-6 text-center text-sm text-primary-400">No guardians linked.</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {student.guardians?.map((g) => (
                    <div key={g.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-surface-600">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900">
                          {g.guardian?.firstName} {g.guardian?.lastName || ""}
                        </p>
                        <p className="text-xs text-surface-500 capitalize">{g.relationship?.replace("_", " ")}</p>
                      </div>
                      <div className="flex items-center gap-3 text-surface-400">
                        <Phone size={14} />
                        <span className="text-sm text-surface-600">{g.guardian?.phone || "—"}</span>
                      </div>
                      {g.isPrimary && <Badge variant="info">Primary</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollment History */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-surface-900">Enrollment</h3>
            </CardHeader>
            <CardContent className="p-0">
              {(student.enrollments?.length || 0) === 0 ? (
                <div className="p-6 text-center text-sm text-primary-400">Not enrolled in any class.</div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {student.enrollments?.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent">
                        <CalendarDays size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">
                          {e.classInstance?.class?.name} — {e.classInstance?.streamName}
                        </p>
                        <p className="text-xs text-surface-400">{e.academicYear?.name}</p>
                      </div>
                      <Badge variant={e.status === "active" ? "success" : "default"} className="ml-auto">{e.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
