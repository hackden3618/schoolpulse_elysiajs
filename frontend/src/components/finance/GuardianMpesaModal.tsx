import { useState } from "react"
import { X, Smartphone, Check, Loader2, AlertCircle, ChevronDown } from "lucide-react"
import { financeApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { withMinDelay, normalizePhone } from "../../lib/ux"
import type { Invoice } from "../../types"

interface GuardianMpesaModalProps {
  invoices: Invoice[]
  studentId: string
  studentName: string
  guardianPhone?: string
  preselectedIds?: string[] | null
  onClose: () => void
  onSuccess?: () => void
}

type Step = "input" | "waiting" | "success" | "error"

function outstandingOf(inv: Invoice): number {
  return Number(inv.outstanding ?? inv.balance)
}

function money(value: number): string {
  return `KES ${Number(value || 0).toLocaleString()}`
}

/**
 * Distributes `amount` across the selected invoices, oldest first (FIFO).
 * Returns allocations plus any surplus (overpayment) as a credit allocation.
 */
function allocateFifo(selected: Invoice[], amount: number) {
  const ordered = [...selected].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  const allocations: { invoiceId: string; amount: number }[] = []
  let remaining = amount
  for (const inv of ordered) {
    if (remaining <= 0) break
    const allocated = Math.min(remaining, outstandingOf(inv))
    if (allocated > 0) {
      allocations.push({ invoiceId: inv.id, amount: allocated })
      remaining -= allocated
    }
  }
  return { allocations, surplus: remaining }
}

export function GuardianMpesaModal({
  invoices,
  studentId,
  studentName,
  guardianPhone,
  preselectedIds,
  onClose,
  onSuccess,
}: GuardianMpesaModalProps) {
  const { school } = useAuth()
  const unpaid = invoices.filter((inv) => outstandingOf(inv) > 0)

  const initialIds =
    preselectedIds && preselectedIds.length > 0
      ? unpaid.filter((i) => preselectedIds.includes(i.id)).map((i) => i.id)
      : unpaid.map((i) => i.id)

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds)
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<Step>("input")
  const [error, setError] = useState("")

  const selected = unpaid.filter((inv) => selectedIds.includes(inv.id))
  const selectedTotal = selected.reduce((s, inv) => s + outstandingOf(inv), 0)
  const parsedAmount = Number(amount)
  const isValidAmount = parsedAmount > 0

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAutofill = () => {
    if (guardianPhone) setPhone(guardianPhone)
  }

  const handleSubmit = async () => {
    if (!phone || !isValidAmount || selected.length === 0) return
    setError("")
    setStep("waiting")

    const { allocations, surplus } = allocateFifo(selected, parsedAmount)
    const finalAllocations = surplus > 0
      ? [...allocations, { invoiceId: "", amount: surplus }]
      : allocations

    try {
      await withMinDelay(financeApi.payments.initiateBulkMpesa(school!.id, {
        studentId,
        allocations: finalAllocations,
        phoneNumber: normalizePhone(phone),
        totalAmount: parsedAmount,
      }))
      setStep("success")
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment")
      setStep("error")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 pt-6 pb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone size={20} />
              <span className="font-semibold text-sm tracking-wide uppercase">M-Pesa Payment</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-emerald-100 text-sm">{studentName}</p>
          <p className="text-emerald-200 text-xs mt-2">Select what you want to pay for, then enter an amount.</p>
        </div>

        <div className="px-6 py-5 -mt-4">
          <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-4 space-y-4">
            {step === "input" && (
              <>
                {/* Selectable invoice list */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-2">
                    What are you paying for?
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {unpaid.map((inv) => {
                      const checked = selectedIds.includes(inv.id)
                      const label =
                        inv.feeStructure?.feeItems?.map((i: any) => i.name).join(", ") ||
                        inv.term?.name ||
                        "Fee"
                      return (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => toggle(inv.id)}
                          className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            checked
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-surface-200 bg-surface-50 hover:bg-surface-100"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                checked ? "bg-emerald-600 border-emerald-600" : "border-surface-300"
                              }`}
                            >
                              {checked && <Check size={11} className="text-white" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-surface-900 truncate">
                                {label}
                              </span>
                              <span className="block text-xs text-surface-500">
                                {money(outstandingOf(inv))} outstanding
                              </span>
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-surface-400 mt-2">
                    Selected total: <strong>{money(selectedTotal)}</strong>
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">Amount to Pay (KES) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={1}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-surface-400 mt-1">
                    Any amount above the selected balance is applied as credit.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">M-Pesa Phone Number *</label>
                  {guardianPhone && (
                    <button
                      type="button"
                      onClick={handleAutofill}
                      className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <Smartphone size={13} />
                      Use registered number: {guardianPhone}
                    </button>
                  )}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!phone || !isValidAmount || selected.length === 0}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send STK Push
                </button>
              </>
            )}

            {step === "waiting" && (
              <div className="flex flex-col items-center py-6 gap-4 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Smartphone size={28} className="text-emerald-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Loader2 size={12} className="text-white animate-spin" />
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-surface-900">Check your phone</p>
                  <p className="text-sm text-surface-500 mt-1">An M-Pesa prompt has been sent to <strong>{phone}</strong>. Enter your PIN to complete the payment.</p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check size={28} className="text-emerald-600" />
                </div>
                <p className="font-semibold text-surface-900">Payment Initiated</p>
                <p className="text-sm text-surface-500">We're waiting for confirmation from Safaricom. The invoices will update automatically.</p>
              </div>
            )}

            {step === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-14 w-14 rounded-full bg-danger-50 flex items-center justify-center">
                    <AlertCircle size={26} className="text-danger-500" />
                  </div>
                  <p className="font-semibold text-surface-900">Payment Failed</p>
                  <p className="text-sm text-danger-600">{error}</p>
                </div>
                <button
                  onClick={() => setStep("input")}
                  className="w-full py-2.5 rounded-lg border border-surface-200 text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
