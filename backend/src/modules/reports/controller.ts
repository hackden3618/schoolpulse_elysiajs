import { success } from "@/common/responses"
import * as svc from "./service"

export async function getReportSummaryController({ params: { schoolId } }: any) {
  const result = await svc.getReportSummary(schoolId)
  return success(result, schoolId)
}

export async function getAttendanceReportController({ params: { schoolId } }: any) {
  const result = await svc.getAttendanceReport(schoolId)
  return success(result, schoolId)
}

export async function getFinanceReportController({ params: { schoolId } }: any) {
  const result = await svc.getFinanceReport(schoolId)
  return success(result, schoolId)
}

export async function getAcademicReportController({ params: { schoolId } }: any) {
  const result = await svc.getAcademicReport(schoolId)
  return success(result, schoolId)
}

export async function getStudentReportController({ params: { schoolId } }: any) {
  const result = await svc.getStudentReport(schoolId)
  return success(result, schoolId)
}
