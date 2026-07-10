import { prisma } from "@/infrastructure/database/prisma";

export const academicYearInclude = {
  terms: { where: { deletedAt: null }, orderBy: { startDate: "asc" as const } },
  _count: { select: { classInstances: true } },
} as const;

export const classInclude = {
  _count: { select: { classInstances: true, feeStructures: true } },
} as const;

export const classInstanceInclude = {
  class: true,
  academicYear: true,
  classTeacher: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  classSubjectAssignments: {
    where: { deletedAt: null },
    include: {
      subject: true,
      teacher: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  },
  _count: { select: { enrollments: true } },
} as const;

export async function findAllAcademicYears(schoolId: string) {
  return prisma.academicYear.findMany({
    where: { schoolId, deletedAt: null },
    include: academicYearInclude,
    orderBy: { startDate: "desc" },
  });
}

export async function findAcademicYearById(schoolId: string, id: string) {
  return prisma.academicYear.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: academicYearInclude,
  });
}

export async function findActiveAcademicYear(schoolId: string) {
  return prisma.academicYear.findFirst({
    where: { schoolId, active: true, deletedAt: null },
    include: academicYearInclude,
  });
}

export async function updateAcademicYear(
  id: string,
  data: { active?: boolean; name?: string; startDate?: Date; endDate?: Date }
) {
  return prisma.academicYear.update({ where: { id }, data, include: academicYearInclude });
}

export async function deactivateAllAcademicYears(schoolId: string, tx?: any) {
  const client = tx ?? prisma;
  await client.academicYear.updateMany({
    where: { schoolId, active: true },
    data: { active: false },
  });
}

export async function findAllTerms(schoolId: string) {
  return prisma.term.findMany({
    where: { schoolId, deletedAt: null },
    include: {
      academicYear: { select: { id: true, name: true } },
      _count: { select: { exams: true, invoices: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function findTermById(schoolId: string, id: string) {
  return prisma.term.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: { academicYear: { select: { id: true, name: true } } },
  });
}

export async function deactivateAllTermsInYear(academicYearId: string, tx?: any) {
  const client = tx ?? prisma;
  await client.term.updateMany({
    where: { academicYearId, active: true },
    data: { active: false },
  });
}

export async function findAllClasses(schoolId: string) {
  return prisma.class.findMany({
    where: { schoolId, deletedAt: null },
    include: classInclude,
    orderBy: { level: "asc" },
  });
}

export async function findClassById(schoolId: string, id: string) {
  return prisma.class.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: classInclude,
  });
}

export async function findAllClassInstances(schoolId: string) {
  return prisma.classInstance.findMany({
    where: { schoolId, deletedAt: null },
    include: classInstanceInclude,
    orderBy: [{ academicYear: { startDate: "desc" } }, { streamName: "asc" }],
  });
}

export async function findClassInstanceById(schoolId: string, id: string) {
  return prisma.classInstance.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: classInstanceInclude,
  });
}

export async function findAllSubjects(schoolId: string) {
  return prisma.subject.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function removeSubjectAssignments(classInstanceId: string, tx?: any) {
  const client = tx ?? prisma;
  await client.classSubjectAssignment.updateMany({
    where: { classInstanceId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
