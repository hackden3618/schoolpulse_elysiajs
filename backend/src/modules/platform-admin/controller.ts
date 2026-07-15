import { success } from "@/common/responses"
import * as svc from "./service"

export async function loginController({ body, set }: any) {
  const result = await svc.login(body)
  return success(result)
}

export async function createAdminController({ body, set }: any) {
  set.status = 201
  const result = await svc.createAdmin(body)
  return success(result)
}

export async function listAdminsController({ set }: any) {
  const result = await svc.listAdmins()
  return success(result)
}

export async function updateAdminController({ params, body, set }: any) {
  const result = await svc.updateAdmin(params.id, body)
  return success(result)
}

export async function deleteAdminController({ params, set }: any) {
  const result = await svc.deleteAdmin(params.id)
  return success(result)
}

export async function resetPasswordController({ params, set }: any) {
  const result = await svc.resetPassword(params.id)
  return success(result)
}

export async function approveJoinRequestController({ params, platformAdmin, set }: any) {
  const result = await svc.approveJoinRequest(params.id, platformAdmin.id)
  return success(result)
}

export async function listSchoolsController({ set }: any) {
  const result = await svc.listSchools()
  return success(result)
}

export async function deleteSchoolController({ params, set }: any) {
  const result = await svc.deleteSchool(params.id)
  return success(result)
}

export async function rejectJoinRequestController({ params, platformAdmin, body, set }: any) {
  const result = await svc.rejectJoinRequest(params.id, platformAdmin.id, body)
  return success(result)
}

export async function markUnderReviewController({ params, platformAdmin, set }: any) {
  const result = await svc.markUnderReview(params.id, platformAdmin.id)
  return success(result)
}

export async function verifyOtpController({ body, set }: any) {
  const result = await svc.verifyOtp(body)
  return success(result)
}

export async function setupAdminController({ body, set }: any) {
  set.status = 201
  const result = await svc.setupAdmin(body)
  return success(result)
}
