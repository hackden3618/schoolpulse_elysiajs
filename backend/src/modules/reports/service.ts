import * as repo from "./repository"

export async function getReportSummary(schoolId: string) {
  return repo.getReportSummary(schoolId)
}

export async function getAttendanceReport(schoolId: string) {
  return repo.getAttendanceReport(schoolId)
}

export async function getFinanceReport(schoolId: string) {
  return repo.getFinanceReport(schoolId)
}

export async function getAcademicReport(schoolId: string) {
  return repo.getAcademicReport(schoolId)
}

export async function getStudentReport(schoolId: string) {
  return repo.getStudentReport(schoolId)
}
