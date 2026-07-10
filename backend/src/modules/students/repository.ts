import { prisma } from "@/infrastructure/database/prisma";
import type { Prisma } from "@root/generated/prisma-client/client";

const studentInclude = {
  guardians: {
    where: { deletedAt: null },
    include: {
      guardian: {
        select: {
          id: true, firstName: true, secondName: true,
          lastName: true, phone: true, email: true,
        },
      },
    },
  },
  enrollments: {
    where: { deletedAt: null },
    include: {
      classInstance: {
        include: {
          class: true,
        },
      },
      academicYear: true,
      term: true,
    },
    orderBy: { createdAt: "desc" },
  },
  _count: {
    select: {
      enrollments: true,
      invoices: true,
      attendanceRecords: true,
    },
  },
} satisfies Prisma.StudentInclude;

export async function findAllStudents(schoolId: string) {
  return prisma.student.findMany({
    where: { schoolId, deletedAt: null, status: { not: "archived" } },
    include: studentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findStudentById(schoolId: string, id: string) {
  return prisma.student.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: studentInclude,
  });
}

export async function findStudentByAdmission(
  schoolId: string,
  admissionNumber: string
) {
  return prisma.student.findFirst({
    where: { schoolId, admissionNumber, deletedAt: null },
  });
}

export async function updateStudent(
  id: string,
  data: Prisma.StudentUpdateInput
) {
  return prisma.student.update({
    where: { id },
    data,
    include: studentInclude,
  });
}

export async function linkGuardian(
  schoolId: string,
  studentId: string,
  guardianId: string,
  data: {
    relationship: string;
    isPrimary: boolean;
    canPay: boolean;
    receivesSms: boolean;
    receivesEmail: boolean;
  }
) {
  return prisma.studentGuardian.create({
    data: {
      school: { connect: { id: schoolId } },
      student: { connect: { id: studentId } },
      guardian: { connect: { id: guardianId } },
      relationship: data.relationship as any,
      isPrimary: data.isPrimary,
      canPay: data.canPay,
      receivesSms: data.receivesSms,
      receivesEmail: data.receivesEmail,
    },
    include: {
      guardian: {
        select: {
          id: true, firstName: true, secondName: true,
          lastName: true, phone: true, email: true,
        },
      },
    },
  });
}

export async function unlinkGuardian(
  studentId: string,
  guardianId: string
) {
  return prisma.studentGuardian.updateMany({
    where: { studentId, guardianId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
