import { hashPassword } from "@/common/auth";
import { AppError } from "@/common/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { writeEventOutbox } from "@/infrastructure/events";
import * as repo from "./repository";
import type {
  CreateUserInput,
  UpdateUserInput,
  CreateMembershipInput,
  UpdateMembershipInput,
  AssignRolesInput,
} from "./schema";

export async function listAllUsers(schoolId: string) {
  return repo.findAllUsers(schoolId);
}

export async function getUserById(schoolId: string, userId: string) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  const membership = await repo.findMembership(schoolId, userId);
  const guardianLinks = await prisma.studentGuardian.findMany({
    where: { guardianId: userId, student: { schoolId, status: "active" } }
  });

  if (!membership && guardianLinks.length === 0) {
    throw AppError.forbidden("User does not belong to this school");
  }

  const { hashedPassword, ...safeUser } = user;
  return {
    ...safeUser,
    isGuardian: guardianLinks.length > 0
  };
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        ...(data.phone ? [{ phone: data.phone }] : []),
        ...(data.email ? [{ email: data.email }] : [])
      ]
    }
  });

  if (existing) {
    if (existing.deletedAt !== null) {
      const pw = data.password
        ? await hashPassword(data.password)
        : existing.hashedPassword;
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          hashedPassword: pw,
        },
      });
    } else {
      throw AppError.conflict("Phone number or email is already registered", [
        { field: "phone", issue: "duplicate" },
      ]);
    }
  }

  const hashedPassword = data.password
    ? await hashPassword(data.password)
    : undefined;

  const user = await repo.createUser({
    firstName: data.firstName,
    secondName: data.secondName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    ...(hashedPassword ? { hashedPassword } : {}),
  });

  await writeEventOutbox({
    aggregateId: user.id,
    aggregateType: "user",
    eventType: "UserCreated",
    payload: { phone: user.phone },
  });

  return user;
}

export async function searchMembers(schoolId: string, q: string) {
  const { members, guardiansWithStudents } = await repo.searchMembers(schoolId, q);

  const userIdSet = new Set<string>()
  const results: any[] = []

  for (const m of members) {
    userIdSet.add(m.userId)
    const roles = m.roles.map((r: any) => r.role?.name).filter(Boolean)
    results.push({
      userId: m.userId,
      name: `${m.user.firstName} ${m.user.lastName || ""}`.trim(),
      phone: m.user.phone,
      email: m.user.email,
      roles,
      studentInfo: [] as { name: string; admissionNumber: string }[],
    })
  }

  for (const sg of guardiansWithStudents) {
    const uid = sg.guardian.id
    const studentName = `${sg.student.firstName} ${sg.student.lastName || ""}`.trim()
    const existing = results.find((r: any) => r.userId === uid)
    if (existing) {
      existing.studentInfo.push({
        name: studentName,
        admissionNumber: sg.student.admissionNumber,
      })
    } else if (!userIdSet.has(uid)) {
      userIdSet.add(uid)
      results.push({
        userId: uid,
        name: `${sg.guardian.firstName} ${sg.guardian.lastName || ""}`.trim(),
        phone: sg.guardian.phone,
        email: sg.guardian.email,
        roles: ["Guardian"],
        studentInfo: [{
          name: studentName,
          admissionNumber: sg.student.admissionNumber,
        }],
      })
    }
  }

  return results.slice(0, 30)
}

export async function updateUser(
  schoolId: string,
  userId: string,
  data: UpdateUserInput
) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  const membership = await repo.findMembership(schoolId, userId);
  if (!membership) {
    throw AppError.forbidden("User does not belong to this school");
  }
  return repo.updateUser(userId, data as any);
}

export async function deleteUser(schoolId: string, userId: string) {
  const user = await repo.findUserById(userId)
  if (!user) throw AppError.notFound("User not found")
  const membership = await repo.findMembership(schoolId, userId)
  if (!membership) throw AppError.forbidden("User does not belong to this school")
  await repo.deleteMembership(schoolId, userId)
  return { message: "User removed from school" }
}

export async function listAllMemberships(schoolId: string) {
  return repo.findAllMemberships(schoolId);
}

export async function createMembership(
  schoolId: string,
  data: CreateMembershipInput
) {
  const user = await repo.findUserById(data.userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const existing = await repo.findMembership(schoolId, data.userId);
  if (existing) {
    throw AppError.conflict("User already has a membership in this school");
  }

  const membership = await prisma.$transaction(async (tx: any) => {
    const m = await tx.schoolMembership.create({
      data: {
        school: { connect: { id: schoolId } },
        user: { connect: { id: data.userId } },
      },
      include: repo["membershipInclude"],
    });

    if (data.roleIds && data.roleIds.length > 0) {
      for (const roleId of data.roleIds) {
        const role = await repo.findRoleById(roleId);
        if (!role) {
          throw AppError.notFound(`Role ${roleId} not found`);
        }
        await tx.schoolMembershipRole.create({
          data: { membershipId: m.id, roleId },
        });
      }
    }

    return m;
  });

  await writeEventOutbox({
    schoolId,
    aggregateId: membership!.id,
    aggregateType: "membership",
    eventType: "MembershipCreated",
    payload: { userId: data.userId },
  });

  return membership;
}

export async function updateMembership(
  membershipId: string,
  data: UpdateMembershipInput
) {
  const membership = await repo.findMembershipById(membershipId);
  if (!membership) {
    throw AppError.notFound("Membership not found");
  }
  return repo.updateMembership(membershipId, data as any);
}

export async function assignRoles(
  membershipId: string,
  data: AssignRolesInput
) {
  const membership = await repo.findMembershipById(membershipId);
  if (!membership) {
    throw AppError.notFound("Membership not found");
  }

  await prisma.$transaction(async (tx: any) => {
    await repo.removeRolesFromMembership(membershipId, tx);

    for (const roleId of data.roleIds) {
      const role = await repo.findRoleById(roleId);
      if (!role) {
        throw AppError.notFound(`Role ${roleId} not found`);
      }
      await tx.schoolMembershipRole.create({
        data: { membershipId, roleId },
      });
    }
  });

  await writeEventOutbox({
    schoolId: membership.schoolId,
    aggregateId: membershipId,
    aggregateType: "membership",
    eventType: "RoleAssigned",
    payload: { roleIds: data.roleIds },
  });

  return repo.findMembershipById(membershipId);
}
