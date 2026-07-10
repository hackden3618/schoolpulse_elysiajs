import { success } from "@/common/responses"
import * as svc from "./service"

export async function getExamsController({ params: { schoolId }, query: { termId }, set }: any) {
  const result = await svc.listExams(schoolId, termId)
  return success(result, schoolId)
}

export async function getExamController({ params: { schoolId, examId }, set }: any) {
  const result = await svc.getExam(schoolId, examId)
  return success(result, schoolId)
}

export async function createExamController({ params: { schoolId }, body, set }: any) {
  set.status = 201
  const result = await svc.createExam(schoolId, body)
  return success(result, schoolId)
}

export async function updateExamController({ params: { schoolId, examId }, body, set }: any) {
  const result = await svc.updateExam(schoolId, examId, body)
  return success(result, schoolId)
}

export async function publishExamController({ params: { schoolId, examId }, set }: any) {
  const result = await svc.publishExam(schoolId, examId)
  return success(result, schoolId)
}

export async function createAssessmentController({ params: { schoolId }, body, set }: any) {
  set.status = 201
  const result = await svc.createAssessment(schoolId, body)
  return success(result, schoolId)
}

export async function getAssessmentController({ params: { schoolId, assessmentId }, set }: any) {
  const result = await svc.getAssessment(schoolId, assessmentId)
  return success(result, schoolId)
}

export async function enterResultsController({ params: { schoolId, assessmentId }, body, set }: any) {
  set.status = 201
  const result = await svc.enterResults(schoolId, assessmentId, body)
  return success(result, schoolId)
}

export async function publishResultsController({ params: { schoolId, assessmentId }, set }: any) {
  const result = await svc.publishResults(schoolId, assessmentId)
  return success(result, schoolId)
}
