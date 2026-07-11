import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { DarajaProvider } from "@/infrastructure/payment/daraja.provider"
import * as repo from "./repository"
import { FinancePolicy } from "./policy"
import { FinanceMapper } from "./mapper"
import { FinanceEvents } from "./events"
import type { CreateFeeStructureInput, GenerateInvoiceInput, RecordPaymentInput, InitiateMpesaPaymentInput, MpesaCallbackInput } from "./schema"

export async function listFeeStructures(schoolId: string) {
  const structures = await repo.findFeeStructures(schoolId)
  return structures.map(FinanceMapper.toFeeStructureDTO)
}

export async function createFeeStructure(schoolId: string, data: CreateFeeStructureInput) {
  const term = await repo.findTermById(schoolId, data.termId)
  FinancePolicy.canCreateFeeStructure(term)

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

  await FinanceEvents.invoiceGenerated(schoolId, invoice.id, { studentId: data.studentId, amount: totalAmount })

  return FinanceMapper.toInvoiceDTO(invoice)
}

export async function listInvoices(schoolId: string, studentId?: string) {
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

export async function initiateMpesaPayment(schoolId: string, data: InitiateMpesaPaymentInput) {
  const invoice = await repo.findInvoiceById(schoolId, data.invoiceId)
  FinancePolicy.canPayInvoice(invoice, data.amount)

  const student = invoice!.student
  const accountReference = student.admissionNumber.substring(0, 12)
  const transactionDesc = `Fee ${student.firstName}`.substring(0, 13)

  // Initiate STK Push via Daraja
  const darajaResponse = await DarajaProvider.initiateStkPush({
    phoneNumber: data.phoneNumber,
    amount: data.amount,
    accountReference,
    transactionDesc,
  })

  // Log the pending payment request
  const pendingPayment = await repo.createPayment({
    schoolId,
    studentId: student.id,
    invoiceId: invoice!.id,
    method: "mpesa_stk",
    type: "fee",
    status: "pending",
    provider: "daraja",
    transactionRef: darajaResponse.CheckoutRequestID, // Store CheckoutRequestID here temporarily
    amount: data.amount,
  })

  return { checkoutRequestId: darajaResponse.CheckoutRequestID, paymentId: pendingPayment.id }
}

export async function processMpesaCallback(payload: MpesaCallbackInput) {
  const { stkCallback } = payload.Body
  const checkoutRequestId = stkCallback.CheckoutRequestID

  // Find the pending payment
  const payment = await repo.findPendingPaymentByCheckoutRequestId(checkoutRequestId)
  
  if (!payment) {
    console.warn(`[FinanceService] M-Pesa Callback: Pending payment not found for CheckoutRequestID ${checkoutRequestId}`)
    return
  }

  const schoolId = payment.schoolId
  const isSuccess = stkCallback.ResultCode === 0

  if (!isSuccess) {
    // Payment failed or was cancelled by user
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        metadata: payload as any,
      },
    })
    return
  }

  // Payment was successful
  const metadataItems = stkCallback.CallbackMetadata?.Item || []
  const mpesaReceiptObj = metadataItems.find((i: any) => i.Name === "MpesaReceiptNumber")
  const mpesaReceiptNumber = mpesaReceiptObj ? mpesaReceiptObj.Value : checkoutRequestId

  const result = await prisma.$transaction(async (tx: any) => {
    // Update Payment to confirmed
    const confirmedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "confirmed",
        transactionRef: String(mpesaReceiptNumber),
        metadata: payload as any,
        receivedAt: new Date(),
      },
    })

    // Allocate payment
    await tx.paymentAllocation.create({
      data: {
        schoolId,
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        studentId: payment.studentId,
        amount: payment.amount,
      },
    })

    // Update Invoice balance
    const invoice = await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: { increment: payment.amount },
        balance: { decrement: payment.amount },
      },
    })

    if (Number(invoice.balance) <= 0) {
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: "paid", paidAmount: invoice.totalAmount, balance: 0 },
      })
    } else if (Number(invoice.paidAmount) > 0) {
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: "partially_paid" },
      })
    }

    return confirmedPayment
  })

  // Emit Event
  await FinanceEvents.paymentReceived(schoolId, result.id, { 
    invoiceId: payment.invoiceId, 
    amount: payment.amount, 
    method: payment.method 
  })
}
