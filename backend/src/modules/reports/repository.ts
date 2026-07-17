import { prisma } from "@/infrastructure/database/prisma"

export async function getReportSummary(schoolId: string) {
  const [students, staff, activeClasses, attendanceSessions, invoices, payments, exams, assessments] =
    await Promise.all([
      prisma.student.count({ where: { schoolId, deletedAt: null } }),
      prisma.schoolMembership.count({ where: { schoolId, deletedAt: null, status: "active" } }),
      prisma.classInstance.count({ where: { schoolId, deletedAt: null, isCurrent: true } }),
      prisma.attendanceSession.count({ where: { schoolId, deletedAt: null } }),
      prisma.invoice.count({ where: { schoolId, deletedAt: null } }),
      prisma.payment.count({ where: { schoolId } }),
      prisma.exam.count({ where: { schoolId, deletedAt: null } }),
      prisma.assessment.count({ where: { schoolId, deletedAt: null } }),
    ])

  return [
    { type: "attendance", label: "Attendance", count: attendanceSessions },
    { type: "finance", label: "Finance", count: invoices + payments },
    { type: "academic", label: "Academic", count: exams + assessments },
    { type: "students", label: "Students", count: students },
  ]
}

export async function getAttendanceReport(schoolId: string) {
  const [sessions, recordsByStatus] = await Promise.all([
    prisma.attendanceSession.count({ where: { schoolId, deletedAt: null } }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { schoolId, deletedAt: null },
      _count: { id: true },
    }),
  ])

  const totalRecords = recordsByStatus.reduce((sum, r) => sum + r._count.id, 0)

  const statusBreakdown = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  }
  for (const r of recordsByStatus) {
    statusBreakdown[r.status as keyof typeof statusBreakdown] = r._count.id
  }

  const averageRate = totalRecords > 0
    ? Math.round((statusBreakdown.present / totalRecords) * 10000) / 100
    : 0

  return {
    totalSessions: sessions,
    totalRecords,
    present: statusBreakdown.present,
    absent: statusBreakdown.absent,
    late: statusBreakdown.late,
    excused: statusBreakdown.excused,
    averageRate,
  }
}

export async function getFinanceReport(schoolId: string) {
  const [totalInvoicedAgg, paymentAgg, invoices, paidByInvoice] = await Promise.all([
    prisma.invoice.aggregate({
      where: { schoolId, deletedAt: null },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: "confirmed" },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { schoolId, deletedAt: null },
      select: { id: true, totalAmount: true },
    }),
    prisma.paymentAllocation.groupBy({
      by: ["invoiceId"],
      where: {
        payment: { status: "confirmed" },
        invoice: { schoolId, deletedAt: null },
      },
      _sum: { amount: true },
    }),
  ])

  const paidMap = new Map(paidByInvoice.map((a) => [a.invoiceId, Number(a._sum.amount ?? 0)]))
  const totalInvoiced = Number(totalInvoicedAgg._sum.totalAmount ?? 0)
  const totalPaid = paidByInvoice.reduce((sum, a) => sum + Number(a._sum.amount ?? 0), 0)
  const totalOutstanding = totalInvoiced - totalPaid

  const statusBuckets: Record<string, { count: number; totalAmount: number; outstanding: number }> = {}
  for (const inv of invoices) {
    const paid = paidMap.get(inv.id) ?? 0
    const total = Number(inv.totalAmount)
    const bal = total - paid
    const status = bal <= 0 ? "paid" : paid > 0 ? "partially_paid" : "issued"
    if (!statusBuckets[status]) {
      statusBuckets[status] = { count: 0, totalAmount: 0, outstanding: 0 }
    }
    statusBuckets[status].count++
    statusBuckets[status].totalAmount += total
    statusBuckets[status].outstanding += Math.max(0, bal)
  }

  return {
    totalInvoiced,
    totalCollected: Number(paymentAgg._sum.amount ?? 0),
    totalOutstanding: Math.max(0, totalOutstanding),
    invoicesByStatus: Object.entries(statusBuckets).map(([status, data]) => ({
      status,
      count: data.count,
      totalAmount: data.totalAmount,
      outstanding: data.outstanding,
    })),
  }
}

export async function getAcademicReport(schoolId: string) {
  const [totalExams, completedExams, totalAssessments, resultsAgg] = await Promise.all([
    prisma.exam.count({ where: { schoolId, deletedAt: null } }),
    prisma.exam.count({ where: { schoolId, deletedAt: null, completed: true } }),
    prisma.assessment.count({ where: { schoolId, deletedAt: null } }),
    prisma.assessmentResult.groupBy({
      by: ["published"],
      where: { schoolId, deletedAt: null },
      _count: { id: true },
    }),
  ])

  const totalResults = resultsAgg.reduce((sum, r) => sum + r._count.id, 0)
  const publishedResults = resultsAgg.find((r) => r.published)?._count.id ?? 0

  return {
    totalExams,
    completedExams,
    totalAssessments,
    totalResults,
    publishedResults,
  }
}

export async function getStudentReport(schoolId: string) {
  const [total, active, byGender, enrollmentClassCounts] = await Promise.all([
    prisma.student.count({ where: { schoolId, deletedAt: null } }),
    prisma.student.count({ where: { schoolId, deletedAt: null, status: "active" } }),
    prisma.student.groupBy({
      by: ["gender"],
      where: { schoolId, deletedAt: null, gender: { not: null } },
      _count: { id: true },
    }),
    prisma.enrollment.groupBy({
      by: ["classInstanceId"],
      where: { schoolId, deletedAt: null, status: "active" },
      _count: { id: true },
    }),
  ])

  const classInstanceIds = enrollmentClassCounts.map((e) => e.classInstanceId)
  const classInstances = classInstanceIds.length > 0
    ? await prisma.classInstance.findMany({
        where: { id: { in: classInstanceIds } },
        include: { class: { select: { name: true } } },
      })
    : []

  const classMap = new Map(classInstances.map((ci) => [ci.id, ci.class.name]))

  return {
    total,
    active,
    byGender: byGender.map((g) => ({ gender: g.gender, count: g._count.id })),
    byClass: enrollmentClassCounts.map((e) => ({
      classId: e.classInstanceId,
      className: classMap.get(e.classInstanceId) ?? "Unknown",
      count: e._count.id,
    })),
  }
}
