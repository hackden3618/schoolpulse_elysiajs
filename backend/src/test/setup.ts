import { beforeAll, afterAll, afterEach } from "bun:test"
import { prisma } from "@/infrastructure/database/prisma"
import { hashPassword } from "@/common/auth"

export async function seedBaseData() {
  const roles = [
    "Principal", "Deputy Principal", "Academic Master", "Super Admin",
    "Bursar", "Teacher", "Admissions", "Reception", "Guardian",
  ]

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      create: { name, description: `${name} role` },
      update: {},
    })
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "Super Admin" } })
  const hashed = await hashPassword("admin123")

  await prisma.platformAdmin.upsert({
    where: { email: "test@schoolpulse.co.ke" },
    create: {
      firstName: "Test",
      lastName: "Admin",
      email: "test@schoolpulse.co.ke",
      phone: "+254700000001",
      role: "super_admin",
      hashedPassword: hashed,
      status: "active",
    },
    update: {},
  })
}

export async function seedSchool(name = "Test School") {
  const school = await prisma.school.create({
    data: {
      schoolName: name,
      schoolCode: "TST001",
      email: "test@school.com",
      phone: "+254700000002",
      schoolLevel: "primary",
      address: "123 Test Street",
    },
  })
  return school
}

export async function seedUser(overrides: Partial<{
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}> = {}) {
  const hashed = await hashPassword(overrides.password || "TestPass123")
  return prisma.user.create({
    data: {
      firstName: overrides.firstName || "John",
      lastName: overrides.lastName || "Doe",
      email: overrides.email || "john@example.com",
      phone: overrides.phone || "+254700000003",
      hashedPassword: hashed,
    },
  })
}

export async function seedMembership(userId: string, schoolId: string, roleName = "Teacher") {
  const role = await prisma.role.findUnique({ where: { name: roleName } })
  if (!role) throw new Error(`Role ${roleName} not found`)

  const membership = await prisma.schoolMembership.create({
    data: {
      userId,
      schoolId,
      status: "active",
      roles: {
        create: { roleId: role.id },
      },
    },
    include: { roles: { include: { role: true } } },
  })
  return membership
}

export async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations')
  `

  for (const { tablename } of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`)
  }
}

export function getAuthToken(userId: string, schoolId: string, roles: string[]) {
  const { signToken } = require("@/shared/jwt")
  return signToken({ sub: userId, schoolId, roles })
}
