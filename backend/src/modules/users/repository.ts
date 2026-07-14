import { prisma } from "@/infrastructure/database/prisma";
import type { Prisma } from "@root/generated/prisma-client/client";

const userSelect = {
  id: true,
  firstName: true,
  secondName: true,
  lastName: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const membershipInclude = {
  user: { select: userSelect },
  roles: {
    include: {
      role: true,
    },
  },
} as const;

export async function findAllUsers(schoolId: string) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      memberships: { some: { schoolId, deletedAt: null } },
    },
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { ...userSelect, hashedPassword: true },
  });
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findFirst({
    where: { phone, deletedAt: null },
    select: { ...userSelect, hashedPassword: true },
  });
}

export async function createUser(
  data: Prisma.UserCreateInput
) {
  return prisma.user.create({
    data,
    select: userSelect,
  });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

export async function findMembership(schoolId: string, userId: string) {
  return prisma.schoolMembership.findFirst({
    where: { schoolId, userId, deletedAt: null },
    include: membershipInclude,
  });
}

export async function findMembershipById(id: string) {
  return prisma.schoolMembership.findFirst({
    where: { id, deletedAt: null },
    include: membershipInclude,
  });
}

export async function findAllMemberships(schoolId: string) {
  return prisma.schoolMembership.findMany({
    where: { schoolId, deletedAt: null },
    include: membershipInclude,
    orderBy: { joinedAt: "desc" },
  });
}

export async function updateMembership(
  id: string,
  data: Prisma.SchoolMembershipUpdateInput
) {
  return prisma.schoolMembership.update({
    where: { id },
    data,
    include: membershipInclude,
  });
}

export async function removeRolesFromMembership(
  membershipId: string,
  tx?: any
) {
  const client = tx ?? prisma;
  await client.schoolMembershipRole.deleteMany({
    where: { membershipId },
  });
}

export async function deleteMembership(schoolId: string, userId: string) {
  return prisma.schoolMembership.updateMany({
    where: { schoolId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function findAllRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function findRoleById(id: string) {
  return prisma.role.findUnique({ where: { id } });
}

export async function findRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name } });
}

export async function searchMembers(schoolId: string, q: string) {
  const members = await prisma.schoolMembership.findMany({
    where: {
      schoolId,
      deletedAt: null,
      user: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
    },
    include: membershipInclude,
    take: 20,
  });

  const guardiansWithStudents = await prisma.studentGuardian.findMany({
    where: {
      schoolId,
      deletedAt: null,
      guardian: { deletedAt: null },
      student: { deletedAt: null, status: "active" },
      OR: [
        { student: { firstName: { contains: q, mode: "insensitive" } } },
        { student: { lastName: { contains: q, mode: "insensitive" } } },
        { student: { admissionNumber: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: {
      guardian: { select: userSelect },
      student: { select: { firstName: true, lastName: true, admissionNumber: true } },
    },
    take: 20,
  });

  return { members, guardiansWithStudents };
}
