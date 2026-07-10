import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import * as repo from "./repository"
import type { CreateFeeStructureInput, GenerateInvoiceInput, RecordPaymentInput } from "./schema"

export async function listFeeStructures(schoolId: string) {
  return repo.findFeeStructures(schoolId)
}

export async function createFeeStructure(schoolId: string, data: CreateFeeStructureInput) {
  const term = await repo.findTermById(schoolId, data.termId)
  if (!term) throw AppError.notFound("Term not found")

  return repo.createFeeStructure({
    schoolId,
    academicYearId: data.academicYearId,
    termId: data.termId,
    classId: data.classId ?? null,
    isGlobal: data.isGlobal ?? false,
    isLatest: true,
    items: data.items,
  })
}

export async function generateInvoice(schoolId: string, data: GenerateInvoiceInput) {
  const student = await repo.findStudentById(schoolId, data.studentId)
  if (!student) throw AppError.notFound("Student not found")

  const feeStructure = await repo.findFeeStructureById(schoolId, data.feeStructureId)
  if (!feeStructure) throw AppError.notFound("Fee structure not found")

  const totalAmount = feeStructure.feeItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0)

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

  await writeEventOutbox({
    schoolId,
    aggregateId: invoice.id,
    aggregateType: "invoice",
    eventType: "InvoiceGenerated",
    payload: { studentId: data.studentId, amount: totalAmount },
  })

  return invoice
}

export async function listInvoices(schoolId: string, studentId?: string) {
  return repo.findInvoices(schoolId, studentId)
}

export async function getInvoice(schoolId: string, invoiceId: string) {
  const invoice = await repo.findInvoiceById(schoolId, invoiceId)
  if (!invoice) throw AppError.notFound("Invoice not found")
  return invoice
}

export async function recordPayment(schoolId: string, authUser: { membershipId?: string }, data: RecordPaymentInput) {
  const invoice = await repo.findInvoiceById(schoolId, data.invoiceId)
  if (!invoice) throw AppError.notFound("Invoice not found")
  if (invoice.status === "paid" || invoice.status === "cancelled") {
    throw AppError.conflict("Invoice is already paid or cancelled")
  }

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

  await writeEventOutbox({
    schoolId,
    aggregateId: result.id,
    aggregateType: "payment",
    eventType: "PaymentReceived",
    payload: { invoiceId: data.invoiceId, amount: data.amount, method: data.method },
  })

  return repo.findPaymentById(schoolId, result.id)
}

export async function listPayments(schoolId: string, studentId?: string) {
  return repo.findPayments(schoolId, studentId)
}
