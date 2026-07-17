import { success } from "@/common/responses"
import * as svc from "./service"

export async function getDashboardSummaryController({ params: { schoolId }, set }: any) {
  const result = await svc.getDashboardSummary(schoolId)
  return success(result, schoolId)
}

export async function getRecentActivityController({ params: { schoolId }, set }: any) {
  const result = await svc.getRecentActivity(schoolId)
  return success(result, schoolId)
}
