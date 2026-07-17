import { success } from "@/common/responses"
import * as svc from "./service"

export async function getSessionsController({ params: { schoolId }, query, set }: any) {
  const result = await svc.listSessions(schoolId, query)
  return success(result, schoolId)
}

export async function getSessionController({ params: { schoolId, sessionId }, set }: any) {
  const result = await svc.getSession(schoolId, sessionId)
  return success(result, schoolId)
}

export async function createSessionController({ params: { schoolId }, body, authUser, set }: any) {
  set.status = 201
  const result = await svc.createSession(schoolId, authUser, body)
  return success(result, schoolId)
}

export async function updateRecordController({ params: { schoolId, sessionId, recordId }, body, authUser, set }: any) {
  const result = await svc.editRecord(schoolId, sessionId, recordId, authUser, body)
  return success(result, schoolId)
}

export async function lockSessionController({ params: { schoolId, sessionId }, set }: any) {
  const result = await svc.lockSession(schoolId, sessionId)
  return success(result, schoolId)
}
