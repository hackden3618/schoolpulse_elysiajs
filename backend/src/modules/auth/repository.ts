import { prisma } from "@/infrastructure/database/prisma"
import type { Prisma } from "@root/generated/prisma-client/client"

const userSelect = {
  id: true,
  firstName: true,
  secondName: true,
  lastName: true,
  phone: true,
  email: true,
  hashedPassword: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

const membershipInclude = {
  user: { select: { id: true, firstName: true, secondName: true, lastName: true, phone: true, email: true, status: true, createdAt: true, updatedAt: true } },
  roles: { include: { role: true } },
} as const

export async function findUserByPhone(phone: string) {
  return prisma.user.findFirst({ where: { phone, deletedAt: null }, select: userSelect })
}

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null }, select: userSelect })
}

export async function findUserById(id: string) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect })
}

export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data, select: { ...userSelect, hashedPassword: true } })
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data, select: { ...userSelect, hashedPassword: true } })
}

export async function findActiveMemberships(userId: string) {
  return prisma.schoolMembership.findMany({
    where: { userId, deletedAt: null, status: "active" },
    include: membershipInclude,
  })
}

export async function findMembershipById(id: string) {
  return prisma.schoolMembership.findFirst({
    where: { id, deletedAt: null },
    include: membershipInclude,
  })
}

export async function findMembershipBySchoolAndUser(schoolId: string, userId: string) {
  return prisma.schoolMembership.findFirst({
    where: { schoolId, userId, deletedAt: null, status: "active" },
    include: membershipInclude,
  })
}

export async function findSchoolByCode(code: string) {
  return prisma.school.findUnique({ where: { schoolCode: code } })
}

export async function findRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name } })
}

export async function createMembershipInTx(tx: any, schoolId: string, userId: string) {
  return tx.schoolMembership.create({
    data: { school: { connect: { id: schoolId } }, user: { connect: { id: userId } } },
  })
}

export async function createMembershipRoleInTx(tx: any, membershipId: string, roleId: string) {
  return tx.schoolMembershipRole.create({ data: { membershipId, roleId } })
}

export async function createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
  return prisma.passwordResetToken.create({ data })
}

export async function findValidResetToken(tokenHash: string) {
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gte: new Date() } },
  })
}

export async function markResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } })
}

export async function createJoinRequest(data: {
  schoolName: string
  phone: string
  email?: string
  adminPhone: string
  adminEmail?: string
  county?: string
  country?: string
  town?: string
  requestedBy: string
}) {
  return prisma.joinRequest.create({ data: { ...data, status: "submitted" } })
}

export async function findAllJoinRequests() {
  return prisma.joinRequest.findMany({
    where: { deletedAt: null },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      schoolName: true,
      phone: true,
      email: true,
      county: true,
      country: true,
      town: true,
      requestedAt: true,
      requestedBy: true,
      status: true,
      processedBy: true,
      processedAt: true,
      deletedAt: true,
    },
  })
}

export async function findJoinRequestById(id: string) {
  return prisma.joinRequest.findFirst({ where: { id, deletedAt: null } })
}

export async function updateJoinRequest(id: string, data: Prisma.JoinRequestUpdateInput) {
  return prisma.joinRequest.update({ where: { id }, data })
}

export async function findLatestSchoolCode(prefix: string) {
  return prisma.school.findFirst({
    where: { schoolCode: { startsWith: prefix } },
    orderBy: { schoolCode: "desc" },
    select: { schoolCode: true },
  })
}
