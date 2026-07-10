import { AppError } from "@/common/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { writeEventOutbox } from "@/infrastructure/events";
import * as repo from "./repository";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  LinkGuardianInput,
  ArchiveStudentInput,
} from "./schema";
import { findUserById } from "@/modules/users/repository";

export async function listAllStudents(schoolId: string) {
  return repo.findAllStudents(schoolId);
}

export async function getStudentById(schoolId: string, studentId: string) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) {
    throw AppError.notFound("Student not found");
  }
  return student;
}

export async function createStudent(schoolId: string, data: CreateStudentInput) {
  const existing = await repo.findStudentByAdmission(
    schoolId,
    data.admissionNumber
  );
  if (existing) {
    throw AppError.conflict("Admission number already exists for this school", [
      { field: "admissionNumber", issue: "duplicate" },
    ]);
  }

  const student = await prisma.student.create({
    data: {
      school: { connect: { id: schoolId } },
      firstName: data.firstName,
      secondName: data.secondName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      admissionNumber: data.admissionNumber,
      gender: data.gender as any,
      performanceExpectation: data.performanceExpectation as any,
    },
    include: {
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
          classInstance: { include: { class: true } },
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
    },
  });

  if (data.classInstanceId && data.academicYearId) {
    await prisma.enrollment.create({
      data: {
        school: { connect: { id: schoolId } },
        student: { connect: { id: student.id } },
        classInstance: { connect: { id: data.classInstanceId } },
        academicYear: { connect: { id: data.academicYearId } },
        ...(data.termId ? { term: { connect: { id: data.termId } } } : {}),
      },
    });
  }

  await writeEventOutbox({
    schoolId,
    aggregateId: student.id,
    aggregateType: "student",
    eventType: "StudentAdmitted",
    payload: {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
    },
  });

  return repo.findStudentById(schoolId, student.id);
}

export async function updateStudent(
  schoolId: string,
  studentId: string,
  data: UpdateStudentInput
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) {
    throw AppError.notFound("Student not found");
  }
  return repo.updateStudent(studentId, data as any);
}

export async function archiveStudent(
  schoolId: string,
  studentId: string,
  data: ArchiveStudentInput
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) {
    throw AppError.notFound("Student not found");
  }
  if (student.status === "archived") {
    throw AppError.conflict("Student is already archived");
  }

  const updated = await repo.updateStudent(studentId, {
    status: "archived",
    archiveReason: data.reason as any,
  });

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "StudentArchived",
    payload: { reason: data.reason, details: data.details },
  });

  return updated;
}

export async function linkGuardian(
  schoolId: string,
  studentId: string,
  data: LinkGuardianInput
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) {
    throw AppError.notFound("Student not found");
  }

  const guardian = await findUserById(data.guardianId);
  if (!guardian) {
    throw AppError.notFound("Guardian user not found");
  }

  const linked = await repo.linkGuardian(
    schoolId,
    studentId,
    data.guardianId,
    {
      relationship: data.relationship ?? "legal_guardian",
      isPrimary: data.isPrimary ?? false,
      canPay: data.canPay ?? true,
      receivesSms: data.receivesSms ?? true,
      receivesEmail: data.receivesEmail ?? false,
    }
  );

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "GuardianAdded",
    payload: { guardianId: data.guardianId, relationship: data.relationship },
  });

  return linked;
}

export async function unlinkGuardian(
  schoolId: string,
  studentId: string,
  guardianId: string
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) {
    throw AppError.notFound("Student not found");
  }
  await repo.unlinkGuardian(studentId, guardianId);
  return { message: "Guardian unlinked successfully" };
}

export async function enrollStudent(
  schoolId: string,
  studentId: string,
  data: { classInstanceId: string; academicYearId: string; termId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) {
    throw AppError.notFound("Student not found");
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      school: { connect: { id: schoolId } },
      student: { connect: { id: studentId } },
      classInstance: { connect: { id: data.classInstanceId } },
      academicYear: { connect: { id: data.academicYearId } },
      ...(data.termId ? { term: { connect: { id: data.termId } } } : {}),
    },
    include: {
      classInstance: { include: { class: true } },
      academicYear: true,
    },
  });

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "StudentTransferred",
    payload: {
      classInstanceId: data.classInstanceId,
      academicYearId: data.academicYearId,
    },
  });

  return enrollment;
}
