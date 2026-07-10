import { prisma } from "@/infrastructure/database/prisma"

const examInclude = {
  term: true,
  assessments: {
    include: {
      subject: true,
      classInstance: { include: { class: true } },
      _count: { select: { results: true } },
    },
  },
} as const

const assessmentInclude = {
  exam: true,
  subject: true,
  classInstance: { include: { class: true } },
  results: {
    include: {
      student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } },
    },
    orderBy: { student: { firstName: "asc" as const } },
  },
} as const

export async function findExams(schoolId: string, termId?: string) {
  const where: any = { schoolId, deletedAt: null }
  if (termId) where.termId = termId
  return prisma.exam.findMany({ where, include: examInclude, orderBy: { startDate: "desc" } })
}

export async function findExamById(schoolId: string, examId: string) {
  return prisma.exam.findFirst({ where: { id: examId, schoolId, deletedAt: null }, include: examInclude })
}

export async function createExam(data: any) {
  return prisma.exam.create({ data, include: examInclude })
}

export async function updateExam(examId: string, data: any) {
  return prisma.exam.update({ where: { id: examId }, data, include: examInclude })
}

export async function publishExam(examId: string) {
  return prisma.exam.update({
    where: { id: examId },
    data: { published: true, publishedAt: new Date() },
    include: examInclude,
  })
}

export async function findAssessmentById(schoolId: string, assessmentId: string) {
  return prisma.assessment.findFirst({
    where: { id: assessmentId, schoolId, deletedAt: null },
    include: assessmentInclude,
  })
}

export async function createAssessment(data: any) {
  return prisma.assessment.create({ data, include: { ...assessmentInclude, results: false } })
}

export async function upsertResults(schoolId: string, assessmentId: string, results: { studentId: string; attainedMarks: number; remarks?: string }[]) {
  for (const r of results) {
    await prisma.assessmentResult.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId: r.studentId } },
      create: { assessmentId, studentId: r.studentId, attainedMarks: r.attainedMarks, remarks: r.remarks, schoolId },
      update: { attainedMarks: r.attainedMarks, remarks: r.remarks },
    })
  }
}

export async function publishAssessment(assessmentId: string) {
  return prisma.assessment.update({
    where: { id: assessmentId },
    data: {},
    include: assessmentInclude,
  })
}

export async function getEnrolledStudents(schoolId: string, classInstanceId: string) {
  return prisma.enrollment.findMany({
    where: { classInstanceId, status: "active", deletedAt: null, schoolId },
    select: { studentId: true, student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } } },
  })
}
