import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronRight, Smartphone, Wallet, ArrowLeft, AlertCircle,
  User, GraduationCap, CheckCircle2,
} from "lucide-react"
import { studentsApi, financeApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Skeleton } from "../../components/ui/Skeleton"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { EmptyState } from "../../components/ui/EmptyState"
import { GuardianMpesaModal as MpesaPaymentModal } from "../../components/finance/GuardianMpesaModal"
import type { Student, Invoice, Guardian } from "../../types"

function primaryGuardianPhone(student: Student, userPhone?: string): string | undefined {
  // Prefer the in-context user's own registered number (the line that will
  // authorize the STK push). Fall back to the student's primary paying
  // guardian only when the user has no phone on file.
  if (userPhone) return userPhone
  const guardians = student.guardians ?? []
  const primary = guardians.find((g) => g.isPrimary && g.canPay) ?? guardians.find((g) => g.canPay)
  return primary?.guardian.phone
}

function money(value: number): string {
  return `KES ${Number(value || 0).toLocaleString()}`
}

export function GuardianPaymentsPage() {
  const navigate = useNavigate()
  const { school, user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [activeStudent, setActiveStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState("")

  const [payOpen, setPayOpen] = useState(false)
  const [preselectId, setPreselectId] = useState<string | null>(null)

  const displayName = user ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : "there"

  const loadStudents = useCallback(() => {
    if (!school) return
    setLoading(true)
    setError("")
    studentsApi.my(school.id)
      .then((res) => setStudents(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load children"))
      .finally(() => setLoading(false))
  }, [school?.id])

  useEffect(() => { loadStudents() }, [loadStudents])

  const loadInvoices = useCallback(async (student: Student) => {
    if (!school) return
    setActiveStudent(student)
    setInvoicesLoading(true)
    setInvoicesError("")
    try {
      const res = await financeApi.invoices.guardianList(school.id, student.id)
      setInvoices(res.data)
    } catch (err) {
      setInvoicesError(err instanceof Error ? err.message : "Failed to load invoices")
    } finally {
      setInvoicesLoading(false)
    }
  }, [school?.id])

  const unpaidInvoices = invoices.filter((inv) => Number(inv.outstanding ?? inv.balance) > 0)
  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.outstanding ?? inv.balance), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Payments"
        description={`Welcome, ${displayName}. Review balances and pay via M-Pesa.`}
      />

      {error && <ErrorBanner message={error} onRetry={loadStudents} />}

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
      ) : !activeStudent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => {
              const phone = primaryGuardianPhone(s, user?.phone)
            return (
              <button
                key={s.id}
                onClick={() => loadInvoices(s)}
                className="text-left rounded-xl border border-primary-100/60 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
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
                  <div className="mt-3 flex items-center gap-2 text-xs text-surface-500">
                    <GraduationCap size={12} />
                    <span>{s.currentEnrollment?.classInstance?.class?.name} {s.currentEnrollment?.classInstance?.streamName}</span>
                  </div>
                  {!phone && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-warning-600">
                      <AlertCircle size={12} /> No registered payment number
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-surface-400">View statement</span>
                    <ChevronRight size={16} className="text-surface-400" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-5">
          <button
            onClick={() => setActiveStudent(null)}
            className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 transition-colors"
          >
            <ArrowLeft size={16} /> Back to children
          </button>

          {/* Balance summary */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    {activeStudent.firstName[0]}{activeStudent.lastName?.[0] || ""}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900">{activeStudent.firstName} {activeStudent.lastName}</p>
                    <p className="text-xs text-surface-500">Adm: {activeStudent.admissionNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-surface-500">Total Outstanding</p>
                  <p className="text-2xl font-bold text-danger-600">{money(totalOutstanding)}</p>
                  {Number(activeStudent.creditBalance) > 0 && (
                    <p className="text-xs text-success-600 mt-1">
                      Credit: {money(Number(activeStudent.creditBalance))}
                    </p>
                  )}
                </div>
              </div>
              {unpaidInvoices.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => { setPreselectId(null); setPayOpen(true) }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Wallet size={16} className="mr-1.5" /> Pay via M-Pesa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          {invoicesLoading ? (
            <Skeleton className="h-40" />
          ) : invoicesError ? (
            <ErrorBanner message={invoicesError} onRetry={() => loadInvoices(activeStudent)} />
          ) : invoices.length === 0 ? (
              <EmptyState
              icon={<CheckCircle2 size={40} className="text-success-500" />}
              title="No invoices"
              description="There are no fee invoices for this student yet."
            />
          ) : (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-surface-900">Invoices</h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-surface-100">
                  {invoices.map((inv) => {
                    const outstanding = Number(inv.outstanding ?? inv.balance)
                    const isPaid = outstanding <= 0
                    return (
                      <div key={inv.id} className="flex items-center justify-between gap-3 px-5 py-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-surface-900 truncate">
                              {inv.term?.name || "Term"}
                            </p>
                            <Badge
                              variant={
                                isPaid ? "success" :
                                inv.status === "overdue" ? "danger" : "warning"
                              }
                            >
                              {isPaid ? "Paid" : inv.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">
                            Total: {money(Number(inv.totalAmount))} · Paid: {money(Number(inv.paidAmount))}
                          </p>
                          <p className="text-sm font-semibold text-danger-600 mt-1">
                            Outstanding: {money(outstanding)}
                          </p>
                        </div>
                        {!isPaid && (
                          <Button
                            size="sm"
                            onClick={() => { setPreselectId(inv.id); setPayOpen(true) }}
                            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                          >
                            <Smartphone size={15} className="mr-1.5" /> Pay
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {payOpen && activeStudent && (
        <MpesaPaymentModal
          invoices={invoices}
          studentId={activeStudent.id}
          studentName={`${activeStudent.firstName} ${activeStudent.lastName}`}
          guardianPhone={primaryGuardianPhone(activeStudent, user?.phone)}
          preselectedIds={preselectId ? [preselectId] : null}
          onClose={() => setPayOpen(false)}
          onSuccess={() => activeStudent && loadInvoices(activeStudent)}
        />
      )}
    </div>
  )
}
