import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { DarajaProvider } from "@/infrastructure/payment/daraja.provider"
import * as repo from "./repository"
import * as studentRepo from "@/modules/students/repository"
import { FinancePolicy } from "./policy"
import { FinanceMapper } from "./mapper"
import { FinanceEvents } from "./events"
import type {
  CreateFeeStructureInput,
  GenerateInvoiceInput,
  GenerateBulkInvoicesInput,
  RecordPaymentInput,
  InitiateMpesaPaymentInput,
  InitiateBulkMpesaPaymentInput,
  MpesaCallbackInput,
} from "./schema"

/**
 * Builds a concise M-Pesa TransactionDesc from the invoice's fee items so the
 * customer sees what they are paying for (e.g. "School Fees", "Field Trip").
 * Daraja limits TransactionDesc to 13 characters.
 */
function buildMpesaDescription(invoice: any): string {
  const feeItems: any[] = invoice?.feeStructure?.feeItems ?? []
  if (feeItems.length === 0) return "School Fees".substring(0, 13)
  // Join the most relevant fee item names, trimmed to 13 chars.
  const names = feeItems.map((i) => i.name).join(" ")
  return names.substring(0, 13)
}

/**
 * Builds a bulk M-Pesa TransactionDesc from the student's invoices' fee items.
 * Daraja limits TransactionDesc to 13 characters.
 */
function buildBulkMpesaDescription(invoices: any[]): string {
  const feeItemNames = new Set<string>()
  for (const inv of invoices) {
    const feeItems: any[] = inv?.feeStructure?.feeItems ?? []
    for (const item of feeItems) feeItemNames.add(item.name)
  }
  if (feeItemNames.size === 0) return "School Fees".substring(0, 13)
  return Array.from(feeItemNames).join(" ").substring(0, 13)
}

export async function listFeeStructures(schoolId: string) {
  const structures = await repo.findFeeStructures(schoolId)
  return structures.map(FinanceMapper.toFeeStructureDTO)
}

export async function createFeeStructure(schoolId: string, data: CreateFeeStructureInput) {
  const term = await repo.findTermById(schoolId, data.termId)
  FinancePolicy.canCreateFeeStructure(term)

  if (data.classId) {
    const classInstance = await repo.findClassById(schoolId, data.classId)
    FinancePolicy.canCreateFeeStructureForClass(classInstance)
  }

  const structure = await repo.createFeeStructure({
    schoolId,
    academicYearId: data.academicYearId,
    termId: data.termId,
    classId: data.classId ?? null,
    isGlobal: data.isGlobal ?? false,
    isLatest: true,
    items: data.items,
  })
  return FinanceMapper.toFeeStructureDTO(structure)
}

export async function generateInvoice(schoolId: string, data: GenerateInvoiceInput) {
  const student = await repo.findStudentById(schoolId, data.studentId)
  const feeStructure = await repo.findFeeStructureById(schoolId, data.feeStructureId)
  
  FinancePolicy.canGenerateInvoice(student, feeStructure)

  const totalAmount = feeStructure!.feeItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0)

  const invoice = await repo.createInvoice({
    schoolId,
    studentId: data.studentId,
    enrollmentId: data.enrollmentId ?? null,
    termId: data.termId,
    feeStructureId: data.feeStructureId,
    totalAmount,
    paidAmount: 0,
    balance: totalAmount,
    status: "issued",
  })

  // Apply any existing student credit balance as a pre-payment.
  const credit = await studentRepo.getStudentCreditBalance(data.studentId)
  if (credit > 0) {
    const applied = Math.min(credit, totalAmount)
    const remainingCredit = credit - applied
    await prisma.$transaction(async (tx: any) => {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: { increment: applied },
          balance: { decrement: applied },
          status: applied >= totalAmount ? "paid" : "partially_paid",
        },
      })
      await tx.payment.create({
        data: {
          schoolId,
          studentId: data.studentId,
          method: "credit",
          type: "credit",
          status: "confirmed",
          transactionRef: `credit-prepaid-${invoice.id}`,
          amount: applied,
          metadata: { appliedToInvoiceId: invoice.id, isCreditPrePayment: true },
        },
      })
      await tx.paymentAllocation.create({
        data: {
          schoolId,
          paymentId: (await tx.payment.findFirst({
            where: { transactionRef: `credit-prepaid-${invoice.id}`, studentId: data.studentId },
            orderBy: { createdAt: "desc" },
          })).id,
          invoiceId: invoice.id,
          studentId: data.studentId,
          amount: applied,
        },
      })
      await tx.student.update({
        where: { id: data.studentId },
        data: { creditBalance: remainingCredit },
      })
    })
    // Refresh invoice after credit application
    const updated = await repo.findInvoiceById(schoolId, invoice.id)
    await FinanceEvents.invoiceGenerated(schoolId, invoice.id, { studentId: data.studentId, amount: totalAmount, creditApplied: applied })
    return FinanceMapper.toInvoiceDTO(updated)
  }

  await FinanceEvents.invoiceGenerated(schoolId, invoice.id, { studentId: data.studentId, amount: totalAmount })

  return FinanceMapper.toInvoiceDTO(invoice)
}

export async function generateBulkInvoices(schoolId: string, data: GenerateBulkInvoicesInput) {
  const feeStructure = await repo.findFeeStructureById(schoolId, data.feeStructureId)
  FinancePolicy.canGenerateInvoice({ status: "active" }, feeStructure)

  const enrollments = await repo.findActiveStudentsByClassId(schoolId, data.classId)
  if (enrollments.length === 0) {
    throw AppError.notFound("No active students found in this class")
  }

  const totalAmount = feeStructure!.feeItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
  const results: any[] = []
  const errors: { studentId: string; reason: string }[] = []

  for (const enrollment of enrollments) {
    const student = enrollment.student
    if (!student || student.status !== "active") {
      errors.push({ studentId: student?.id ?? "unknown", reason: "Student not active" })
      continue
    }

    const existing = await repo.findExistingInvoice(schoolId, student.id, data.termId, data.feeStructureId)
    if (existing) {
      errors.push({ studentId: student.id, reason: "Invoice already exists for this term/student" })
      continue
    }

    const invoice = await repo.createInvoice({
      schoolId,
      studentId: student.id,
      enrollmentId: enrollment.id,
      termId: data.termId,
      feeStructureId: data.feeStructureId,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      status: "issued",
    })

    await FinanceEvents.invoiceGenerated(schoolId, invoice.id, { studentId: student.id, amount: totalAmount })
    results.push(FinanceMapper.toInvoiceDTO(invoice))
  }

  return { generated: results.length, total: enrollments.length, errors, invoices: results }
}

export async function listInvoices(schoolId: string, studentId?: string) {
  const invoices = await repo.findInvoices(schoolId, studentId)
  return invoices.map(FinanceMapper.toInvoiceDTO)
}

export async function listGuardianInvoices(schoolId: string, studentId: string, userId: string) {
  const link = await repo.findGuardianStudentLink(schoolId, studentId, userId)
  FinancePolicy.canViewGuardianInvoices(link)
  const invoices = await repo.findInvoices(schoolId, studentId)
  return invoices.map(FinanceMapper.toInvoiceDTO)
}

export async function getInvoice(schoolId: string, invoiceId: string) {
  const invoice = await repo.findInvoiceById(schoolId, invoiceId)
  if (!invoice) throw AppError.notFound("Invoice not found")
  return FinanceMapper.toInvoiceDTO(invoice)
}

export async function recordPayment(schoolId: string, authUser: { membershipId?: string }, data: RecordPaymentInput) {
  const invoice = await repo.findInvoiceById(schoolId, data.invoiceId)
  FinancePolicy.canPayInvoice(invoice, data.amount)

  const result = await prisma.$transaction(async (tx: any) => {
    const payment = await tx.payment.create({
      data: {
        schoolId,
        studentId: data.studentId,
        invoiceId: data.invoiceId,
        payerId: data.payerId ?? null,
        createdByMembershipId: authUser.membershipId ?? null,
        method: data.method,
        type: "fee",
        status: "confirmed",
        transactionRef: data.transactionRef,
        amount: data.amount,
      },
    })

    await tx.paymentAllocation.create({
      data: {
        schoolId,
        paymentId: payment.id,
        invoiceId: data.invoiceId,
        studentId: data.studentId,
        amount: data.amount,
      },
    })

    const updatedInvoice = await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: { increment: data.amount },
        balance: { decrement: data.amount },
      },
    })

    if (Number(updatedInvoice.balance) <= 0) {
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { status: "paid", paidAmount: updatedInvoice.totalAmount, balance: 0 },
      })
    } else if (Number(updatedInvoice.paidAmount) > 0) {
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { status: "partially_paid" },
      })
    }

    return payment
  })

  await FinanceEvents.paymentReceived(schoolId, result.id, { invoiceId: data.invoiceId, amount: data.amount, method: data.method })

  const savedPayment = await repo.findPaymentById(schoolId, result.id)
  return FinanceMapper.toPaymentDTO(savedPayment)
}

export async function listPayments(schoolId: string, studentId?: string) {
  const payments = await repo.findPayments(schoolId, studentId)
  return payments.map(FinanceMapper.toPaymentDTO)
}

export async function initiateMpesaPayment(schoolId: string, data: InitiateMpesaPaymentInput, authUser?: any) {
  const invoice = await repo.findInvoiceById(schoolId, data.invoiceId)
  FinancePolicy.canPayInvoice(invoice, data.amount)

  if (authUser) {
    await FinancePolicy.assertGuardianOwnsStudent(schoolId, invoice!.studentId, authUser)
  }

  const student = invoice!.student
  const accountReference = student.admissionNumber.substring(0, 12)
  const transactionDesc = buildMpesaDescription(invoice!)

  // Initiate STK Push via Daraja
  const darajaResponse = await DarajaProvider.initiateStkPush({
    phoneNumber: data.phoneNumber,
    amount: data.amount,
    accountReference,
    transactionDesc,
  })

  // Log the pending payment request with Audit Log atomically
  const pendingPayment = await prisma.$transaction(async (tx: any) => {
    const p = await tx.payment.create({
      data: {
        schoolId,
        studentId: student.id,
        invoiceId: invoice!.id,
        method: "mpesa_stk",
        type: "fee",
        status: "pending",
        provider: "daraja",
        transactionRef: darajaResponse.CheckoutRequestID,
        amount: data.amount,
      }
    })

    await tx.financialAuditLog.create({
      data: {
        schoolId,
        paymentId: p.id,
        invoiceId: invoice!.id,
        studentId: student.id,
        actionDescription: `M-Pesa STK push initiated for ${transactionDesc} - KES ${data.amount}`,
        metadata: { amount: data.amount, phone: data.phoneNumber, invoiceId: invoice!.id },
      }
    })
    return p
  })

  return { checkoutRequestId: darajaResponse.CheckoutRequestID, paymentId: pendingPayment.id }
}

export async function initiateBulkMpesaPayment(schoolId: string, data: InitiateBulkMpesaPaymentInput, authUser?: any) {
  if (authUser) {
    await FinancePolicy.assertGuardianOwnsStudent(schoolId, data.studentId, authUser)
  }

  const accountReference = "BULK_PAY".substring(0, 12)
  const studentInvoices = await repo.findInvoices(schoolId, data.studentId)
  const transactionDesc = buildBulkMpesaDescription(studentInvoices)

  // Initiate STK Push via Daraja
  const darajaResponse = await DarajaProvider.initiateStkPush({
    phoneNumber: data.phoneNumber,
    amount: data.totalAmount,
    accountReference,
    transactionDesc,
  })

  // Log the pending payment request with Bulk Allocation Metadata
  const pendingPayment = await prisma.$transaction(async (tx: any) => {
    const p = await tx.payment.create({
      data: {
        schoolId,
        studentId: data.studentId,
        method: "mpesa_stk",
        type: "fee",
        status: "pending",
        provider: "daraja",
        transactionRef: darajaResponse.CheckoutRequestID,
        amount: data.totalAmount,
        metadata: {
          isBulk: true,
          allocations: data.allocations,
        }
      }
    })

    await tx.financialAuditLog.create({
      data: {
        schoolId,
        paymentId: p.id,
        studentId: data.studentId,
        actionDescription: `Bulk M-Pesa STK push initiated for ${transactionDesc} - KES ${data.totalAmount}`,
        metadata: { amount: data.totalAmount, phone: data.phoneNumber, allocations: data.allocations },
      }
    })
    return p
  })

  return { checkoutRequestId: darajaResponse.CheckoutRequestID, paymentId: pendingPayment.id }
}

/**
 * Resolves an STK callback result against the pending payment it belongs to.
 * Shared by the Safaricom webhook and the STK reconciliation job.
 *
 * `result` carries the authoritative data reported by Safaricom:
 *   - resultCode / resultDesc
 *   - receipt (MpesaReceiptNumber) + phone + gatewayAmount (for successes)
 * `source` is "callback" (webhook) or "reconciler" (poller).
 */
export async function resolveStkResult(checkoutRequestId: string, result: {
  resultCode: number
  resultDesc: string
  merchantRequestId?: string
  receipt?: string
  phoneNumber?: string
  gatewayAmount?: number
  transactionDate?: string
  raw?: any
  source?: string
}) {
  const payment = await repo.findPendingPaymentByCheckoutRequestId(checkoutRequestId)

  if (!payment) {
    console.warn(`[FinanceService] STK ${result.source || "callback"}: no pending payment for CheckoutRequestID ${checkoutRequestId}`)
    return
  }

  // Idempotency: if already resolved by an earlier callback/reconciler, skip.
  if (payment.status !== "pending") {
    console.info(`[FinanceService] STK ${result.source || "callback"}: payment ${payment.id} already ${payment.status}; ignoring duplicate.`)
    return
  }

  const schoolId = payment.schoolId
  const isSuccess = result.resultCode === 0

  if (!isSuccess) {
    await prisma.$transaction(async (tx: any) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          metadata: {
            ...(payment.metadata as object),
            resultCode: result.resultCode,
            resultDesc: result.resultDesc,
            merchantRequestId: result.merchantRequestId,
            failedAt: new Date().toISOString(),
            raw: result.raw,
          } as any,
        },
      })
      await tx.financialAuditLog.create({
        data: {
          schoolId,
          paymentId: payment.id,
          studentId: payment.studentId,
          invoiceId: payment.invoiceId,
          actionDescription: `M-Pesa STK push failed (${result.resultCode}): ${result.resultDesc}`,
          metadata: { reason: result.resultDesc, resultCode: result.resultCode, source: result.source },
        },
      })
    })
    return
  }

  const receipt = result.receipt || checkoutRequestId

  // Duplicate receipt guard: never double-allocate the same receipt.
  const existing = await repo.findConfirmedByReceipt(schoolId, receipt)
  if (existing) {
    console.warn(`[FinanceService] STK ${result.source || "callback"}: receipt ${receipt} already confirmed on payment ${existing.id}; marking ${payment.id} failed to avoid double capture.`)
    await repo.markPaymentStatus(payment.id, "failed", {
      metadata: {
        ...(payment.metadata as object),
        duplicateReceipt: receipt,
        resultDesc: result.resultDesc,
      } as any,
    })
    return
  }

  // Trust the amount Safaricom actually reports.
  const requestedAmount = Number(payment.amount)
  const gatewayAmount = typeof result.gatewayAmount === "number" && result.gatewayAmount > 0
    ? Number(result.gatewayAmount)
    : requestedAmount
  const amountMismatch = Math.abs(gatewayAmount - requestedAmount) > 0.001

  const confirmResult = await prisma.$transaction(async (tx: any) => {
    const confirmedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "confirmed",
        transactionRef: String(receipt),
        metadata: {
          ...(payment.metadata as object),
          resultCode: result.resultCode,
          resultDesc: result.resultDesc,
          merchantRequestId: result.merchantRequestId,
          gatewayAmount,
          phoneNumber: result.phoneNumber,
          transactionDate: result.transactionDate,
          amountMismatch,
          raw: result.raw,
        } as any,
        receivedAt: new Date(),
      },
    })

    const metadata = payment.metadata as any
    const isBulk = metadata?.isBulk === true
    let allocations = isBulk ? metadata.allocations : [{ invoiceId: payment.invoiceId, amount: payment.amount }]

    // Total amount to allocate = actual gateway amount paid.
    let remaining = gatewayAmount

    // FIFO allocation across the selected invoices.
    const applied: any[] = []
    for (const alloc of allocations) {
      if (remaining <= 0) break
      const toApply = Math.min(Number(alloc.amount), remaining)
      if (toApply <= 0) continue
      applied.push({ invoiceId: alloc.invoiceId, amount: toApply })
      remaining -= toApply
    }

    // Any leftover after allocations is a surplus → student credit balance.
    if (remaining > 0.001) {
      applied.push({ invoiceId: null, amount: remaining })
    }

    for (const alloc of applied) {
      if (!alloc.invoiceId) {
        await tx.payment.create({
          data: {
            schoolId,
            studentId: payment.studentId,
            method: payment.method,
            type: "credit",
            status: "confirmed",
            provider: payment.provider,
            transactionRef: String(receipt),
            amount: alloc.amount,
            metadata: { ...(payment.metadata as object), isOverpaymentCredit: true, parentPaymentId: payment.id } as any,
            receivedAt: new Date(),
          },
        })
        await tx.student.update({
          where: { id: payment.studentId },
          data: { creditBalance: { increment: alloc.amount } },
        })
        continue
      }

      await tx.paymentAllocation.create({
        data: {
          schoolId,
          paymentId: payment.id,
          invoiceId: alloc.invoiceId,
          studentId: payment.studentId,
          amount: alloc.amount,
        },
      })

      const invoice = await tx.invoice.update({
        where: { id: alloc.invoiceId },
        data: {
          paidAmount: { increment: alloc.amount },
          balance: { decrement: alloc.amount },
        },
      })

      if (Number(invoice.balance) <= 0) {
        await tx.invoice.update({
          where: { id: alloc.invoiceId },
          data: { status: "paid", paidAmount: invoice.totalAmount, balance: 0 },
        })
      } else if (Number(invoice.paidAmount) > 0) {
        await tx.invoice.update({
          where: { id: alloc.invoiceId },
          data: { status: "partially_paid" },
        })
      }
    }

    await tx.financialAuditLog.create({
      data: {
        schoolId,
        paymentId: payment.id,
        studentId: payment.studentId,
        invoiceId: payment.invoiceId,
        actionDescription: `M-Pesa STK push confirmed - receipt ${String(receipt)} (gateway amount ${gatewayAmount})`,
        metadata: {
          receipt: String(receipt),
          requestedAmount,
          gatewayAmount,
          amountMismatch,
          phone: result.phoneNumber,
          isBulk,
          source: result.source,
        },
      },
    })

    return confirmedPayment
  })

  await FinanceEvents.paymentReceived(schoolId, confirmResult.id, {
    invoiceId: payment.invoiceId,
    amount: gatewayAmount,
    method: payment.method,
  })
}

export async function processMpesaCallback(payload: MpesaCallbackInput) {
  const { stkCallback } = payload.Body
  const checkoutRequestId = stkCallback.CheckoutRequestID

  const metadataItems = stkCallback.CallbackMetadata?.Item || []
  const getItem = (name: string) => metadataItems.find((i: any) => i.Name === name)?.Value

  const receipt = getItem("MpesaReceiptNumber")
  const phoneNumber = getItem("PhoneNumber")
  const gatewayAmount = getItem("Amount")
  const transactionDate = getItem("TransactionDate")

  await resolveStkResult(checkoutRequestId, {
    resultCode: stkCallback.ResultCode,
    resultDesc: stkCallback.ResultDesc,
    merchantRequestId: stkCallback.MerchantRequestID,
    receipt,
    phoneNumber,
    gatewayAmount,
    transactionDate,
    raw: payload,
    source: "callback",
  })
}

/**
 * Safaricom sends a `Transaction Reversal` (chargeback / timeout reversal) to
 * the C2B confirmation URL. The original receipt is reported as
 * `OrigTransactionID`. We must undo the original confirmation so the invoice
 * balance and the student's credit balance stay correct — otherwise the school
 * would show fees as paid for money that was actually reversed.
 */
export async function processMpesaReversal(payload: any) {
  const txn = payload?.Transaction || payload?.Body?.stkCallback || payload
  const transactionType = txn?.TransactionType
  const origReceipt = txn?.OrigTransactionID || txn?.TransactionID

  if (transactionType && transactionType !== "Transaction Reversal") {
    // Not a reversal (e.g. a normal C2B payment). Acknowledge and ignore.
    return { handled: false, reason: "not_a_reversal" }
  }
  if (!origReceipt) {
    console.warn("[FinanceService] M-Pesa reversal: missing OrigTransactionID; ignoring.")
    return { handled: false, reason: "missing_orig_transaction" }
  }

  // The reversal webhook is school-scoped via the route param when available.
  const scopedSchoolId: string | undefined = payload?.__schoolId
  const payment = scopedSchoolId
    ? await repo.findConfirmedWithAllocations(scopedSchoolId, origReceipt)
    : await findAcrossSchools(origReceipt)

  if (!payment) {
    console.warn(`[FinanceService] M-Pesa reversal: no confirmed payment for receipt ${origReceipt}`)
    return { handled: false, reason: "no_confirmed_payment" }
  }

  const sid = payment.schoolId

  // Idempotency: never reverse the same receipt twice.
  const meta = payment.metadata as any
  if (meta?.reversalHandled) {
    console.info(`[FinanceService] M-Pesa reversal: receipt ${origReceipt} already reversed; skipping.`)
    return { handled: true, alreadyReversed: true }
  }

  await prisma.$transaction(async (tx: any) => {
    // 1. Reverse each invoice allocation and recompute the invoice state.
    for (const alloc of payment.allocations as any[]) {
      const inv = await tx.invoice.findUnique({ where: { id: alloc.invoiceId } })
      if (!inv) continue
      const newPaid = Number(inv.paidAmount) - Number(alloc.amount)
      const newBalance = Number(inv.totalAmount) - newPaid
      const newStatus =
        newPaid <= 0 ? "issued" : newBalance <= 0.001 ? "paid" : "partially_paid"
      await tx.invoice.update({
        where: { id: alloc.invoiceId },
        data: {
          paidAmount: Math.max(0, newPaid),
          balance: Math.max(0, newBalance),
          status: newStatus,
        },
      })
    }

    // 2. Remove the allocation rows (kept only for the now-reversed payment).
    await tx.paymentAllocation.deleteMany({ where: { paymentId: payment.id } })

    // 3. If the original surplus created a credit payment, reclaim it.
    for (const credit of payment.reversalPayments as any[]) {
      const creditAmount = Number(credit.amount)
      if (creditAmount > 0) {
        await tx.student.update({
          where: { id: payment.studentId },
          data: { creditBalance: { decrement: creditAmount } },
        })
        await tx.payment.update({
          where: { id: credit.id },
          data: { status: "reversed" },
        })
      }
    }

    // 4. Mark the original payment as reversed.
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "reversed",
        metadata: {
          ...meta,
          reversalHandled: true,
          reversalAt: new Date().toISOString(),
          reversalRaw: payload,
        } as any,
      },
    })

    await tx.financialAuditLog.create({
      data: {
        schoolId: sid,
        paymentId: payment.id,
        studentId: payment.studentId,
        invoiceId: payment.invoiceId,
        actionDescription: `M-Pesa transaction reversed (OrigTransactionID ${origReceipt})`,
        metadata: {
          origReceipt,
          reversalType: transactionType || "Transaction Reversal",
          amount: Number(payment.amount),
        },
      },
    })
  })

  await FinanceEvents.paymentReversed(sid, payment.id, {
    origReceipt,
    amount: Number(payment.amount),
  })

  return { handled: true, paymentId: payment.id }
}

/**
 * When the reversal webhook cannot be scoped to a single school (e.g. a shared
 * callback URL), search every school for the confirmed receipt. Reversals are
 * rare, so a cross-school scan is acceptable.
 */
async function findAcrossSchools(receipt: string) {
  const matches = await prisma.payment.findMany({
    where: { transactionRef: String(receipt), status: "confirmed", method: "mpesa_stk" },
    include: {
      allocations: true,
      reversalPayments: { where: { type: "credit", status: "confirmed" } },
      student: { select: { id: true, creditBalance: true } },
    },
    take: 1,
  })
  return matches[0] || null
}
