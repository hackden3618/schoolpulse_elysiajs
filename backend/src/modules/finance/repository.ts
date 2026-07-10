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
