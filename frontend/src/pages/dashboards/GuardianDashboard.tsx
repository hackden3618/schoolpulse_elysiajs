import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "../../components/ui/Card"
import { Skeleton } from "../../components/ui/Skeleton"
import { BookOpen, Users, DollarSign, CalendarCheck, MessageSquare } from "lucide-react"
import { studentsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { Student } from "../../types"

export function GuardianDashboard() {
  const navigate = useNavigate()
  const { school, user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!school) return
    setLoading(true)
    studentsApi.my(school.id).then((res) => setStudents(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [school?.id])

  const displayName = user ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : "there"
  const schoolName = school?.schoolName || "your school"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary-900 tracking-tight">Welcome, {displayName}</h1>
        <p className="text-sm text-primary-500">Your children at {schoolName}.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-surface-500">
            No students linked to your account.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <div key={s.id} className="rounded-xl border border-primary-100/60 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                      {s.firstName[0]}{s.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-surface-900 truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-surface-500">Adm: {s.admissionNumber}</p>
                    </div>
                  </div>
                  {s.currentEnrollment && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-surface-500">
                      <BookOpen size={12} />
                      <span>{s.currentEnrollment.classInstance?.class?.name} {s.currentEnrollment.classInstance?.streamName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/communication")}>
              <div className="rounded-lg bg-accent-50 p-2.5 text-accent-600">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">Messages</p>
                <p className="text-xs text-primary-500">School communication</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/payments")}>
              <div className="rounded-lg bg-info-50 p-2.5 text-info-600">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">Fee Balance</p>
                <p className="text-xs text-primary-500">Pay via M-Pesa</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/support")}>
              <div className="rounded-lg bg-warning-50 p-2.5 text-warning-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">Support</p>
                <p className="text-xs text-primary-500">Get help</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
