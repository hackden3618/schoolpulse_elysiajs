import * as repo from "./repository"

export async function getDashboardSummary(schoolId: string) {
  return repo.getSummary(schoolId)
}

export async function getRecentActivity(schoolId: string) {
  return repo.getRecentActivity(schoolId)
}
