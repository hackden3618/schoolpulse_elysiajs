import { useState, useEffect } from "react"
import { BarChart3, Users, GraduationCap, DollarSign, FileDown, RefreshCw, CalendarCheck } from "lucide-react"
import { reportsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Skeleton } from "../../components/ui/Skeleton"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import type { ReportSummaryItem, AttendanceReport, FinanceReport, AcademicReport, StudentReport } from "../../types"

const MIN_LOAD_MS = 500

const iconMap: Record<string, React.ReactNode> = {
  attendance: <CalendarCheck size={20} />,
  finance: <DollarSign size={20} />,
  academic: <GraduationCap size={20} />,
  students: <Users size={20} />,
}

export function ReportsPage() {
  const { school } = useAuth()
  const [summary, setSummary] = useState<ReportSummaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [generating, setGenerating] = useState<string | null>(null)

  const load = async () => {
    if (!school) return
    setLoading(true)
    setError("")
    const start = Date.now()
    try {
      const res = await reportsApi.summary(school.id)
      await new Promise((r) => setTimeout(r, Math.max(0, MIN_LOAD_MS - (Date.now() - start))))
      setSummary(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [school?.id])

  const handleGenerate = async (type: string) => {
    if (!school) return
    setGenerating(type)
    const start = Date.now()
    try {
      const promise = type === "attendance"
        ? reportsApi.attendance(school.id)
        : type === "finance"
        ? reportsApi.finance(school.id)
        : type === "academic"
        ? reportsApi.academic(school.id)
        : reportsApi.students(school.id)
      await Promise.all([promise, new Promise((r) => setTimeout(r, Math.max(0, MIN_LOAD_MS - (Date.now() - start))))])
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report")
    } finally {
      setGenerating(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (error && summary.length === 0) {
    return <ErrorBanner message={error} onRetry={load} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export operational reports."
        actions={
          <Button variant="secondary" disabled>
            <FileDown size={16} />
            Export All
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
          <BarChart3 size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summary.map((item) => (
          <Card key={item.type} className="hover:border-primary-200 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="rounded-lg bg-primary-50 p-2.5 text-primary-500">
                  {iconMap[item.type] || <BarChart3 size={18} />}
                </div>
                <span className="text-xs font-medium text-surface-400 bg-surface-100 rounded-full px-2 py-0.5">
                  {item.count} records
                </span>
              </div>
              <h3 className="font-semibold text-surface-900">{item.label}</h3>
              <p className="mt-1 text-sm text-surface-500 mb-4">
                {item.type === "attendance" && "Daily, weekly, and term attendance summaries."}
                {item.type === "finance" && "Fee collection, revenue, and outstanding balances."}
                {item.type === "academic" && "Exam results, grade distributions, and report cards."}
                {item.type === "students" && "Enrollment demographics and student statistics."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleGenerate(item.type)}
                disabled={generating === item.type}
              >
                {generating === item.type ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={13} />
                    Generate Report
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
