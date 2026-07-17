import crypto from "crypto";
import { prisma } from "@/infrastructure/database/prisma";
import { hashPassword, verifyPasswordOrThrow } from "@/common/auth";
import { normalizePhone } from "@/common/validation";
import { AppError } from "@/common/errors";
import { extractInitials, generateSchoolCode } from "@/modules/schools/service";
import { writeEventOutbox } from "@/infrastructure/events";

type TxClient = typeof prisma;

function roleName(raw: string): string {
  const normalized = raw.toLowerCase();
  if (normalized === "guardian") return "Guardian";
  if (normalized === "parent") return "Parent";
  if (normalized === "super admin") return "Super Admin";
  if (normalized === "admin") return "Admin";
  if (normalized === "teacher") return "Teacher";
  if (normalized === "accountant") return "Accountant";
  if (normalized === "librarian") return "Librarian";
  if (normalized === "matron") return "Matron";
  if (normalized === "patron") return "Patron";
  return raw;
}

async function findRole(tx: TxClient, name: string) {
  return tx.role.findFirst({ where: { name: roleName(name) } });
}

async function getOrCreateMembershipWithRole(
  tx: TxClient,
  schoolId: string,
  userId: string,
  roleNameStr: string,
) {
  const membership = await tx.schoolMembership.create({
    data: { schoolId, userId, status: "active" },
  });
  const role = await findRole(tx, roleNameStr);
  if (role) {
    await tx.schoolMembershipRole.create({
      data: { membershipId: membership.id, roleId: role.id },
    });
  }
  return membership;
}

// ---------------------------------------------------------------------------
// 1. School + Wallet + Admin User (atomic)
// ---------------------------------------------------------------------------
export interface CreateSchoolWithWalletInput {
  schoolName: string;
  phone: string;
  email?: string | null;
  county: string;
  town: string;
  country: string;
}

export async function createSchoolWithWallet(data: CreateSchoolWithWalletInput) {
  return prisma.$transaction(async (tx: any) => {
    const initials = extractInitials(data.schoolName);
    const prefix = `${data.county.slice(0, 3).toUpperCase()}${data.town.slice(0, 3).toUpperCase()}${initials}`;

    const existing = await tx.school.findMany({
      where: { schoolCode: { startsWith: prefix }, deletedAt: null },
      select: { schoolCode: true },
      orderBy: { schoolCode: "desc" },
      take: 1,
    });
    const sequence = existing.length > 0
      ? parseInt(existing[0]!.schoolCode.slice(-3), 10) + 1
      : 1;
    const schoolCode = generateSchoolCode(data.county, data.town, initials, sequence);

    const codeTaken = await tx.school.findFirst({
      where: { schoolCode, deletedAt: null },
    });
    if (codeTaken) {
      throw AppError.conflict("Generated school code collides with an existing school");
    }

    const school = await tx.school.create({
      data: {
        schoolCode,
        schoolName: data.schoolName,
        schoolPhone: data.phone,
        schoolEmail: data.email ?? null,
        county: data.county,
        town: data.town,
        country: data.country,
      },
    });

    await tx.smsWallet.create({
      data: { schoolId: school.id, balance: 5 },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await hashPassword(otp);

    const user = await tx.user.create({
      data: {
        firstName: "Admin",
        lastName: data.schoolName,
        phone: data.phone,
        email: data.email ?? null,
        hashedPassword: hashedOtp,
      },
    });

    const membership = await tx.schoolMembership.create({
      data: { schoolId: school.id, userId: user.id, status: "active" },
    });

    const superAdminRole = await findRole(tx, "Super Admin");
    if (superAdminRole) {
      await tx.schoolMembershipRole.create({
        data: { membershipId: membership.id, roleId: superAdminRole.id },
      });
    }

    return { school, user, oneTimeCode: otp };
  });
}

// ---------------------------------------------------------------------------
// 2. User + Membership + Role (atomic)
// ---------------------------------------------------------------------------
export interface CreateUserWithMembershipInput {
  firstName: string;
  secondName?: string | null;
  lastName: string;
  phone: string;
  email?: string | null;
  password: string;
  schoolId: string;
  roleName?: string;
}

export async function createUserWithMembership(data: CreateUserWithMembershipInput) {
  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        firstName: data.firstName,
        secondName: data.secondName ?? null,
        lastName: data.lastName,
        phone: normalizePhone(data.phone),
        email: data.email ?? null,
        hashedPassword: await hashPassword(data.password),
      },
      select: {
        id: true, firstName: true, secondName: true, lastName: true,
        phone: true, email: true, status: true, createdAt: true, updatedAt: true,
      },
    });

    const membership = await tx.schoolMembership.create({
      data: { schoolId: data.schoolId, userId: user.id, status: "active" },
    });

    const role = data.roleName ? await findRole(tx, data.roleName) : null;
    if (role) {
      await tx.schoolMembershipRole.create({
        data: { membershipId: membership.id, roleId: role.id },
      });
    }

    return { user, membership };
  });
}

// ---------------------------------------------------------------------------
// 3. Ensure guardian membership (idempotent)
// ---------------------------------------------------------------------------
export async function ensureGuardianMembership(
  tx: TxClient,
  schoolId: string,
  userId: string,
) {
  const existing = await tx.schoolMembership.findFirst({
    where: { schoolId, userId, deletedAt: null },
    include: { roles: { include: { role: true } } },
  });

  if (existing) {
    const hasGuardianRole = existing.roles.some(
      (r: any) => r.role.name === "Guardian",
    );
    if (!hasGuardianRole) {
      const guardianRole = await tx.role.findFirst({
        where: { name: "Guardian" },
      });
      if (guardianRole) {
        await tx.schoolMembershipRole.create({
          data: { membershipId: existing.id, roleId: guardianRole.id },
        });
      }
    }
    return existing;
  }

  const membership = await tx.schoolMembership.create({
    data: { schoolId, userId, status: "active" },
  });
  const guardianRole = await tx.role.findFirst({ where: { name: "Guardian" } });
  if (guardianRole) {
    await tx.schoolMembershipRole.create({
      data: { membershipId: membership.id, roleId: guardianRole.id },
    });
  }
  return membership;
}

// ---------------------------------------------------------------------------
// 4. Find or create user (restore if soft-deleted)
// ---------------------------------------------------------------------------
export interface FindOrCreateUserInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}

export async function findOrCreateUser(
  tx: TxClient,
  data: FindOrCreateUserInput,
) {
  const normalizedPhone = normalizePhone(data.phone);

  let user = await tx.user.findFirst({
    where: {
      OR: [
        { phone: normalizedPhone },
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  if (user) {
    if (user.deletedAt !== null) {
      user = await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: null,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: normalizedPhone,
          email: data.email ?? null,
        },
      });
    }
    return { user, created: false };
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await hashPassword(otp);

  user = await tx.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: normalizedPhone,
      email: data.email ?? null,
      hashedPassword: hashedOtp,
    },
  });

  return { user, created: true, otp };
}

// ---------------------------------------------------------------------------
// 5. Link guardian to student (restore if soft-deleted)
// ---------------------------------------------------------------------------
export interface LinkGuardianInput {
  relationship?: string;
  isPrimary?: boolean;
  canPay?: boolean;
  receivesSms?: boolean;
  receivesEmail?: boolean;
}

export async function linkGuardianToStudent(
  tx: TxClient,
  schoolId: string,
  studentId: string,
  guardianId: string,
  data: LinkGuardianInput,
) {
  const existingLink = await tx.studentGuardian.findUnique({
    where: { studentId_guardianId: { studentId, guardianId } },
  });

  if (existingLink) {
    if (existingLink.deletedAt !== null) {
      await tx.studentGuardian.update({
        where: { id: existingLink.id },
        data: {
          deletedAt: null,
          relationship: (data.relationship ?? existingLink.relationship) as any,
          isPrimary: data.isPrimary ?? existingLink.isPrimary,
        },
      });
      return existingLink;
    }
    throw AppError.conflict("This guardian is already linked to the student.");
  }

  const linked = await tx.studentGuardian.create({
    data: {
      school: { connect: { id: schoolId } },
      student: { connect: { id: studentId } },
      guardian: { connect: { id: guardianId } },
      relationship: (data.relationship ?? "legal_guardian") as any,
      isPrimary: data.isPrimary ?? false,
      canPay: data.canPay ?? true,
      receivesSms: data.receivesSms ?? true,
      receivesEmail: data.receivesEmail ?? false,
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

  await ensureGuardianMembership(tx, schoolId, guardianId);

  return linked;
}

// ---------------------------------------------------------------------------
// 6. Enroll student (create or restore if soft-deleted)
// ---------------------------------------------------------------------------
export interface EnrollStudentInput {
  classInstanceId: string;
  academicYearId: string;
  termId?: string;
}

export async function enrollStudent(
  tx: TxClient,
  schoolId: string,
  studentId: string,
  data: EnrollStudentInput,
) {
  const existingEnrollment = await tx.enrollment.findFirst({
    where: {
      studentId,
      classInstanceId: data.classInstanceId,
      academicYearId: data.academicYearId,
    },
  });

  if (existingEnrollment) {
    if (existingEnrollment.deletedAt !== null) {
      await tx.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { deletedAt: null },
      });
    } else {
      throw AppError.conflict(
        "Student is already enrolled in this class for this academic year.",
      );
    }

    return tx.enrollment.findUnique({
      where: { id: existingEnrollment.id },
      include: {
        classInstance: { include: { class: true } },
        academicYear: true,
        term: true,
      },
    });
  }

  return tx.enrollment.create({
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
}

// ---------------------------------------------------------------------------
// 7. Backfill guardian memberships (auth/login + listMemberships)
// ---------------------------------------------------------------------------
export async function backfillGuardianMemberships(
  tx: TxClient,
  userId: string,
  memberships: any[],
) {
  const guardianLinks = await tx.studentGuardian.findMany({
    where: { guardianId: userId },
    include: { student: { select: { schoolId: true } } },
  });

  let updated = [...memberships];
  for (const link of guardianLinks) {
    const alreadyMember = updated.some(
      (m: any) => m.schoolId === link.student.schoolId,
    );
    if (!alreadyMember) {
      await ensureGuardianMembership(tx, link.student.schoolId, userId);
      updated = await tx.schoolMembership.findMany({
        where: { userId, deletedAt: null },
        include: {
          roles: { include: { role: true } },
          school: true,
        },
      });
      break;
    }
  }
  return updated;
}

// ---------------------------------------------------------------------------
// 8. Approve join request (school + wallet + admin user + membership)
// ---------------------------------------------------------------------------
export interface ApproveJoinRequestInput {
  joinRequestId: string;
  processedBy: string;
  schoolName: string;
  phone: string;
  email?: string | null;
  county?: string | null;
  town?: string | null;
  country?: string | null;
  schoolLevel?: string;
}

export async function approveJoinRequest(
  tx: TxClient,
  input: ApproveJoinRequestInput,
) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await hashPassword(otp);

  const initials = extractInitials(input.schoolName);
  const county = input.county || "Unknown";
  const town = input.town || "Unknown";
  const prefix = `${county.slice(0, 3).toUpperCase()}${town.slice(0, 3).toUpperCase()}${initials}`;

  const existing = await tx.school.findMany({
    where: { schoolCode: { startsWith: prefix }, deletedAt: null },
    select: { schoolCode: true },
    orderBy: { schoolCode: "desc" },
    take: 1,
  });

  const sequence = existing.length > 0
    ? parseInt(existing[0]!.schoolCode.slice(-3), 10) + 1
    : 1;

  const schoolCode = generateSchoolCode(county, town, initials, sequence);

  const codeTaken = await tx.school.findFirst({
    where: { schoolCode, deletedAt: null },
  });
  if (codeTaken) {
    throw AppError.conflict("Generated school code collides with an existing school");
  }

  const school = await tx.school.create({
    data: {
      schoolCode,
      schoolName: input.schoolName,
      schoolPhone: input.phone,
      schoolEmail: input.email ?? undefined,
      county,
      town,
      country: input.country || "Kenya",
      schoolLevel: input.schoolLevel ?? "hybrid_pri_jsecondary",
    },
  });

  await tx.smsWallet.create({
    data: { schoolId: school.id, balance: 5 },
  });

  const adminUser = await tx.user.create({
    data: {
      firstName: "Admin",
      lastName: input.schoolName,
      phone: input.phone,
      email: input.email ?? undefined,
      hashedPassword: hashedOtp,
    },
  });

  const membership = await tx.schoolMembership.create({
    data: { schoolId: school.id, userId: adminUser.id, status: "active" },
  });

  const superAdminRole = await findRole(tx, "Super Admin");
  if (superAdminRole) {
    await tx.schoolMembershipRole.create({
      data: { membershipId: membership.id, roleId: superAdminRole.id },
    });
  }

  return { school, adminUser, oneTimeCode: otp };
}
