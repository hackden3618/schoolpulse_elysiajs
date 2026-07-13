import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent } from "../components/ui/Card"
import { Skeleton } from "../components/ui/Skeleton"
import {
  Users,
  DollarSign,
  CalendarCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckSquare,
  FileText,
  Calendar,
  ChevronRight,
  ChevronDown,
  UserPlus,
  MessageSquare,
  CheckCircle2,
  Receipt,
  AlertCircle,
  RefreshCw,
  Shield,
} from "lucide-react"
import { dashboardApi, usersApi, studentsApi } from "../lib/api"
import { useAuth } from "../lib/auth-context"
import { UX_MIN_DELAY, withMinDelay } from "../lib/ux"
import { RoleSwitcherModal } from "../components/shell/RoleSwitcherModal"
import type { DashboardSummary, RecentActivity, User, Student } from "../types"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { school, user, activeRole, roles } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [activity, setActivity] = useState<RecentActivity | null>(null)
  const [loading, setLoading] = useState(activeRole?.name !== "guardian")
  const [error, setError] = useState("")
  const [myStudents, setMyStudents] = useState<Student[]>([])
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(() => {
    return roles.length > 1 && !!(location.state as any)?.promptRoleSwitch
  })

  const toggleRoleSwitcher = () => setShowRoleSwitcher((p) => !p)
  const [myStudentsLoading, setMyStudentsLoading] = useState(false)

  const load = async () => {
    if (!school) return
    if (activeRole?.name === "guardian") {
      setMyStudentsLoading(true)
      try {
        const res = await studentsApi.my(school.id)
        setMyStudents(res.data)
      } catch {
        // ignore
      } finally {
        setMyStudentsLoading(false)
      }
      return
    }
    setLoading(true)
    setError("")
    try {
      const [sumRes, actRes] = await withMinDelay(Promise.all([
        dashboardApi.summary(school.id),
        dashboardApi.activity(school.id),
      ]))
      setSummary(sumRes.data)
      setActivity(actRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [school?.id, activeRole])

  const displayName = user
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "there"
  const schoolName = school?.schoolName || "your school"
  const absent = summary ? Math.max(0, summary.students - summary.attendanceToday) : 0
  const presentPct = summary && summary.students > 0
    ? Math.round((summary.attendanceToday / summary.students) * 100)
    : 0
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  })()

  if (activeRole?.name === "guardian") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-primary-900 tracking-tight">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-primary-500">
            Here's what's happening with your students at {schoolName}.
          </p>
        </div>
        {myStudentsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : myStudents.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-surface-500">
              You have no students linked to your account in this school.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStudents.map((s) => (
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
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={40} className="text-danger-500 mb-4" />
        <p className="text-lg font-semibold text-primary-900 mb-2">Failed to load dashboard</p>
        <p className="text-sm text-primary-500 mb-4">{error}</p>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Here's what's happening at {schoolName} today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {roles.length > 1 && (
            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-50/50 px-3.5 py-2 text-sm font-semibold text-accent-700 hover:bg-accent-50 transition-all"
            >
              <Shield size={14} className="text-accent-500 shrink-0" />
              <span>{activeRole?.name === "guardian" ? "Parent View" : activeRole?.name || "Role"}</span>
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded-lg border border-primary-100/60 bg-white px-3.5 py-2 text-sm font-semibold text-primary-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-primary-200/80 hover:bg-primary-50 transition-all">
            <Calendar size={16} className="text-primary-400 shrink-0" />
            <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <ChevronDown size={14} className="text-primary-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Main Stats Row 1: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Active Students */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-success-50 p-2.5 text-success-500">
                <Users size={20} />
              </div>
              {summary && summary.students > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-bold text-success-700">
                  <TrendingUp size={12} />
                  <span>{presentPct}%</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">{summary?.attendanceToday ?? "—"}</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">
                  of {summary?.students ?? "—"} enrolled
                </p>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Present Today</p>
          </CardContent>
        </Card>

        {/* Stat 2: Absent */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-danger-50 p-2.5 text-danger-500">
                <Users size={20} />
              </div>
              {summary && summary.students > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-bold text-danger-700">
                  <TrendingDown size={12} />
                  <span>{100 - presentPct}%</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">{absent}</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">
                  of {summary?.students ?? "—"} enrolled
                </p>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Absent Today</p>
          </CardContent>
        </Card>

        {/* Stat 3: Active Staff */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-info-50 p-2.5 text-info-500">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">{summary?.staff ?? "—"}</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">active staff</p>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Staff</p>
          </CardContent>
        </Card>

        {/* Stat 4: Active Classes */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-accent-50 p-2.5 text-accent-500">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">{summary?.activeClasses ?? "—"}</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">active classes</p>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Active Classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all cursor-pointer" onClick={() => navigate("/attendance")}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">{summary?.attendanceToday ?? "—"}</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Attendance Records Today</p>
            </div>
            <div className="rounded-lg bg-success-50 p-2.5 text-success-500 shrink-0">
              <CalendarCheck size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary-100/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all cursor-pointer" onClick={() => navigate("/finance")}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">{summary?.openInvoices ?? "—"}</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Open Invoices</p>
            </div>
            <div className="rounded-lg bg-warning-50 p-2.5 text-warning-500 shrink-0">
              <Receipt size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary-100/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all cursor-pointer" onClick={() => navigate("/finance")}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">{summary?.pendingPayments ?? "—"}</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Pending Payments</p>
            </div>
            <div className="rounded-lg bg-info-50 p-2.5 text-info-500 shrink-0">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary-100/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all cursor-pointer" onClick={() => navigate("/academics")}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">{summary?.activeClasses ?? "—"}</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Active Classes</p>
            </div>
            <div className="rounded-lg bg-accent-50 p-2.5 text-accent-500 shrink-0">
              <BookOpen size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side (2/3 width column) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Row of 3 Cards side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. Recent Activity Card */}
            <Card className="flex flex-col h-[340px]">
              <div className="px-4 py-3 border-b border-primary-50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-primary-900 text-xs">Recent Payments</h3>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {!activity || activity.recentPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <DollarSign size={24} className="text-primary-300 mb-2" />
                    <p className="text-xs text-primary-400">No recent payments</p>
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary-50">
                    {activity.recentPayments.map((p) => (
                      <div key={p.id} className="relative">
                        <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-500" />
                        <div>
                          <p className="text-xs font-semibold text-primary-900 leading-tight">
                            Payment from {p.student.firstName} {p.student.lastName}
                          </p>
                          <p className="text-[10px] text-primary-400 mt-0.5">
                            KES {p.amount.toLocaleString()} — {p.method.replace("_", " ")}
                          </p>
                          <span className="text-[9px] text-primary-400 block mt-1">{timeAgo(p.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* 2. Academic Period */}
            <Card className="flex flex-col h-[340px]">
              <div className="px-4 py-3 border-b border-primary-50 shrink-0">
                <h3 className="font-semibold text-primary-900 text-xs">Current Academic Period</h3>
              </div>
              <div className="p-4 space-y-4 flex-1">
                {summary?.activeAcademicYear ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-primary-50 p-3">
                      <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Academic Year</p>
                      <p className="text-sm font-bold text-primary-900 mt-1">{summary.activeAcademicYear.name}</p>
                      <p className="text-[10px] text-primary-500 mt-0.5">
                        {new Date(summary.activeAcademicYear.startDate).toLocaleDateString()} — {new Date(summary.activeAcademicYear.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    {summary.activeTerm && (
                      <div className="rounded-lg bg-accent-50 p-3">
                        <p className="text-[10px] font-bold text-accent-600 uppercase tracking-wider">Current Term</p>
                        <p className="text-sm font-bold text-primary-900 mt-1">{summary.activeTerm.name}</p>
                        <p className="text-[10px] text-primary-500 mt-0.5">
                          {new Date(summary.activeTerm.startDate).toLocaleDateString()} — {new Date(summary.activeTerm.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Calendar size={24} className="text-primary-300 mb-2" />
                    <p className="text-xs text-primary-400">No active academic year set</p>
                  </div>
                )}
              </div>
            </Card>

            {/* 3. Quick Actions */}
            <Card className="flex flex-col h-[340px]">
              <div className="px-4 py-3 border-b border-primary-50 shrink-0">
                <h3 className="font-semibold text-primary-900 text-xs">Quick Actions</h3>
              </div>
              <div className="p-3 grid grid-cols-3 gap-1.5 flex-1 overflow-y-auto">
                <button onClick={() => navigate("/students/create")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <UserPlus size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Add Student</span>
                </button>

                <button onClick={() => navigate("/finance")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <DollarSign size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Record Payment</span>
                </button>

                <button onClick={() => navigate("/attendance")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <CalendarCheck size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Attendance</span>
                </button>

                <button onClick={() => navigate("/communication")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Mail size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Send Message</span>
                </button>

                <button onClick={() => navigate("/reports")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <FileText size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Gen. Report</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Calendar size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">View Timetable</span>
                </button>

                <button onClick={() => navigate("/finance")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Receipt size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Create Invoice</span>
                </button>

                <button onClick={() => navigate("/users/create")} className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Users size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Add Staff</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <ChevronRight size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">More Actions</span>
                </button>
              </div>
            </Card>
          </div>

          {/* School Overview */}
          <Card>
            <div className="px-5 py-4 border-b border-primary-50 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900 text-sm">School Overview</h3>
              <div className="flex items-center gap-3 text-xs text-primary-500">
                <span>{summary?.students ?? 0} Students</span>
                <span className="w-1 h-1 rounded-full bg-primary-300" />
                <span>{summary?.staff ?? 0} Staff</span>
                <span className="w-1 h-1 rounded-full bg-primary-300" />
                <span>{summary?.activeClasses ?? 0} Classes</span>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Students */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Student Body</h4>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-3xl font-bold text-primary-900">{summary?.students ?? 0}</p>
                      <p className="text-xs text-primary-500">Total enrolled</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success-600">{summary?.activeStudents ?? 0}</p>
                      <p className="text-xs text-primary-500">Active</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success-500 rounded-full"
                      style={{ width: summary && summary.students > 0 ? `${(summary.activeStudents / summary.students) * 100}%` : "0%" }}
                    />
                  </div>
                </div>

                {/* Finance Snapshot */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Finance Snapshot</h4>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-3xl font-bold text-primary-900">{summary?.openInvoices ?? 0}</p>
                      <p className="text-xs text-primary-500">Open invoices</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning-600">{summary?.pendingPayments ?? 0}</p>
                      <p className="text-xs text-primary-500">Pending payments</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning-500 rounded-full"
                      style={{ width: summary && summary.openInvoices > 0 ? `${Math.min(100, (summary.pendingPayments / Math.max(1, summary.openInvoices)) * 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Column */}
        <div className="space-y-6">
          {/* Current Term Info */}
          <Card>
            <div className="px-5 py-4 border-b border-primary-50">
              <h3 className="font-semibold text-primary-900 text-sm">Current Period</h3>
            </div>
            <CardContent className="p-5 space-y-3">
              {summary?.activeTerm ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent-50 p-2 text-accent-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-900">{summary.activeTerm.name}</p>
                      <p className="text-xs text-primary-400">{summary.activeAcademicYear?.name}</p>
                    </div>
                  </div>
                  <div className="text-xs text-primary-500">
                    {new Date(summary.activeTerm.startDate).toLocaleDateString()} — {new Date(summary.activeTerm.endDate).toLocaleDateString()}
                  </div>
                </>
              ) : (
                <p className="text-sm text-primary-400">No active term</p>
              )}
            </CardContent>
          </Card>

          {/* Notifications placeholder */}
          <Card>
            <div className="px-5 py-4 border-b border-primary-50">
              <h3 className="font-semibold text-primary-900 text-sm">Quick Stats</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600">Staff</span>
                <span className="text-sm font-bold text-primary-900">{summary?.staff ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600">Active Classes</span>
                <span className="text-sm font-bold text-primary-900">{summary?.activeClasses ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600">Total Students</span>
                <span className="text-sm font-bold text-primary-900">{summary?.students ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600">Open Invoices</span>
                <span className="text-sm font-bold text-primary-900">{summary?.openInvoices ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600">Pending Payments</span>
                <span className="text-sm font-bold text-primary-900">{summary?.pendingPayments ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-success-100/30 bg-success-50/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-success-50 p-1.5 text-success-500 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-success-700">All Systems Operational</p>
                <p className="text-[10px] text-success-600 mt-0.5 font-medium">Data loaded from live API</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showRoleSwitcher && <RoleSwitcherModal onClose={() => setShowRoleSwitcher(false)} />}
    </div>
  )
}
