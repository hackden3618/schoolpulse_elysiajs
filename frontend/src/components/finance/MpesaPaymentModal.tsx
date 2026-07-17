import { useState, useEffect } from "react"
import { X, Smartphone, Check, Loader2, AlertCircle } from "lucide-react"
import { financeApi } from "../../lib/api"
import { withMinDelay, normalizePhone } from "../../lib/ux"
import { useAuth } from "../../lib/auth-context"
import type { Invoice } from "../../types"

interface MpesaPaymentModalProps {
  invoice: Invoice
  guardianPhone?: string
  studentName: string
  onClose: () => void
  onSuccess?: () => void
}

type Step = "input" | "waiting" | "success" | "error"

export function MpesaPaymentModal({ invoice, guardianPhone, studentName, onClose, onSuccess }: MpesaPaymentModalProps) {
  const { school } = useAuth()
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState(String(Number(invoice.outstanding ?? invoice.totalAmount)))
  const [step, setStep] = useState<Step>("input")
  const [error, setError] = useState("")

  const outstanding = Number(invoice.outstanding ?? invoice.totalAmount)
  const parsedAmount = Number(amount)
  const isValidAmount = parsedAmount > 0 && parsedAmount <= outstanding

  const handleAutofill = () => {
    if (guardianPhone) setPhone(guardianPhone)
  }

  const handleSubmit = async () => {
    if (!phone || !isValidAmount) return
    setError("")
    setStep("waiting")

    try {
      await withMinDelay(financeApi.payments.initiateMpesa(school!.id, {
        invoiceId: invoice.id,
        phoneNumber: normalizePhone(phone),
        amount: parsedAmount,
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
        {/* Header */}
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
          <div className="mt-1">
            <span className="text-3xl font-bold">KES {outstanding.toLocaleString()}</span>
            <span className="text-emerald-200 text-sm ml-2">outstanding</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 -mt-4">
          <div className="bg-white rounded-xl border border-surface-100 shadow-sm p-4 space-y-4">
            {step === "input" && (
              <>
                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    max={outstanding}
                    min={1}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter amount"
                  />
                  {!isValidAmount && amount !== "" && (
                    <p className="text-xs text-danger-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Amount must be between KES 1 and {outstanding.toLocaleString()}
                    </p>
                  )}
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
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <p className="text-xs text-surface-400">
                  The customer will receive a push notification on their phone to authorize the payment.
                </p>

                <button
                  onClick={handleSubmit}
                  disabled={!phone || !isValidAmount}
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
                <p className="text-sm text-surface-500">We're waiting for confirmation from Safaricom. The invoice will update automatically.</p>
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
