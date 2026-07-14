import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "../../components/ui/Card"
import { Skeleton } from "../../components/ui/Skeleton"
import { CalendarCheck, BookOpen, Users, ClipboardCheck, FileText, RefreshCw, AlertCircle } from "lucide-react"
import { dashboardApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { DashboardSummary } from "../../types"

export function TeacherDashboard() {
  const navigate = useNavigate()
  const { school, user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    if (!school) return
    setLoading(true)
    setError("")
    try {
      const res = await dashboardApi.summary(school.id)
      setSummary(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [school?.id])

  const displayName = user ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : "there"
  const schoolName = school?.schoolName || "your school"

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={40} className="text-danger-500 mb-4" />
        <p className="text-sm text-primary-500 mb-4">{error}</p>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 tracking-tight">Welcome, {displayName}</h1>
          <p className="text-sm text-primary-500">Your classes at {schoolName}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-success-50 p-2.5 text-success-500 w-fit">
              <CalendarCheck size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">{summary?.attendanceToday ?? "—"}</p>
            <p className="text-xs text-primary-500 mt-1">Present Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-info-50 p-2.5 text-info-500 w-fit">
              <Users size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">{summary?.activeStudents ?? "—"}</p>
            <p className="text-xs text-primary-500 mt-1">Active Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-accent-50 p-2.5 text-accent-500 w-fit">
              <BookOpen size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">{summary?.activeClasses ?? "—"}</p>
            <p className="text-xs text-primary-500 mt-1">Active Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-warning-50 p-2.5 text-warning-500 w-fit">
              <ClipboardCheck size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">{summary?.activeStudents ?? "—"}</p>
            <p className="text-xs text-primary-500 mt-1">Assessments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/attendance")}>
          <div className="rounded-lg bg-success-50 p-2.5 text-success-600">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">Mark Attendance</p>
            <p className="text-xs text-primary-500">Today's register</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/assessments")}>
          <div className="rounded-lg bg-accent-50 p-2.5 text-accent-600">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">Enter Marks</p>
            <p className="text-xs text-primary-500">Assessments & exams</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/reports")}>
          <div className="rounded-lg bg-info-50 p-2.5 text-info-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">Reports</p>
            <p className="text-xs text-primary-500">Class performance</p>
          </div>
        </div>
      </div>

      {summary?.activeTerm && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-accent-50 p-2 text-accent-600">
              <BookOpen size={16} />
            </div>
            <div className="text-sm text-primary-600">
              <span className="font-semibold text-primary-900">{summary.activeTerm.name}</span>
              {" — "}{summary.activeAcademicYear?.name}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
