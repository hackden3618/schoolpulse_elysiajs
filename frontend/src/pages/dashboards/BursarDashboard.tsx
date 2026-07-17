import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "../../components/ui/Card"
import { Skeleton } from "../../components/ui/Skeleton"
import { DollarSign, Receipt, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Users, FileText } from "lucide-react"
import { dashboardApi, reportsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { DashboardSummary, FinanceReport } from "../../types"

export function BursarDashboard() {
  const navigate = useNavigate()
  const { school, user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [finance, setFinance] = useState<FinanceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    if (!school) return
    setLoading(true)
    setError("")
    try {
      const [sumRes, finRes] = await Promise.all([
        dashboardApi.summary(school.id),
        reportsApi.finance(school.id).catch(() => null),
      ])
      setSummary(sumRes.data)
      setFinance(finRes?.data ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [school?.id])

  const displayName = user ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : "there"
  const schoolName = school?.schoolName || "your school"
  const collectionRate = finance && finance.totalInvoiced > 0
    ? Math.round((finance.totalCollected / finance.totalInvoiced) * 100)
    : 0

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
          <p className="text-sm text-primary-500">Finance overview at {schoolName}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-success-50 p-2.5 text-success-500">
                <DollarSign size={20} />
              </div>
              {finance && (
                <div className="flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-bold text-success-700">
                  <TrendingUp size={12} />
                  <span>{collectionRate}%</span>
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">
              KES {finance?.totalCollected?.toLocaleString() ?? "—"}
            </p>
            <p className="text-xs text-primary-500 mt-1">Total Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-warning-50 p-2.5 text-warning-500 w-fit">
              <Receipt size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">
              KES {finance?.totalInvoiced?.toLocaleString() ?? "—"}
            </p>
            <p className="text-xs text-primary-500 mt-1">Total Invoiced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-danger-50 p-2.5 text-danger-500 w-fit">
              <TrendingDown size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">
              KES {(finance ? Math.max(0, finance.totalInvoiced - finance.totalCollected) : "—").toLocaleString()}
            </p>
            <p className="text-xs text-primary-500 mt-1">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-full bg-info-50 p-2.5 text-info-500 w-fit">
              <Users size={20} />
            </div>
            <p className="text-3xl font-bold text-primary-900 tracking-tight mt-4">{summary?.openInvoices ?? "—"}</p>
            <p className="text-xs text-primary-500 mt-1">Open Invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/finance")}>
          <div className="rounded-lg bg-accent-50 p-2.5 text-accent-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">Record Payment</p>
            <p className="text-xs text-primary-500">New payment entry</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/finance")}>
          <div className="rounded-lg bg-info-50 p-2.5 text-info-600">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">Invoices</p>
            <p className="text-xs text-primary-500">Manage fee invoices</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary-100/60 bg-white shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/reports")}>
          <div className="rounded-lg bg-warning-50 p-2.5 text-warning-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">Reports</p>
            <p className="text-xs text-primary-500">Finance reports</p>
          </div>
        </div>
      </div>

      {finance && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-primary-900 text-sm mb-3">Collection Progress</h3>
            <div className="h-3 w-full bg-primary-50 rounded-full overflow-hidden">
              <div className="h-full bg-success-500 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-primary-500">
              <span>KES {finance.totalCollected?.toLocaleString()} collected</span>
              <span>{collectionRate}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
