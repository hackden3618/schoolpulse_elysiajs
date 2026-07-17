import { useState, useEffect, type FormEvent } from "react"
import { DollarSign, Plus, Search, AlertCircle, RefreshCw, X, Smartphone, Building, Banknote, CreditCard, Bus, Home, BookOpen, Shirt, Activity, Heart, Package, Users, Trash2 } from "lucide-react"
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
import type { Invoice, FeeStructure, AcademicYear, Term, Student, Payment, ClassInstance } from "../../types"
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

const FEE_CATEGORIES = [
  { name: "Tuition", keywords: ["tuition", "school fees", "fee", "academic", "development", "caution"], icon: BookOpen },
  { name: "Transport", keywords: ["transport", "bus", "fare", "travel", "shuttle"], icon: Bus },
  { name: "Boarding", keywords: ["boarding", "accommodation", "hostel", "dormitory", "bed", "lodging"], icon: Home },
  { name: "Uniform", keywords: ["uniform", "apparel", "clothing", "p.e", "sports kit", "tracksuit"], icon: Shirt },
  { name: "Activities", keywords: ["activity", "sport", "music", "club", "trip", "excursion", "competition", "games"], icon: Activity },
  { name: "Supplies", keywords: ["book", "stationery", "supplies", "materials", "equipment", "calculator"], icon: Package },
  { name: "Medical", keywords: ["medical", "health", "clinic", "insurance", "medicine", "hospital", "doctor"], icon: Heart },
]

function categorizeItem(name: string): string {
  const lower = name.toLowerCase()
  for (const cat of FEE_CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.name
  }
  return "Other"
}

function getCategoryIcon(category: string) {
  return FEE_CATEGORIES.find(c => c.name === category)?.icon || Package
}

export function FinancePage() {
  const { school } = useAuth()
  const schoolId = school!.id
  const [tab, setTab] = useState<Tab>("invoices")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [paySearch, setPaySearch] = useState("")
  const [payMethodFilter, setPayMethodFilter] = useState("all")
  const [payStatusFilter, setPayStatusFilter] = useState("all")
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

  /* Create fee structure form */
  const [showCreateFs, setShowCreateFs] = useState(false)
  const [fsAcademicYearId, setFsAcademicYearId] = useState("")
  const [fsTermId, setFsTermId] = useState("")
  const [fsClassId, setFsClassId] = useState("")
  const [fsIsGlobal, setFsIsGlobal] = useState(true)
  const [fsItems, setFsItems] = useState([{ name: "", amount: 0, optional: false }])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [classes, setClasses] = useState<ClassInstance[]>([])

  /* Bulk invoice generation form */
  const [showBulkGen, setShowBulkGen] = useState(false)
  const [bulkClassId, setBulkClassId] = useState("")
  const [bulkTermId, setBulkTermId] = useState("")
  const [bulkFeeStructureId, setBulkFeeStructureId] = useState("")
  const [bulkResult, setBulkResult] = useState<{ generated: number; total: number; errors: { studentId: string; reason: string }[] } | null>(null)

  /* Record payment form */
  const [showPayment, setShowPayment] = useState(false)
  const [payStudentId, setPayStudentId] = useState("")
  const [payInvoiceId, setPayInvoiceId] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("cash")
  const [payRef, setPayRef] = useState("")
  const [payPhone, setPayPhone] = useState("")
  const [mpesaSent, setMpesaSent] = useState(false)

  const loadPayments = () => financeApi.payments.list(schoolId)

  const loadInvoices = async () => {
    setLoading(true)
    setError("")
    try {
      const [invRes, feeRes, stuRes, payRes, yrRes, termRes, clsRes] = await withMinDelay(Promise.all([
        financeApi.invoices.list(schoolId),
        financeApi.feeStructures.list(schoolId),
        studentsApi.list(schoolId),
        loadPayments(),
        academicApi.years.list(schoolId),
        academicApi.terms.list(schoolId),
        academicApi.classInstances.list(schoolId),
      ]))
      setInvoices(invRes.data)
      setFeeStructures(feeRes.data)
      setStudents(stuRes.data)
      setPayments(payRes.data)
      setAcademicYears(yrRes.data)
      setTerms(termRes.data)
      setClasses(clsRes.data)
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

  const handleCreateFeeStructure = async (e: FormEvent) => {
    e.preventDefault()
    if (!fsAcademicYearId || !fsTermId || fsItems.some(i => !i.name || i.amount <= 0)) {
      setError("Please fill all required fields and ensure items have valid names/amounts")
      return
    }
    setSaving(true)
    setError("")
    try {
      await withMinDelay(financeApi.feeStructures.create(schoolId, {
        academicYearId: fsAcademicYearId,
        termId: fsTermId,
        classId: fsIsGlobal ? undefined : fsClassId || undefined,
        isGlobal: fsIsGlobal,
        items: fsItems.map(i => ({ name: i.name, amount: i.amount, optional: i.optional })),
      }))
      setShowCreateFs(false)
      setFsAcademicYearId(""); setFsTermId(""); setFsClassId(""); setFsIsGlobal(true)
      setFsItems([{ name: "", amount: 0, optional: false }])
      await loadInvoices()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create fee structure")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateBulkInvoices = async (e: FormEvent) => {
    e.preventDefault()
    if (!bulkClassId || !bulkTermId || !bulkFeeStructureId) return
    setSaving(true)
    setError("")
    setBulkResult(null)
    try {
      const res = await withMinDelay(financeApi.invoices.generateBulk(schoolId, {
        classId: bulkClassId,
        termId: bulkTermId,
        feeStructureId: bulkFeeStructureId,
      }))
      setBulkResult(res.data)
      setShowBulkGen(false)
      setBulkClassId(""); setBulkTermId(""); setBulkFeeStructureId("")
      await loadInvoices()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate invoices")
    } finally {
      setSaving(false)
    }
  }

  const addFsItem = () => setFsItems(prev => [...prev, { name: "", amount: 0, optional: false }])
  const removeFsItem = (index: number) => {
    if (fsItems.length <= 1) return
    setFsItems(prev => prev.filter((_, i) => i !== index))
  }
  const updateFsItem = (index: number, field: string, value: any) => {
    setFsItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!payStudentId || !payInvoiceId || !payAmount) return
    if (payMethod === "mpesa_stk" && !payPhone) {
      setError("Phone number is required for M-Pesa STK Push")
      return
    }
    setSaving(true)
    setError("")
    setMpesaSent(false)
    try {
      if (payMethod === "mpesa_stk") {
        await withMinDelay(financeApi.payments.initiateMpesa(schoolId, {
          invoiceId: payInvoiceId,
          phoneNumber: payPhone,
          amount: Number(payAmount),
        }))
        setMpesaSent(true)
      } else {
        await withMinDelay(financeApi.payments.record(schoolId, {
          studentId: payStudentId,
          invoiceId: payInvoiceId,
          amount: Number(payAmount),
          method: payMethod,
          transactionRef: payRef || `${payMethod}-${Date.now()}`,
        }))
        setShowPayment(false)
      }
      setPayStudentId(""); setPayInvoiceId(""); setPayAmount(""); setPayMethod("cash"); setPayRef(""); setPayPhone("")
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

  const methodLabels: Record<string, string> = {
    mpesa_stk: "M-Pesa STK",
    mpesa_c2b: "M-Pesa C2B",
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    bursary: "Bursary",
    adjustment: "Adjustment",
    credit: "Credit",
  }

  const filteredPayments = payments.filter((p) => {
    if (payMethodFilter !== "all" && p.method !== payMethodFilter) return false
    if (payStatusFilter !== "all" && p.status !== payStatusFilter) return false
    if (paySearch) {
      const q = paySearch.toLowerCase()
      const name = `${p.student?.firstName} ${p.student?.lastName}`.toLowerCase()
      if (!name.includes(q) && !p.transactionRef?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const confirmedPayments = payments.filter((p) => p.status === "confirmed")
  const totalCollectedViaPayments = confirmedPayments.reduce((sum, p) => sum + p.amount, 0)

  const methodBreakdown = [
    "mpesa_stk", "mpesa_c2b", "cash", "bank_transfer", "bursary", "adjustment", "credit",
  ].map((method) => {
    const filtered = payments.filter((p) => p.method === method)
    return { method, count: filtered.length, total: filtered.reduce((sum, p) => sum + p.amount, 0) }
  }).filter((m) => m.count > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Fee structures, invoices, payments and receipts."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setShowPayment(!showPayment)}>
              <DollarSign size={16} /> Record Payment
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateFs(!showCreateFs)}>
              <Plus size={16} /> Fee Structure
            </Button>
            <Button variant="secondary" onClick={() => setShowBulkGen(!showBulkGen)}>
              <Users size={16} /> Generate Class
            </Button>
            <Button onClick={() => setShowGenerate(!showGenerate)}>
              <Plus size={16} /> Invoice
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

      {/* Create Fee Structure Form */}
      {showCreateFs && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreateFeeStructure} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-surface-700">Academic Year</label>
                  <select value={fsAcademicYearId} onChange={(e) => setFsAcademicYearId(e.target.value)}
                    className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-surface-700">Term</label>
                  <select value={fsTermId} onChange={(e) => setFsTermId(e.target.value)}
                    className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-surface-700">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={fsIsGlobal} onChange={(e) => setFsIsGlobal(e.target.checked)} className="rounded" />
                      Global
                    </label>
                  </label>
                  {!fsIsGlobal && (
                    <select value={fsClassId} onChange={(e) => setFsClassId(e.target.value)}
                      className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                      <option value="">Select class...</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.class?.name} {c.streamName}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-surface-700">&nbsp;</label>
                  <div className="flex gap-2">
                    <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
                    <Button size="sm" variant="secondary" type="button" onClick={() => setShowCreateFs(false)}><X size={14} /></Button>
                  </div>
                </div>
              </div>
              <div className="border-t border-surface-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-surface-700 uppercase">Fee Items</span>
                  <Button size="sm" variant="secondary" type="button" onClick={addFsItem}><Plus size={14} /> Add Item</Button>
                </div>
                <div className="space-y-2">
                  {fsItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input type="text" placeholder="Fee name" value={item.name} onChange={(e) => updateFsItem(idx, "name", e.target.value)} className="flex-1" />
                      <Input type="number" placeholder="Amount" value={item.amount || ""} onChange={(e) => updateFsItem(idx, "amount", Number(e.target.value))} className="w-32" />
                      <label className="flex items-center gap-1 text-xs text-surface-600 whitespace-nowrap">
                        <input type="checkbox" checked={item.optional} onChange={(e) => updateFsItem(idx, "optional", e.target.checked)} />
                        Optional
                      </label>
                      <button type="button" onClick={() => removeFsItem(idx)} className="text-danger-500 hover:text-danger-700"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Invoice Generation Form */}
      {showBulkGen && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleGenerateBulkInvoices} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Class</label>
                <select value={bulkClassId} onChange={(e) => setBulkClassId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.class?.name} {c.streamName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Fee Structure</label>
                <select value={bulkFeeStructureId} onChange={(e) => setBulkFeeStructureId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {feeStructures.map((fs) => (
                    <option key={fs.id} value={fs.id}>{fs.academicYear?.name} — {fs.term?.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Term</label>
                <select value={bulkTermId} onChange={(e) => setBulkTermId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-end pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Generating..." : "Generate"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowBulkGen(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Generation Result */}
      {bulkResult && (
        <div className={`rounded-lg p-3 text-sm ${bulkResult.generated > 0 ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>
          Generated {bulkResult.generated} of {bulkResult.total} invoices.
          {bulkResult.errors.length > 0 && (
            <ul className="mt-1 text-xs list-disc pl-4">
              {bulkResult.errors.map((e, i) => (
                <li key={i}>{e.studentId}: {e.reason}</li>
              ))}
            </ul>
          )}
          <button onClick={() => setBulkResult(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

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
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
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
            {mpesaSent ? (
              <div className="text-center py-6">
                <Smartphone size={40} className="mx-auto text-accent mb-3" />
                <h3 className="text-lg font-semibold text-surface-900 mb-1">M-Pesa STK Push Sent</h3>
                <p className="text-sm text-surface-500 mb-4">
                  Please check the phone and enter your PIN to complete the payment.
                </p>
                <Button variant="secondary" onClick={() => { setShowPayment(false); setMpesaSent(false) }}>
                  Close
                </Button>
              </div>
            ) : (
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
                {payMethod === "mpesa_stk" && (
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="254712345678"
                  />
                )}
                {payMethod !== "mpesa_stk" && (
                  <Input label="Reference" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Optional ref" />
                )}
                <div className="flex gap-2 items-end pb-1">
                  <Button size="sm" type="submit" disabled={saving}>
                    {saving ? "Sending..." : payMethod === "mpesa_stk" ? "Send STK Push" : "Record"}
                  </Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => { setShowPayment(false); setMpesaSent(false) }}>
                    <X size={14} />
                  </Button>
                </div>
              </form>
            )}
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
                {feeStructures.map((fs) => {
                  const categorized = new Map<string, { items: typeof fs.feeItems; subtotal: number }>()
                  fs.feeItems?.forEach((item) => {
                    const cat = categorizeItem(item.name)
                    if (!categorized.has(cat)) categorized.set(cat, { items: [], subtotal: 0 })
                    const entry = categorized.get(cat)!
                    entry.items.push(item)
                    entry.subtotal += item.amount
                  })
                  return (
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
                      {Array.from(categorized.entries()).map(([category, group]) => {
                        const CatIcon = getCategoryIcon(category)
                        return (
                          <div key={category} className="mb-3 last:mb-0">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                              <CatIcon size={12} />
                              {category}
                            </div>
                            <div className="space-y-0.5">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm pl-4">
                                  <span className="text-surface-700">{item.name}</span>
                                  <span className="font-medium text-surface-900">KES {item.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-surface-500 pl-4 pt-0.5 border-t border-surface-50 mt-0.5">
                              <span>Subtotal</span>
                              <span>KES {group.subtotal.toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      })}
                      <div className="mt-3 pt-3 border-t border-surface-100 flex justify-between text-sm font-bold">
                        <span className="text-surface-700">Total</span>
                        <span className="text-surface-900">
                          KES {fs.feeItems?.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-surface-500">Confirmed Payments</p>
                <p className="mt-1 text-2xl font-bold text-surface-900">{confirmedPayments.length}</p>
                <p className="mt-1 text-xs text-surface-400">KES {totalCollectedViaPayments.toLocaleString()} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-surface-500">Pending</p>
                <p className="mt-1 text-2xl font-bold text-warning-600">{payments.filter((p) => p.status === "pending").length}</p>
                <p className="mt-1 text-xs text-surface-400">KES {payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-surface-500">Failed & Reversed</p>
                <p className="mt-1 text-2xl font-bold text-danger-600">{payments.filter((p) => p.status === "failed" || p.status === "reversed").length}</p>
                <p className="mt-1 text-xs text-surface-400">KES {payments.filter((p) => p.status === "failed" || p.status === "reversed").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {methodBreakdown.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-surface-700 mb-3">Payment Methods</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {methodBreakdown.map((m) => (
                    <div key={m.method} className="rounded-lg border border-surface-200 p-3">
                      <div className="flex items-center gap-2 text-sm text-surface-500">
                        {m.method.startsWith("mpesa") ? <Smartphone size={14} /> :
                         m.method === "cash" ? <Banknote size={14} /> :
                         m.method === "bank_transfer" ? <Building size={14} /> :
                         <CreditCard size={14} />}
                        <span>{methodLabels[m.method]}</span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-surface-900">{m.count}</p>
                      <p className="text-xs text-surface-400">KES {m.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-surface-100">
                <h3 className="text-lg font-semibold text-surface-900">Payment History</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <Input type="text" placeholder="Search payments..." value={paySearch} onChange={(e) => setPaySearch(e.target.value)} className="bg-surface-50 border-surface-200 pl-9" />
                  </div>
                  <select value={payMethodFilter} onChange={(e) => setPayMethodFilter(e.target.value)}
                    className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs">
                    <option value="all">All Methods</option>
                    <option value="mpesa_stk">M-Pesa STK</option>
                    <option value="mpesa_c2b">M-Pesa C2B</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="bursary">Bursary</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="credit">Credit</option>
                  </select>
                  <select value={payStatusFilter} onChange={(e) => setPayStatusFilter(e.target.value)}
                    className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs">
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="reversed">Reversed</option>
                  </select>
                  <Button size="sm" variant="secondary" onClick={loadInvoices}><RefreshCw size={14} /></Button>
                </div>
              </div>
              {filteredPayments.length === 0 ? (
                <EmptyState title="No payments" description="No payment records match your filters." />
              ) : (
                <Table
                  columns={[
                    { key: "date", header: "Date", render: (p: Payment) => new Date(p.receivedAt).toLocaleDateString() },
                    { key: "student", header: "Student", render: (p: Payment) => (
                      <span className="font-medium">{p.student?.firstName} {p.student?.lastName}</span>
                    )},
                    { key: "method", header: "Method", render: (p: Payment) => (
                      <span className="flex items-center gap-1.5">
                        {p.method.startsWith("mpesa") ? <Smartphone size={14} /> :
                         p.method === "cash" ? <Banknote size={14} /> :
                         p.method === "bank_transfer" ? <Building size={14} /> :
                         <CreditCard size={14} />}
                        {methodLabels[p.method] || p.method}
                      </span>
                    )},
                    { key: "amount", header: "Amount", render: (p: Payment) => `KES ${p.amount.toLocaleString()}` },
                    { key: "status", header: "Status", render: (p: Payment) => (
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    )},
                    { key: "ref", header: "Ref", render: (p: Payment) => (
                      <span className="text-xs text-surface-400 font-mono">{p.transactionRef || "—"}</span>
                    )},
                  ]}
                  data={filteredPayments}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}