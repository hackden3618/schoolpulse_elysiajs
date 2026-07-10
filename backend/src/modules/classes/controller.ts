import { success } from "@/common/responses";
import * as svc from "./service";

export async function getAcademicYearsController({ params: { schoolId }, set }: any) {
  const years = await svc.listAcademicYears(schoolId);
  return success(years, schoolId);
}

export async function getAcademicYearController({ params: { schoolId, academicYearId }, set }: any) {
  const year = await svc.getAcademicYear(schoolId, academicYearId);
  return success(year, schoolId);
}

export async function createAcademicYearController({ params: { schoolId }, body, set }: any) {
  const year = await svc.createAcademicYear(schoolId, body);
  set.status = 201;
  return success(year, schoolId);
}

export async function activateAcademicYearController({ params: { schoolId, academicYearId }, set }: any) {
  const year = await svc.activateAcademicYear(schoolId, academicYearId);
  return success(year, schoolId);
}

export async function getTermsController({ params: { schoolId }, set }: any) {
  const terms = await svc.listTerms(schoolId);
  return success(terms, schoolId);
}

export async function createTermController({ params: { schoolId }, body, set }: any) {
  const term = await svc.createTerm(schoolId, body);
  set.status = 201;
  return success(term, schoolId);
}

export async function activateTermController({ params: { schoolId, termId }, set }: any) {
  const term = await svc.activateTerm(schoolId, termId);
  return success(term, schoolId);
}

export async function getClassesController({ params: { schoolId }, set }: any) {
  const classes = await svc.listClasses(schoolId);
  return success(classes, schoolId);
}

export async function createClassController({ params: { schoolId }, body, set }: any) {
  const newClass = await svc.createClass(schoolId, body);
  set.status = 201;
  return success(newClass, schoolId);
}

export async function getClassInstancesController({ params: { schoolId }, set }: any) {
  const instances = await svc.listClassInstances(schoolId);
  return success(instances, schoolId);
}

export async function createClassInstanceController({ params: { schoolId }, body, set }: any) {
  const instance = await svc.createClassInstance(schoolId, body);
  set.status = 201;
  return success(instance, schoolId);
}

export async function getSubjectsController({ params: { schoolId }, set }: any) {
  const subjects = await svc.listSubjects(schoolId);
  return success(subjects, schoolId);
}

export async function createSubjectController({ params: { schoolId }, body, set }: any) {
  const subject = await svc.createSubject(schoolId, body);
  set.status = 201;
  return success(subject, schoolId);
}

export async function assignSubjectsController({ params: { schoolId, classInstanceId }, body, set }: any) {
  const instance = await svc.assignSubjects(schoolId, classInstanceId, body);
  return success(instance, schoolId);
}
