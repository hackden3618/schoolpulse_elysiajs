import { AppError } from "@/common/errors";
import { hashPassword } from "@/common/auth";
import { normalizePhone } from "@/common/validation";
import { prisma } from "@/infrastructure/database/prisma";
import { writeEventOutbox, writeAuditLog } from "@/infrastructure/events";
import { sendSingleSms } from "@/infrastructure/messaging/sms/sms.provider";
import { HOST } from "@/config";
import crypto from "crypto";
import * as repo from "./repository";
import { StudentPolicy } from "./policy";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  LinkGuardianInput,
  ArchiveStudentInput,
  AddGuardianByDetailsInput,
  UpdateEnrollmentInput,
} from "./schema";
import { findUserById, findUserByPhone } from "@/modules/users/repository";
import { findUserByEmail } from "@/modules/auth/repository";

export async function listAllStudents(schoolId: string, includeArchived?: boolean) {
  return repo.findAllStudents(schoolId, includeArchived);
}

export async function listMyStudents(schoolId: string, userId: string) {
  return repo.findStudentsByGuardian(schoolId, userId);
}

export async function getStudentById(schoolId: string, studentId: string) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");
  return student;
}

export async function createStudent(
  schoolId: string,
  data: CreateStudentInput,
  authUser?: { id: string; membershipId?: string }
) {
  const existing = await repo.findStudentByAdmission(schoolId, data.admissionNumber);
  if (existing) {
    throw AppError.conflict("Admission number already exists for this school", [
      { field: "admissionNumber", issue: "duplicate" },
    ]);
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { schoolName: true, schoolCode: true } });
  if (!school) throw AppError.notFound("School not found");

  const smsJobs: { phone: string; message: string }[] = [];

  const student = await prisma.$transaction(async (tx: any) => {
    // 1. Create the student
    const newStudent = await tx.student.create({
      data: {
        school: { connect: { id: schoolId } },
        firstName: data.firstName,
        secondName: data.secondName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        admissionNumber: data.admissionNumber,
        gender: data.gender as any,
        performanceExpectation: data.performanceExpectation as any,
        specialNeeds: data.specialNeeds ?? {},
      },
    });

    // 2. Enroll if class provided
    if (data.classInstanceId && data.academicYearId) {
      await tx.enrollment.create({
        data: {
          school: { connect: { id: schoolId } },
          student: { connect: { id: newStudent.id } },
          classInstance: { connect: { id: data.classInstanceId } },
          academicYear: { connect: { id: data.academicYearId } },
          ...(data.termId ? { term: { connect: { id: data.termId } } } : {}),
        },
      });
    }

    // 3. Create or find guardians, then link
    if (data.guardians && data.guardians.length > 0) {
      const guardianRole = await tx.role.findFirst({ where: { name: "Guardian" } });

      for (let i = 0; i < data.guardians.length; i++) {
        const g = data.guardians[i]!;
        const isPrimary = i === 0;

        const normalizedGuardianPhone = normalizePhone(g.phone)
        let guardianUser = await tx.user.findFirst({
          where: {
            OR: [
              { phone: normalizedGuardianPhone },
              ...(g.email ? [{ email: g.email }] : [])
            ]
          }
        });

        if (guardianUser) {
          if (guardianUser.deletedAt !== null) {
            const otp = crypto.randomInt(100000, 999999).toString();
            const hashedOtp = await hashPassword(otp);
            guardianUser = await tx.user.update({
              where: { id: guardianUser.id },
              data: {
                deletedAt: null,
                firstName: g.firstName,
                lastName: g.lastName,
                phone: normalizedGuardianPhone,
                email: g.email ?? null,
                hashedPassword: hashedOtp,
              },
            });
            smsJobs.push({
              phone: normalizedGuardianPhone,
              message: `Admitted to ${school.schoolName}. Code: ${school.schoolCode}. Pwd: ${otp}. Login ${HOST}`,
            });
          }
        }

        if (!guardianUser) {
          const otp = crypto.randomInt(100000, 999999).toString();
          const hashedOtp = await hashPassword(otp);
          guardianUser = await tx.user.create({
            data: {
              firstName: g.firstName,
              lastName: g.lastName,
              phone: normalizedGuardianPhone,
              email: g.email ?? null,
              hashedPassword: hashedOtp,
            },
          });
          smsJobs.push({
            phone: normalizedGuardianPhone,
            message: `Admitted to ${school.schoolName}. Code: ${school.schoolCode}. Pwd: ${otp}. Login ${HOST}`,
          });
        } else {
          smsJobs.push({
            phone: normalizedGuardianPhone,
            message: `Student admitted to ${school.schoolName}. Code: ${school.schoolCode}. Login ${HOST}`,
          });
        }

        await tx.studentGuardian.create({
          data: {
            school: { connect: { id: schoolId } },
            student: { connect: { id: newStudent.id } },
            guardian: { connect: { id: guardianUser!.id } },
            relationship: (g.relationship ?? "legal_guardian") as any,
            isPrimary,
            canPay: true,
            receivesSms: true,
            receivesEmail: false,
          },
        });

        const existingMembership = await tx.schoolMembership.findFirst({
          where: { schoolId, userId: guardianUser!.id, deletedAt: null },
          include: { roles: { include: { role: true } } },
        });
        if (!existingMembership) {
          const membership = await tx.schoolMembership.create({
            data: { schoolId, userId: guardianUser!.id, status: "active" },
          });
          if (guardianRole) {
            await tx.schoolMembershipRole.create({
              data: { membershipId: membership.id, roleId: guardianRole.id },
            });
          }
        } else if (guardianRole) {
          const hasGuardianRole = existingMembership.roles.some((r: any) => r.role.name === "Guardian");
          if (!hasGuardianRole) {
            await tx.schoolMembershipRole.create({
              data: { membershipId: existingMembership.id, roleId: guardianRole.id },
            });
          }
        }
      }
    }

    return newStudent;
  });

  // Send SMS notifications after transaction
  for (const job of smsJobs) {
    await sendSingleSms(job.phone, job.message);
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

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "admit",
    tableName: "student",
    recordId: student.id,
    newValue: { admissionNumber: student.admissionNumber, firstName: student.firstName, lastName: student.lastName },
  }).catch(() => {});

  return repo.findStudentById(schoolId, student.id);
}

export async function updateStudent(
  schoolId: string,
  studentId: string,
  data: UpdateStudentInput
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");
  return repo.updateStudent(studentId, data as any);
}

export async function archiveStudent(
  schoolId: string,
  studentId: string,
  data: ArchiveStudentInput,
  authUser?: { id: string; membershipId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");
  if (student.status === "archived") throw AppError.conflict("Student is already archived");

  const activeEnrollment = await prisma.enrollment.findFirst({
    where: { studentId, schoolId, deletedAt: null, status: "active" },
    select: { id: true },
  });
  StudentPolicy.canArchive(student, Boolean(activeEnrollment));

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

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "archive",
    tableName: "student",
    recordId: studentId,
    oldValue: { status: student.status },
    newValue: { status: "archived", archiveReason: data.reason },
  }).catch(() => {});

  return updated;
}

export async function unarchiveStudent(
  schoolId: string,
  studentId: string,
  authUser?: { id: string; membershipId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId)
  if (!student) throw AppError.notFound("Student not found")
  if (student.status !== "archived") throw AppError.conflict("Student is not archived")

  const updated = await repo.updateStudent(studentId, {
    status: "active",
    archiveReason: null,
  })

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "StudentTransferred",
    payload: { action: "unarchived" },
  })

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "unarchive",
    tableName: "student",
    recordId: studentId,
    oldValue: { status: student.status },
    newValue: { status: "active" },
  }).catch(() => {})

  return updated
}

async function ensureGuardianMembership(schoolId: string, guardianId: string): Promise<void> {
  const existing = await prisma.schoolMembership.findFirst({
    where: { schoolId, userId: guardianId, deletedAt: null },
    include: { roles: { include: { role: true } } },
  })
  if (!existing) {
    const membership = await prisma.schoolMembership.create({
      data: { schoolId, userId: guardianId, status: "active" },
    })
    const guardianRole = await prisma.role.findUnique({ where: { name: "Guardian" } })
    if (guardianRole) {
      await prisma.schoolMembershipRole.create({
        data: { membershipId: membership.id, roleId: guardianRole.id },
      })
    }
  } else {
    const hasGuardianRole = existing.roles.some((r: any) => r.role.name === "Guardian")
    if (!hasGuardianRole) {
      const guardianRole = await prisma.role.findUnique({ where: { name: "Guardian" } })
      if (guardianRole) {
        await prisma.schoolMembershipRole.create({
          data: { membershipId: existing.id, roleId: guardianRole.id },
        })
      }
    }
  }
}

export async function linkGuardian(
  schoolId: string,
  studentId: string,
  data: LinkGuardianInput,
  authUser?: { id: string; membershipId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");

  const guardian = await findUserById(data.guardianId);
  if (!guardian) throw AppError.notFound("Guardian user not found");

  const existingLink = await prisma.studentGuardian.findUnique({
    where: { studentId_guardianId: { studentId, guardianId: data.guardianId } }
  });

  if (existingLink) {
    if (existingLink.deletedAt !== null) {
      await prisma.studentGuardian.update({
        where: { id: existingLink.id },
        data: {
          deletedAt: null,
          relationship: data.relationship ?? existingLink.relationship,
          isPrimary: data.isPrimary ?? existingLink.isPrimary,
        },
      });
      return existingLink;
    } else {
      throw AppError.conflict("This guardian is already linked to the student.");
    }
  }

  const linked = await repo.linkGuardian(schoolId, studentId, data.guardianId, {
    relationship: data.relationship ?? "legal_guardian",
    isPrimary: data.isPrimary ?? false,
    canPay: data.canPay ?? true,
    receivesSms: data.receivesSms ?? true,
    receivesEmail: data.receivesEmail ?? false,
  });

  await ensureGuardianMembership(schoolId, data.guardianId);

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "GuardianAdded",
    payload: { guardianId: data.guardianId, relationship: data.relationship },
  });

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "link_guardian",
    tableName: "student_guardian",
    recordId: linked.id,
    newValue: { studentId, guardianId: data.guardianId, relationship: data.relationship },
  }).catch(() => {});

  return linked;
}

export async function unlinkGuardian(
  schoolId: string,
  studentId: string,
  guardianId: string,
  authUser?: { id: string; membershipId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");

  // Business Rule: A student must always have at least one guardian
  const guardianCount = student.guardians?.length ?? 0;
  if (guardianCount <= 1) {
    throw AppError.validation("Cannot remove the last guardian. A student must have at least one guardian.");
  }

  await repo.unlinkGuardian(studentId, guardianId);

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "GuardianRemoved",
    payload: { guardianId },
  });

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "unlink_guardian",
    tableName: "student_guardian",
    recordId: `${studentId}:${guardianId}`,
    oldValue: { studentId, guardianId },
  }).catch(() => {});

  return { message: "Guardian unlinked successfully" };
}

export async function enrollStudent(
  schoolId: string,
  studentId: string,
  data: { classInstanceId: string; academicYearId: string; termId?: string },
  authUser?: { id: string; membershipId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");

  const [academicYear, term] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId } }),
    data.termId
      ? prisma.term.findFirst({ where: { id: data.termId, schoolId } })
      : Promise.resolve(null),
  ]);

  // Business rules: inactive year/term, inactive student, duplicate enrollment.
  StudentPolicy.canEnroll(student, academicYear, term);

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      classInstanceId: data.classInstanceId,
      academicYearId: data.academicYearId,
    }
  });

  StudentPolicy.assertNotDuplicateEnrollment(existingEnrollment);

  if (existingEnrollment) {
    if (existingEnrollment.deletedAt !== null) {
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { deletedAt: null },
      });
    }
  }

  const enrollment = existingEnrollment
    ? await prisma.enrollment.findUnique({
        where: { id: existingEnrollment.id },
        include: {
          classInstance: { include: { class: true } },
          academicYear: true,
          term: true,
        },
      })
    : await prisma.enrollment.create({
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
    payload: { classInstanceId: data.classInstanceId, academicYearId: data.academicYearId, action: "enrolled" },
  });

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "enroll",
    tableName: "enrollment",
    recordId: enrollment?.id ?? "",
    newValue: { studentId, classInstanceId: data.classInstanceId, academicYearId: data.academicYearId },
  }).catch(() => {});

  return enrollment;
}

export async function updateEnrollment(
  schoolId: string,
  studentId: string,
  enrollmentId: string,
  data: UpdateEnrollmentInput,
  authUser?: { id: string; membershipId?: string }
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, schoolId, studentId },
  });
  if (!enrollment) throw AppError.notFound("Enrollment not found");

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      ...(data.classInstanceId ? { classInstanceId: data.classInstanceId } : {}),
      ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}),
      ...(data.termId !== undefined ? { termId: data.termId } : {}),
      ...(data.status ? { status: data.status as any } : {}),
    },
    include: {
      classInstance: { include: { class: true } },
      academicYear: true,
      term: true,
    },
  });

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "StudentTransferred",
    payload: {
      enrollmentId,
      updates: data,
      action: "updated"
    },
  });

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "update_enrollment",
    tableName: "enrollment",
    recordId: enrollmentId,
    newValue: data,
  }).catch(() => {});

  return updated;
}

/**
 * Add a guardian to a student by their contact details.
 * If a user with the given phone OR email already exists, link them.
 * Otherwise create a new user account for the guardian first.
 */
export async function addGuardianByDetails(
  schoolId: string,
  studentId: string,
  data: AddGuardianByDetailsInput,
  authUser?: { id: string; membershipId?: string }
) {
  const student = await repo.findStudentById(schoolId, studentId);
  if (!student) throw AppError.notFound("Student not found");

  // Look up by normalized phone first, then by email
  const normalizedDataPhone = normalizePhone(data.phone)
  let guardianUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedDataPhone },
        ...(data.email ? [{ email: data.email }] : [])
      ]
    }
  });

  if (guardianUser) {
    if (guardianUser.deletedAt !== null) {
      guardianUser = await prisma.user.update({
        where: { id: guardianUser.id },
        data: {
          deletedAt: null,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: normalizedDataPhone,
          email: data.email ?? null,
        },
      });
    }
  } else {
    const defaultHashedPassword = await hashPassword("default_guardian_otp_pass");
    guardianUser = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: normalizedDataPhone,
        email: data.email ?? null,
        hashedPassword: defaultHashedPassword,
      },
    });
  }

  // Check they are not already linked to this student
  const existingLink = await prisma.studentGuardian.findUnique({
    where: { studentId_guardianId: { studentId, guardianId: guardianUser.id } }
  });

  if (existingLink) {
    if (existingLink.deletedAt !== null) {
      await prisma.studentGuardian.update({
        where: { id: existingLink.id },
        data: {
          deletedAt: null,
          relationship: data.relationship ?? existingLink.relationship,
          isPrimary: data.isPrimary ?? existingLink.isPrimary,
        },
      });
      return existingLink;
    } else {
      throw AppError.conflict("This guardian is already linked to the student.");
    }
  }

  const linked = await repo.linkGuardian(schoolId, studentId, guardianUser.id, {
    relationship: data.relationship ?? "legal_guardian",
    isPrimary: data.isPrimary ?? false,
    canPay: true,
    receivesSms: true,
    receivesEmail: false,
  });

  await ensureGuardianMembership(schoolId, guardianUser.id);

  await writeEventOutbox({
    schoolId,
    aggregateId: studentId,
    aggregateType: "student",
    eventType: "GuardianAdded",
    payload: { guardianId: guardianUser.id, relationship: data.relationship },
  });

  await writeAuditLog({
    schoolId,
    actorUserId: authUser?.id,
    actorMembershipId: authUser?.membershipId,
    action: "link_guardian",
    tableName: "student_guardian",
    recordId: linked.id,
    newValue: { studentId, guardianId: guardianUser.id, relationship: data.relationship },
  }).catch(() => {});

  return linked;
}


