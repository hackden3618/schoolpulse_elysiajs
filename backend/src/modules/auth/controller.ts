import { success } from "@/common/responses"
import * as svc from "./service"

export async function loginController({ body, set }: any) {
  const result = await svc.login(body)
  return success(result)
}

export async function registerController({ body, set }: any) {
  set.status = 201
  const result = await svc.register(body)
  return success(result)
}

export async function forgotPasswordController({ body, set }: any) {
  const result = await svc.forgotPassword(body)
  return success(result)
}

export async function resetPasswordController({ body, set }: any) {
  const result = await svc.resetPassword(body)
  return success(result)
}

export async function changePasswordController({ body, authUser, set }: any) {
  const result = await svc.changePassword(authUser.userId, body)
  return success(result)
}

export async function refreshController({ body, set }: any) {
  const result = await svc.refresh(body.refreshToken)
  return success(result)
}

export async function logoutController({ set }: any) {
  const result = await svc.logout()
  return success(result)
}

export async function createJoinRequestController({ body, set }: any) {
  set.status = 201
  const result = await svc.createJoinRequest(body)
  return success(result)
}

export async function listJoinRequestsController({ set }: any) {
  const result = await svc.listJoinRequests()
  return success(result)
}

export async function approveJoinRequestController({ params, platformAdmin, set }: any) {
  const result = await svc.approveJoinRequest(params.id, platformAdmin.id)
  return success(result)
}

export async function listMembershipsController({ authUser }: any) {
  const result = await svc.listMemberships(authUser.userId)
  return success(result)
}

export async function switchSchoolController({ body, authUser }: any) {
  const result = await svc.switchSchool(authUser.userId, body)
  return success(result)
}

export async function switchRoleController({ body, authUser }: any) {
  const result = await svc.switchRole(authUser.userId, {
    ...body,
    sessionId: authUser.sessionId,
    membershipId: authUser.membershipId,
  })
  return success(result)
}
