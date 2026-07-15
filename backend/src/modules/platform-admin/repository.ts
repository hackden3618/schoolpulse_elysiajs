import { prisma } from "@/infrastructure/database/prisma"
import type { Prisma } from "@root/generated/prisma-client/client"

const adminSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  hashedPassword: true,
  status: true,
  createdBy: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlatformAdminSelect

export async function findByEmail(email: string) {
  return prisma.platformAdmin.findFirst({
    where: { email, deletedAt: null },
    select: { ...adminSelect, hashedPassword: true },
  })
}

export async function findByPhone(phone: string) {
  return prisma.platformAdmin.findFirst({
    where: { phone, deletedAt: null },
    select: { ...adminSelect, hashedPassword: true },
  })
}

export async function findById(id: string) {
  return prisma.platformAdmin.findFirst({
    where: { id, deletedAt: null },
    select: { ...adminSelect, hashedPassword: true },
  })
}

export async function create(data: Prisma.PlatformAdminCreateInput) {
  return prisma.platformAdmin.create({ data, select: adminSelect })
}

export async function update(id: string, data: Prisma.PlatformAdminUpdateInput) {
  return prisma.platformAdmin.update({ where: { id }, data, select: adminSelect })
}

export async function list() {
  return prisma.platformAdmin.findMany({
    where: { deletedAt: null },
    select: adminSelect,
    orderBy: { createdAt: "desc" },
  })
}

export async function updateLastLogin(id: string) {
  return prisma.platformAdmin.update({
    where: { id },
    data: { lastLogin: new Date() },
    select: adminSelect,
  })
}

export async function findJoinRequestById(id: string) {
  return prisma.joinRequest.findFirst({ where: { id, deletedAt: null } })
}

export async function findLatestSchoolCode(prefix: string) {
  return prisma.school.findFirst({
    where: { schoolCode: { startsWith: prefix } },
    orderBy: { schoolCode: "desc" },
    select: { schoolCode: true },
  })
}

export async function findRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name } })
}

export async function findAllSchools() {
  return prisma.school.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { students: true, memberships: true } },
    },
  })
}

export async function findSchoolById(id: string) {
  return prisma.school.findFirst({ where: { id, deletedAt: null } })
}

export async function findSchoolByCode(code: string) {
  return prisma.school.findFirst({ where: { schoolCode: code, deletedAt: null } })
}

export async function findJoinRequestByOneTimeCode(code: string) {
  return prisma.joinRequest.findFirst({
    where: { oneTimeCode: code, deletedAt: null },
  })
}

export async function updateJoinRequest(id: string, data: Prisma.JoinRequestUpdateInput) {
  return prisma.joinRequest.update({ where: { id }, data })
}

export async function softDeleteSchool(id: string) {
  return prisma.school.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export async function softDelete(id: string) {
  return prisma.platformAdmin.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
