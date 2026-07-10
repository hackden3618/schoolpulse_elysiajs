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

export async function findAllRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function findRoleById(id: string) {
  return prisma.role.findUnique({ where: { id } });
}

export async function findRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name } });
}
