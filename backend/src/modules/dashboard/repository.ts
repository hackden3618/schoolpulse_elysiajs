import { prisma } from "@/infrastructure/database/prisma"

export async function getSummary(schoolId: string) {
  const [
    students,
    activeStudents,
    staff,
    classes,
    activeAcademicYear,
    activeTerm,
    attendanceToday,
    openInvoices,
    pendingPayments,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId, deletedAt: null } }),
    prisma.student.count({ where: { schoolId, deletedAt: null, status: "active" } }),
    prisma.schoolMembership.count({ where: { schoolId, deletedAt: null, status: "active" } }),
    prisma.classInstance.count({ where: { schoolId, deletedAt: null, isCurrent: true } }),
    prisma.academicYear.findFirst({ where: { schoolId, deletedAt: null, active: true } }),
    prisma.term.findFirst({ where: { schoolId, deletedAt: null, active: true } }),
    prisma.attendanceSession.count({
      where: { schoolId, sessionDate: new Date(), deletedAt: null },
    }),
    prisma.invoice.count({
      where: { schoolId, deletedAt: null, status: { in: ["issued", "partially_paid", "overdue"] } },
    }),
    prisma.payment.count({
      where: { schoolId, status: "pending" },
    }),
  ])

  return {
    students,
    activeStudents,
    staff,
    activeClasses: classes,
    activeAcademicYear,
    activeTerm,
    attendanceToday,
    openInvoices,
    pendingPayments,
  }
}

export async function getRecentActivity(schoolId: string) {
  const payments = await prisma.payment.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      amount: true,
      method: true,
      transactionRef: true,
      createdAt: true,
      student: { select: { firstName: true, lastName: true } },
    },
  })

  return { recentPayments: payments }
}
