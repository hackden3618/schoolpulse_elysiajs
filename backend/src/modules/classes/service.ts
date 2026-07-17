import { AppError } from "@/common/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { writeEventOutbox } from "@/infrastructure/events";
import * as repo from "./repository";
import type {
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  CreateTermInput,
  UpdateTermInput,
  CreateClassInput,
  CreateClassInstanceInput,
  CreateSubjectInput,
  AssignSubjectsInput,
} from "./schema";

export async function listAcademicYears(schoolId: string) {
  return repo.findAllAcademicYears(schoolId);
}

export async function getAcademicYear(schoolId: string, id: string) {
  const year = await repo.findAcademicYearById(schoolId, id);
  if (!year) throw AppError.notFound("Academic year not found");
  return year;
}

export async function createAcademicYear(schoolId: string, data: CreateAcademicYearInput) {
  const year = await prisma.academicYear.create({
    data: {
      school: { connect: { id: schoolId } },
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    include: repo["academicYearInclude"],
  });
  return year;
}

export async function updateAcademicYear(schoolId: string, academicYearId: string, data: UpdateAcademicYearInput) {
  const year = await repo.findAcademicYearById(schoolId, academicYearId);
  if (!year) throw AppError.notFound("Academic year not found");

  const updated = await repo.updateAcademicYear(academicYearId, {
    name: data.name,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  });

  return updated;
}

export async function activateAcademicYear(schoolId: string, academicYearId: string) {
  const year = await repo.findAcademicYearById(schoolId, academicYearId);
  if (!year) throw AppError.notFound("Academic year not found");

  await prisma.$transaction(async (tx: any) => {
    await repo.deactivateAllAcademicYears(schoolId, tx);
    await tx.academicYear.update({ where: { id: academicYearId }, data: { active: true } });
  });

  await writeEventOutbox({
    schoolId,
    aggregateId: academicYearId,
    aggregateType: "academic_year",
    eventType: "AcademicYearActivated",
    payload: { name: year.name },
  });

  return repo.findAcademicYearById(schoolId, academicYearId);
}

export async function listTerms(schoolId: string, academicYearId?: string) {
  return repo.findAllTerms(schoolId, academicYearId);
}

export async function createTerm(schoolId: string, data: CreateTermInput) {
  const year = await repo.findAcademicYearById(schoolId, data.academicYearId);
  if (!year) throw AppError.notFound("Academic year not found");

  // Policy: Term dates must fall within the Academic Year bounds
  const termStart = new Date(data.startDate);
  const termEnd = new Date(data.endDate);
  const yearStart = new Date(year.startDate);
  const yearEnd = new Date(year.endDate);
  if (termStart < yearStart || termEnd > yearEnd) {
    throw AppError.validation(
      `Term dates must fall within the Academic Year (${year.name}: ${year.startDate.toDateString()} – ${year.endDate.toDateString()})`
    );
  }

  return prisma.term.create({
    data: {
      school: { connect: { id: schoolId } },
      academicYear: { connect: { id: data.academicYearId } },
      name: data.name,
      startDate: termStart,
      endDate: termEnd,
    },
  });
}

export async function updateTerm(schoolId: string, termId: string, data: UpdateTermInput) {
  const term = await repo.findTermById(schoolId, termId);
  if (!term) throw AppError.notFound("Term not found");

  const year = await repo.findAcademicYearById(schoolId, term.academicYearId);
  if (!year) throw AppError.notFound("Academic year not found");

  const termStart = data.startDate ? new Date(data.startDate) : new Date(term.startDate);
  const termEnd = data.endDate ? new Date(data.endDate) : new Date(term.endDate);
  const yearStart = new Date(year.startDate);
  const yearEnd = new Date(year.endDate);

  if (termStart < yearStart || termEnd > yearEnd) {
    throw AppError.validation(
      `Term dates must fall within the Academic Year (${year.name}: ${year.startDate.toDateString()} – ${year.endDate.toDateString()})`
    );
  }

  return prisma.term.update({
    where: { id: termId },
    data: { name: data.name, startDate: termStart, endDate: termEnd },
  });
}

export async function activateTerm(schoolId: string, termId: string) {
  const term = await repo.findTermById(schoolId, termId);
  if (!term) throw AppError.notFound("Term not found");

  await prisma.$transaction(async (tx: any) => {
    await repo.deactivateAllTermsInYear(term.academicYearId, tx);
    await tx.term.update({ where: { id: termId }, data: { active: true } });
  });

  await writeEventOutbox({
    schoolId,
    aggregateId: termId,
    aggregateType: "term",
    eventType: "TermActivated",
    payload: { name: term.name, academicYearId: term.academicYearId },
  });

  return repo.findTermById(schoolId, termId);
}

export async function listClasses(schoolId: string) {
  return repo.findAllClasses(schoolId);
}

export async function createClass(schoolId: string, data: CreateClassInput) {
  return prisma.class.create({
    data: {
      school: { connect: { id: schoolId } },
      name: data.name,
      level: data.level,
    },
    include: repo["classInclude"],
  });
}

export async function listClassInstances(schoolId: string) {
  return repo.findAllClassInstances(schoolId);
}

export async function createClassInstance(schoolId: string, data: CreateClassInstanceInput) {
  const classObj = await repo.findClassById(schoolId, data.classId);
  if (!classObj) throw AppError.notFound("Class not found");

  const year = await repo.findAcademicYearById(schoolId, data.academicYearId);
  if (!year) throw AppError.notFound("Academic year not found");

  return prisma.classInstance.create({
    data: {
      school: { connect: { id: schoolId } },
      class: { connect: { id: data.classId } },
      academicYear: { connect: { id: data.academicYearId } },
      streamName: data.streamName,
    },
    include: repo["classInstanceInclude"],
  });
}

export async function listSubjects(schoolId: string) {
  return repo.findAllSubjects(schoolId);
}

export async function createSubject(schoolId: string, data: CreateSubjectInput) {
  return prisma.subject.create({
    data: {
      school: { connect: { id: schoolId } },
      name: data.name,
      code: data.code,
      isCompulsory: data.isCompulsory ?? true,
    },
  });
}

export async function assignSubjects(
  schoolId: string,
  classInstanceId: string,
  data: AssignSubjectsInput
) {
  const instance = await repo.findClassInstanceById(schoolId, classInstanceId);
  if (!instance) throw AppError.notFound("Class instance not found");

  await prisma.$transaction(async (tx: any) => {
    await repo.removeSubjectAssignments(classInstanceId, tx);

    for (const assignment of data.assignments) {
      await tx.classSubjectAssignment.create({
        data: {
          school: { connect: { id: schoolId } },
          classInstance: { connect: { id: classInstanceId } },
          subject: { connect: { id: assignment.subjectId } },
          ...(assignment.teacherMembershipId
            ? { teacher: { connect: { id: assignment.teacherMembershipId } } }
            : {}),
        },
      });
    }
  });

  return repo.findClassInstanceById(schoolId, classInstanceId);
}
