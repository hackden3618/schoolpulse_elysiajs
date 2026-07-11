import { success } from "@/common/responses";
import * as svc from "./service";

export async function getStudentsController({ params: { schoolId }, set }: any) {
  const students = await svc.listAllStudents(schoolId);
  return success(students, schoolId);
}

export async function getStudentController({ params: { schoolId, studentId }, set }: any) {
  const student = await svc.getStudentById(schoolId, studentId);
  return success(student, schoolId);
}

export async function createStudentController({ params: { schoolId }, body, set }: any) {
  const student = await svc.createStudent(schoolId, body);
  set.status = 201;
  return success(student, schoolId);
}

export async function updateStudentController({ params: { schoolId, studentId }, body, set }: any) {
  const student = await svc.updateStudent(schoolId, studentId, body);
  return success(student, schoolId);
}

export async function archiveStudentController({ params: { schoolId, studentId }, body, set }: any) {
  const student = await svc.archiveStudent(schoolId, studentId, body);
  return success(student, schoolId);
}

export async function linkGuardianController({ params: { schoolId, studentId }, body, set }: any) {
  const guardian = await svc.linkGuardian(schoolId, studentId, body);
  set.status = 201;
  return success(guardian, schoolId);
}

export async function unlinkGuardianController({ params: { schoolId, studentId, guardianId }, set }: any) {
  const result = await svc.unlinkGuardian(schoolId, studentId, guardianId);
  return success(result, schoolId);
}

export async function enrollStudentController({ params: { schoolId, studentId }, body, set }: any) {
  const enrollment = await svc.enrollStudent(schoolId, studentId, body);
  set.status = 201;
  return success(enrollment, schoolId);
}

export async function updateEnrollmentController({ params: { schoolId, studentId, enrollmentId }, body, set }: any) {
  const enrollment = await svc.updateEnrollment(schoolId, studentId, enrollmentId, body);
  return success(enrollment, schoolId);
}

export async function addGuardianByDetailsController({ params: { schoolId, studentId }, body, set }: any) {
  const guardian = await svc.addGuardianByDetails(schoolId, studentId, body);
  set.status = 201;
  return success(guardian, schoolId);
}
