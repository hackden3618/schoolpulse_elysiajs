import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import * as repo from "./repository"
import type { CreateExamInput, UpdateExamInput, CreateAssessmentInput, CreateResultInput } from "./schema"

export async function listExams(schoolId: string, termId?: string) {
  return repo.findExams(schoolId, termId)
}

export async function getExam(schoolId: string, examId: string) {
  const exam = await repo.findExamById(schoolId, examId)
  if (!exam) throw AppError.notFound("Exam not found")
  return exam
}

export async function createExam(schoolId: string, data: CreateExamInput) {
  const result = await repo.createExam({
    schoolId,
    termId: data.termId,
    name: data.name,
    type: data.type ?? "custom",
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
  })

  await writeEventOutbox({
    schoolId,
    aggregateId: result.id,
    aggregateType: "exam",
    eventType: "ExamCreated",
    payload: { name: data.name },
  })

  return result
}

export async function updateExam(schoolId: string, examId: string, data: UpdateExamInput) {
  const exam = await repo.findExamById(schoolId, examId)
  if (!exam) throw AppError.notFound("Exam not found")
  if (exam.published) throw AppError.forbidden("Cannot update a published exam")

  const updateData: any = { ...data }
  if (data.startDate) updateData.startDate = new Date(data.startDate)
  if (data.endDate) updateData.endDate = new Date(data.endDate)

  return repo.updateExam(examId, updateData)
}

export async function publishExam(schoolId: string, examId: string) {
  const exam = await repo.findExamById(schoolId, examId)
  if (!exam) throw AppError.notFound("Exam not found")
  return repo.publishExam(examId)
}

export async function createAssessment(schoolId: string, data: CreateAssessmentInput) {
  const dup = await prisma.assessment.findFirst({
    where: { examId: data.examId, classInstanceId: data.classInstanceId, subjectId: data.subjectId, deletedAt: null },
  })
  if (dup) throw AppError.conflict("Assessment already exists for this exam, class, and subject")

  const result = await repo.createAssessment({
    schoolId,
    examId: data.examId,
    classInstanceId: data.classInstanceId,
    subjectId: data.subjectId,
    totalMarks: data.totalMarks,
    accountedInFinal: data.accountedInFinal ?? true,
  })

  return result
}

export async function getAssessment(schoolId: string, assessmentId: string) {
  const assessment = await repo.findAssessmentById(schoolId, assessmentId)
  if (!assessment) throw AppError.notFound("Assessment not found")
  return assessment
}

export async function enterResults(schoolId: string, assessmentId: string, data: CreateResultInput) {
  const assessment = await repo.findAssessmentById(schoolId, assessmentId)
  if (!assessment) throw AppError.notFound("Assessment not found")
  if (assessment.results.some((r: any) => r.published)) throw AppError.forbidden("Cannot modify published results")

  const enriched = data.results.map((r) => ({
    ...r,
    schoolId,
    assessmentId,
  }))

  const enrolled = await repo.getEnrolledStudents(schoolId, assessment.classInstanceId)
  const enrolledIds = new Set(enrolled.map((e) => e.studentId))

  for (const r of data.results) {
    if (!enrolledIds.has(r.studentId)) {
      throw AppError.validation(`Student ${r.studentId} is not enrolled in this class`)
    }
    if (r.attainedMarks > Number(assessment.totalMarks)) {
      throw AppError.validation(`Marks exceed total (${assessment.totalMarks}) for student ${r.studentId}`)
    }
  }

  await repo.upsertResults(schoolId, assessmentId, data.results)

  await writeEventOutbox({
    schoolId,
    aggregateId: assessmentId,
    aggregateType: "assessment",
    eventType: "AssessmentPublished",
    payload: { entryCount: data.results.length },
  })

  return repo.findAssessmentById(schoolId, assessmentId)
}

export async function publishResults(schoolId: string, assessmentId: string) {
  const assessment = await repo.findAssessmentById(schoolId, assessmentId)
  if (!assessment) throw AppError.notFound("Assessment not found")

  await prisma.assessmentResult.updateMany({
    where: { assessmentId },
    data: { published: true },
  })

  await writeEventOutbox({
    schoolId,
    aggregateId: assessmentId,
    aggregateType: "assessment",
    eventType: "AssessmentPublished",
    payload: { action: "results-published" },
  })

  return repo.findAssessmentById(schoolId, assessmentId)
}
