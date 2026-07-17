import { success } from "@/common/responses";
import * as svc from "./service";

export async function getSchoolsController({ authUser, set }: any) {
  const schools = await svc.listMySchools(authUser.userId);
  return success(schools);
}

export async function getSchoolController({ params: { schoolId }, set }: any) {
  const school = await svc.getSchoolById(schoolId);
  return success(school, schoolId);
}

export async function createSchoolController({ body, set }: any) {
  const school = await svc.createSchool(body);
  set.status = 201;
  return success(school, school.id);
}

export async function updateSchoolController({ params: { schoolId }, body, set }: any) {
  const school = await svc.updateSchool(schoolId, body);
  return success(school, schoolId);
}

export async function getSubscriptionController({ params: { schoolId }, set }: any) {
  const subscription = await svc.getSubscription(schoolId);
  return success(subscription, schoolId);
}

export async function updateSubscriptionController({ params: { schoolId }, body, set }: any) {
  const subscription = await svc.updateSubscriptionState(schoolId, body);
  return success(subscription, schoolId);
}
