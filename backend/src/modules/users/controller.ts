import { success } from "@/common/responses";
import * as svc from "./service";

export async function getUsersController({ params: { schoolId }, set }: any) {
  const users = await svc.listAllUsers(schoolId);
  return success(users, schoolId);
}

export async function getUserController({ params: { schoolId, userId }, set }: any) {
  const user = await svc.getUserById(schoolId, userId);
  return success(user, schoolId);
}

export async function createUserController({ body, set }: any) {
  const user = await svc.createUser(body);
  set.status = 201;
  return success(user);
}

export async function updateUserController({ params: { schoolId, userId }, body, set }: any) {
  const user = await svc.updateUser(schoolId, userId, body);
  return success(user, schoolId);
}

export async function getSelfController({ params: { schoolId }, authUser, set }: any) {
  const user = await svc.getSelfProfile(authUser.userId, schoolId);
  return success(user, schoolId);
}

export async function updateSelfController({ params: { schoolId }, body, authUser, set }: any) {
  const user = await svc.updateSelfProfile(authUser.userId, schoolId, body);
  return success(user, schoolId);
}

export async function getMembershipsController({ params: { schoolId }, set }: any) {
  const memberships = await svc.listAllMemberships(schoolId);
  return success(memberships, schoolId);
}

export async function searchMembersController({ params: { schoolId }, query: { q } }: any) {
  const results = await svc.searchMembers(schoolId, q || "");
  return success(results, schoolId);
}

export async function createMembershipController({ params: { schoolId }, body, set }: any) {
  const membership = await svc.createMembership(schoolId, body);
  set.status = 201;
  return success(membership, schoolId);
}

export async function updateMembershipController({ params: { schoolId, membershipId }, body, authUser, set }: any) {
  const membership = await svc.updateMembership(membershipId, body, { id: authUser?.userId, membershipId: authUser?.membershipId });
  return success(membership, schoolId);
}

export async function deleteUserController({ params: { schoolId, userId }, set }: any) {
  const result = await svc.deleteUser(schoolId, userId);
  return success(result, schoolId);
}

export async function assignRolesController({ params: { schoolId, membershipId }, body, authUser, set }: any) {
  const membership = await svc.assignRoles(membershipId, body, { id: authUser?.userId, membershipId: authUser?.membershipId });
  return success(membership, schoolId);
}
