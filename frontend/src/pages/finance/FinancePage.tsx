import { useState, useEffect, type FormEvent } from "react"
import { DollarSign, Plus, Search, AlertCircle, RefreshCw, X } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Skeleton } from "../../components/ui/Skeleton"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Table } from "../../components/ui/Table"
import { EmptyState } from "../../components/ui/EmptyState"
import { financeApi, academicApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { Invoice, FeeStructure, AcademicYear, Term, Student } from "../../types"
import { studentsApi } from "../../lib/api"

type Tab = "invoices" | "fee-structures" | "payments"

const statusVariant: Record<string, BadgeVariant> = {
  paid: "success",
  partially_paid: "warning",
  overdue: "danger",
  issued: "info",
  draft: "default",
  cancelled: "default",
  written_off: "default",
  pending: "warning",
  confirmed: "success",
  failed: "danger",
  reversed: "default",
}

export function FinancePage() {
  const { school } = useAuth()
  const schoolId = school!.id
  const [tab, setTab] = useState<Tab>("invoices")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  /* Generate invoice form */
  const [showGenerate, setShowGenerate] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [genStudentId, setGenStudentId] = useState("")
  const [genFeeStructureId, setGenFeeStructureId] = useState("")
  const [genTermId, setGenTermId] = useState("")
  const [saving, setSaving] = useState(false)

  /* Record payment form */
  const [showPayment, setShowPayment] = useState(false)
  const [payStudentId, setPayStudentId] = useState("")
  const [payInvoiceId, setPayInvoiceId] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("cash")
  const [payRef, setPayRef] = useState("")

  const loadInvoices = async () => {
    setLoading(true)
    setError("")
    try {
      const [invRes, feeRes, stuRes] = await withMinDelay(Promise.all([
        financeApi.invoices.list(schoolId),
        financeApi.feeStructures.list(schoolId),
        studentsApi.list(schoolId),
      ]))
      setInvoices(invRes.data)
      setFeeStructures(feeRes.data)
      setStudents(stuRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load finance data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInvoices() }, [schoolId])

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    if (!genStudentId || !genFeeStructureId || !genTermId) return
    setSaving(true)
    try {
      await withMinDelay(financeApi.invoices.generate(schoolId, {
        studentId: genStudentId,
        feeStructureId: genFeeStructureId,
        termId: genTermId,
      }))
      setShowGenerate(false)
      setGenStudentId(""); setGenFeeStructureId(""); setGenTermId("")
      await loadInvoices()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate invoice")
    } finally {
      setSaving(false)
    }
  }

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!payStudentId || !payInvoiceId || !payAmount) return
    setSaving(true)
    try {
      await withMinDelay(financeApi.payments.record(schoolId, {
        studentId: payStudentId,
        invoiceId: payInvoiceId,
        amount: Number(payAmount),
        method: payMethod,
        transactionRef: payRef,
      }))
      setShowPayment(false)
      setPayStudentId(""); setPayInvoiceId(""); setPayAmount(""); setPayMethod("cash"); setPayRef("")
      await loadInvoices()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record payment")
    } finally {
      setSaving(false)
    }
  }

  const totalCollected = invoices
    .filter((i) => i.status === "paid" || i.status === "partially_paid")
    .reduce((sum, i) => sum + i.paidAmount, 0)

  const totalOutstanding = invoices
    .filter((i) => i.status === "issued" || i.status === "overdue" || i.status === "partially_paid")
    .reduce((sum, i) => sum + i.balance, 0)

  const openCount = invoices.filter((i) => i.status === "issued" || i.status === "overdue").length

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.student?.firstName?.toLowerCase().includes(q) ||
      inv.student?.lastName?.toLowerCase().includes(q) ||
      inv.status.includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Fee structures, invoices, payments and receipts."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowPayment(!showPayment)}>
              <DollarSign size={16} /> Record Payment
            </Button>
            <Button onClick={() => setShowGenerate(!showGenerate)}>
              <Plus size={16} /> Generate Invoice
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-surface-500">Total Collected</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">KES {totalCollected.toLocaleString()}</p>
            <p className="mt-1 text-xs text-surface-400">{invoices.length} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-surface-500">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">KES {totalOutstanding.toLocaleString()}</p>
            <p className="mt-1 text-xs text-surface-400">{openCount} invoices overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-surface-500">Collection Rate</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">
              {totalCollected + totalOutstanding > 0
                ? Math.round((totalCollected / (totalCollected + totalOutstanding)) * 100)
                : 0}%
            </p>
            <p className="mt-1 text-xs text-surface-400">
              {invoices.filter((i) => i.status === "paid").length} fully paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Invoice Form */}
      {showGenerate && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Student</label>
                <select value={genStudentId} onChange={(e) => setGenStudentId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Fee Structure</label>
                <select value={genFeeStructureId} onChange={(e) => setGenFeeStructureId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select structure...</option>
                  {feeStructures.map((fs) => (
                    <option key={fs.id} value={fs.id}>
                      {fs.academicYear?.name} — {fs.term?.name} {fs.isGlobal ? "(Global)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Term</label>
                <select value={genTermId} onChange={(e) => setGenTermId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select term...</option>
                  {feeStructures.map((fs) => (
                    <option key={fs.term.id} value={fs.term.id}>{fs.term.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-end pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Generate"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowGenerate(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Form */}
      {showPayment && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Student</label>
                <select value={payStudentId} onChange={(e) => setPayStudentId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Invoice</label>
                <select value={payInvoiceId} onChange={(e) => setPayInvoiceId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.student?.firstName} {inv.student?.lastName} — KES {inv.balance}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Amount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" />
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="cash">Cash</option>
                  <option value="mpesa_stk">M-Pesa STK</option>
                  <option value="mpesa_c2b">M-Pesa C2B</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="bursary">Bursary</option>
                </select>
              </div>
              <div className="flex gap-2 items-end pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Record"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowPayment(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-primary-50 p-1 border border-primary-100 w-fit">
        {(["invoices", "fee-structures", "payments"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-all capitalize ${
              tab === t ? "bg-white text-primary-900 shadow-sm" : "text-primary-500 hover:text-primary-700"
            }`}
          >{t.replace("-", " ")}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : tab === "invoices" ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-surface-100">
              <h3 className="text-lg font-semibold text-surface-900">Invoices</h3>
              <div className="flex items-center gap-2">
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <Input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-surface-50 border-surface-200 pl-9" />
                </div>
                <Button size="sm" variant="secondary" onClick={loadInvoices}><RefreshCw size={14} /></Button>
              </div>
            </div>
            {filteredInvoices.length === 0 ? (
              <EmptyState title="No invoices" description="Generate invoices to get started." />
            ) : (
              <Table
                columns={[
                  { key: "student", header: "Student", render: (i: Invoice) => (
                    <span className="font-medium">{i.student?.firstName} {i.student?.lastName}</span>
                  )},
                  { key: "term", header: "Term", render: (i: Invoice) => i.term?.name || "—" },
                  { key: "total", header: "Total", render: (i: Invoice) => `KES ${i.totalAmount.toLocaleString()}` },
                  { key: "paid", header: "Paid", render: (i: Invoice) => `KES ${i.paidAmount.toLocaleString()}` },
                  { key: "balance", header: "Balance", render: (i: Invoice) => (
                    i.balance === 0 ? <span className="text-success-600">Paid</span> : `KES ${i.balance.toLocaleString()}`
                  )},
                  { key: "status", header: "Status", render: (i: Invoice) => (
                    <Badge variant={statusVariant[i.status]}>{i.status.replace("_", " ")}</Badge>
                  )},
                  { key: "due", header: "Due Date", render: (i: Invoice) => new Date(i.dueDate).toLocaleDateString() },
                ]}
                data={filteredInvoices}
              />
            )}
          </CardContent>
        </Card>
      ) : tab === "fee-structures" ? (
        <Card>
          <CardContent className="p-5">
            {feeStructures.length === 0 ? (
              <EmptyState title="No fee structures" description="Create fee structures for academic terms." />
            ) : (
              <div className="space-y-4">
                {feeStructures.map((fs) => (
                  <div key={fs.id} className="rounded-lg border border-surface-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-surface-900">
                          {fs.academicYear?.name} — {fs.term?.name}
                        </p>
                        <p className="text-xs text-surface-500">
                          {fs.isGlobal ? "Global" : fs.class?.name || "N/A"}
                        </p>
                      </div>
                      <Badge variant={fs.isLatest ? "success" : "default"}>
                        {fs.isLatest ? "Current" : "Archived"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {fs.feeItems?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-surface-700">{item.name}</span>
                          <span className="font-medium text-surface-900">KES {item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-surface-100 flex justify-between text-sm font-bold">
                      <span className="text-surface-700">Total</span>
                      <span className="text-surface-900">
                        KES {fs.feeItems?.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Payments tab */
        <Card>
          <CardContent className="p-5">
            <EmptyState title="Payment records" description="Record payments to see them listed here." />
          </CardContent>
        </Card>
      )}
    </div>
  )
}