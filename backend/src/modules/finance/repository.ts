import { prisma } from "@/infrastructure/database/prisma"

const feeStructureInclude = {
  academicYear: true,
  term: true,
  class: true,
  feeItems: true,
} as const

const invoiceInclude = {
  student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } },
  term: true,
  feeStructure: { include: { feeItems: true } },
  payments: true,
  paymentAllocations: true,
} as const

const paymentInclude = {
  student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } },
  invoice: true,
  payer: { select: { id: true, firstName: true, lastName: true, phone: true } },
  createdByMembership: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
} as const

export async function findFeeStructures(schoolId: string) {
  return prisma.feeStructure.findMany({
    where: { schoolId, deletedAt: null },
    include: feeStructureInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function createFeeStructure(data: any) {
  const { items, schoolId, ...base } = data
  return prisma.feeStructure.create({
    data: {
      ...base,
      schoolId,
      feeItems: {
        createMany: {
          data: items.map((item: any) => ({ ...item, schoolId })),
        },
      },
    },
    include: feeStructureInclude,
  })
}

export async function findFeeStructureById(schoolId: string, id: string) {
  return prisma.feeStructure.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: feeStructureInclude,
  })
}

export async function findTermById(schoolId: string, termId: string) {
  return prisma.term.findFirst({ where: { id: termId, schoolId, deletedAt: null } })
}

export async function findClassById(schoolId: string, classId: string) {
  return prisma.class.findFirst({ where: { id: classId, schoolId, deletedAt: null } })
}

export async function findStudentById(schoolId: string, studentId: string) {
  return prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } })
}

export async function findEnrollment(schoolId: string, studentId: string, classInstanceId?: string) {
  const where: any = { schoolId, studentId, deletedAt: null, status: "active" }
  if (classInstanceId) where.classInstanceId = classInstanceId
  return prisma.enrollment.findFirst({ where, orderBy: { createdAt: "desc" } })
}

export async function createInvoice(data: any) {
  return prisma.invoice.create({ data, include: invoiceInclude })
}

export async function findInvoices(schoolId: string, studentId?: string) {
  const where: any = { schoolId, deletedAt: null }
  if (studentId) where.studentId = studentId
  return prisma.invoice.findMany({ where, include: invoiceInclude, orderBy: { createdAt: "desc" } })
}

export async function findGuardianStudentLink(schoolId: string, studentId: string, userId: string) {
  return prisma.studentGuardian.findFirst({
    where: { schoolId, studentId, guardianId: userId, deletedAt: null },
  })
}

export async function findInvoiceById(schoolId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, schoolId, deletedAt: null },
    include: invoiceInclude,
  })
}

export async function createPayment(data: any) {
  return prisma.payment.create({ data, include: paymentInclude })
}

export async function findPayments(schoolId: string, studentId?: string) {
  const where: any = { schoolId }
  if (studentId) where.studentId = studentId
  return prisma.payment.findMany({ where, include: paymentInclude, orderBy: { createdAt: "desc" } })
}

export async function findPaymentById(schoolId: string, paymentId: string) {
  return prisma.payment.findFirst({
    where: { id: paymentId, schoolId },
    include: paymentInclude,
  })
}

export async function findPendingPaymentByCheckoutRequestId(checkoutRequestId: string) {
  return prisma.payment.findFirst({
    where: {
      transactionRef: checkoutRequestId,
      status: "pending",
      method: "mpesa_stk",
    },
    include: paymentInclude,
  })
}

export async function findConfirmedByReceipt(schoolId: string, receipt: string) {
  return prisma.payment.findFirst({
    where: {
      schoolId,
      transactionRef: String(receipt),
      status: "confirmed",
      method: "mpesa_stk",
    },
  })
}

/**
 * Loads a confirmed M-Pesa payment together with the invoice allocations it
 * created and any credit payments spawned from its surplus. Used to reverse a
 * Safaricom transaction reversal without leaving dangling balances.
 */
export async function findConfirmedWithAllocations(schoolId: string, receipt: string) {
  return prisma.payment.findFirst({
    where: {
      schoolId,
      transactionRef: String(receipt),
      status: "confirmed",
      method: "mpesa_stk",
    },
    include: {
      allocations: true,
      reversalPayments: {
        where: { type: "credit", status: "confirmed" },
      },
      student: { select: { id: true, creditBalance: true } },
    },
  })
}

/**
 * Removes every allocation tied to a reversed payment so the invoice balances
 * are recomputed from the remaining (non-reversed) allocations.
 */
export async function deletePaymentAllocations(paymentId: string) {
  return prisma.paymentAllocation.deleteMany({ where: { paymentId } })
}

export async function findStuckPendingStk(olderThanMs: number) {
  const cutoff = new Date(Date.now() - olderThanMs)
  return prisma.payment.findMany({
    where: {
      status: "pending",
      method: "mpesa_stk",
      receivedAt: { lt: cutoff },
    },
    include: paymentInclude,
  })
}

export async function markPaymentStatus(
  id: string,
  status: "pending" | "confirmed" | "failed" | "reversed",
  extra: Record<string, any> = {}
) {
  return prisma.payment.update({
    where: { id },
    data: { status, ...extra },
  })
}

export async function findActiveStudentsByClassId(schoolId: string, classInstanceId: string) {
  return prisma.enrollment.findMany({
    where: {
      schoolId,
      classInstanceId,
      status: "active",
      deletedAt: null,
      student: { deletedAt: null },
    },
    include: {
      student: {
        select: { id: true, admissionNumber: true, firstName: true, lastName: true, status: true },
      },
      term: true,
      academicYear: true,
      classInstance: true,
    },
  })
}

export async function findExistingInvoice(schoolId: string, studentId: string, termId: string, feeStructureId: string) {
  return prisma.invoice.findFirst({
    where: {
      schoolId,
      studentId,
      termId,
      feeStructureId,
      deletedAt: null,
      status: { notIn: ["cancelled", "written_off"] },
    },
  })
}
