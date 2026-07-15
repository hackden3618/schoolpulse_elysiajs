import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { prisma } from "@/infrastructure/database/prisma"
import { hashPassword } from "@/common/auth"
import { AppError } from "@/common/errors"
import * as authService from "../service"
import * as repo from "../repository"

let testSchoolId: string
let testUserId: string
let testUserPassword = "TestPass123"

beforeAll(async () => {
  const school = await prisma.school.create({
    data: {
      schoolName: "Auth Test School",
      schoolCode: "AUTH01",
      schoolPhone: "+254700001000",
      schoolEmail: "auth@test.com",
      county: "Nairobi",
      town: "Nairobi",
      schoolLevel: "primary",
    },
  })
  testSchoolId = school.id

  await prisma.role.upsert({
    where: { name: "Teacher" },
    create: { name: "Teacher", description: "Teacher role" },
    update: {},
  })
  await prisma.role.upsert({
    where: { name: "Guardian" },
    create: { name: "Guardian", description: "Guardian role" },
    update: {},
  })

  const hashed = await hashPassword(testUserPassword)
  const user = await prisma.user.create({
    data: {
      firstName: "Auth",
      lastName: "Test",
      email: "auth.test@example.com",
      phone: "+254700001001",
      hashedPassword: hashed,
    },
  })
  testUserId = user.id

  const role = await prisma.role.findUnique({ where: { name: "Teacher" } })
  await prisma.schoolMembership.create({
    data: {
      userId: user.id,
      schoolId: school.id,
      status: "active",
      roles: { create: { roleId: role!.id } },
    },
  })
})

afterAll(async () => {
  await prisma.schoolMembershipRole.deleteMany({ where: { membership: { schoolId: testSchoolId } } })
  await prisma.schoolMembership.deleteMany({ where: { schoolId: testSchoolId } })
  await prisma.studentGuardian.deleteMany({ where: { student: { schoolId: testSchoolId } } })
  await prisma.student.deleteMany({ where: { schoolId: testSchoolId } })
  await prisma.user.deleteMany({ where: { id: testUserId } })
  await prisma.school.deleteMany({ where: { id: testSchoolId } })
})

describe("Auth Service - Login", () => {
  it("AUTH-001: Login Success with email", async () => {
    const result = await authService.login({ login: "auth.test@example.com", password: testUserPassword })
    expect(result).toHaveProperty("accessToken")
    expect(result).toHaveProperty("refreshToken")
    expect(result).toHaveProperty("user")
    expect(result.user.email).toBe("auth.test@example.com")
    expect(result).toHaveProperty("membership")
    expect(result.membership.status).toBe("active")
    expect(result).toHaveProperty("school")
    expect(result.school.id).toBe(testSchoolId)
  })

  it("AUTH-001: Login Success with phone", async () => {
    const result = await authService.login({ login: "auth.test@example.com", password: testUserPassword })
    expect(result).toHaveProperty("accessToken")
  })

  it("AUTH-002: Invalid Password", async () => {
    try {
      await authService.login({ login: "auth.test@example.com", password: "WrongPass999" })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(401)
      expect((e as AppError).message).toBe("Invalid credentials")
    }
  })

  it("AUTH-003: Invalid Email", async () => {
    try {
      await authService.login({ login: "nonexistent@example.com", password: testUserPassword })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(401)
    }
  })

  it("AUTH-004: Invalid Phone", async () => {
    try {
      await authService.login({ login: "+254700009999", password: testUserPassword })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(401)
    }
  })

  it("AUTH-005: Suspended membership blocks login", async () => {
    const ts = Date.now()
    const hashed = await hashPassword("SuspendPass1")
    const user = await prisma.user.create({
      data: {
        firstName: "Suspended", lastName: "User",
        email: `suspended${ts}@example.com`, phone: `+2547000${String(ts).slice(-6)}`,
        hashedPassword: hashed,
      },
    })
    await prisma.schoolMembership.create({
      data: {
        userId: user.id, schoolId: testSchoolId,
        status: "suspended",
      },
    })
    try {
      await authService.login({ login: `suspended${ts}@example.com`, password: "SuspendPass1" })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(403)
    }
    await prisma.schoolMembership.deleteMany({ where: { userId: user.id } })
    await prisma.user.deleteMany({ where: { id: user.id } })
  })

  it("AUTH-013: JWT contains correct claims", async () => {
    const result = await authService.login({ login: "auth.test@example.com", password: testUserPassword })
    const { verifyToken } = await import("@/shared/jwt")
    const payload = verifyToken(result.accessToken)
    expect(payload).toHaveProperty("sub")
    expect(payload.sub).toBe(testUserId)
    expect(payload).toHaveProperty("schoolId")
    expect(payload.schoolId).toBe(testSchoolId)
    expect(payload).toHaveProperty("roles")
    expect(payload.roles).toContain("Teacher")
  })

  it("AUTH-010: Logout succeeds without error", async () => {
    const result = await authService.logout()
    expect(result).toEqual({ message: "Logged out successfully" })
  })

  it("AUTH-009: Refresh token with valid token", async () => {
    const loginResult = await authService.login({ login: "auth.test@example.com", password: testUserPassword })
    const refreshed = await authService.refresh(loginResult.accessToken)
    expect(refreshed).toHaveProperty("accessToken")
    expect(refreshed.accessToken).toBeTruthy()
    expect(refreshed.accessToken).not.toBe(loginResult.accessToken)
  })

  it("AUTH-009: Refresh with invalid token throws", async () => {
    try {
      await authService.refresh("invalid-token")
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(401)
    }
  })
})

describe("Auth Service - Password Management", () => {
  it("AUTH-011: Forgot password accepts valid email or phone", async () => {
    const result = await authService.forgotPassword({ login: "auth.test@example.com" })
    expect(result).toHaveProperty("message")
  })

  it("AUTH-011: Forgot password with unknown login does not leak info", async () => {
    const result = await authService.forgotPassword({ login: "unknown@example.com" })
    expect(result).toHaveProperty("message")
  })

  it("AUTH-012: Change password with correct current password", async () => {
    const result = await authService.changePassword(testUserId, {
      currentPassword: testUserPassword,
      newPassword: "NewPass456!",
    })
    expect(result).toHaveProperty("message")
    testUserPassword = "NewPass456!"

    const loginResult = await authService.login({ login: "auth.test@example.com", password: testUserPassword })
    expect(loginResult).toHaveProperty("accessToken")
  })

  it("AUTH-012: Change password with wrong current password", async () => {
    try {
      await authService.changePassword(testUserId, {
        currentPassword: "WrongOldPass",
        newPassword: "AnotherPass1",
      })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(401)
    }
  })

  it("AUTH-006: Archived user (soft-deleted) cannot login", async () => {
    const ts = Date.now()
    const hashed = await hashPassword("Archived1")
    const user = await prisma.user.create({
      data: {
        firstName: "Archived", lastName: "User",
        email: `archived${ts}@example.com`, phone: `+2547000${String(ts).slice(-6)}`,
        hashedPassword: hashed, deletedAt: new Date(),
      },
    })
    try {
      await authService.login({ login: `archived${ts}@example.com`, password: "Archived1" })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(401)
    }
    await prisma.user.deleteMany({ where: { id: user.id } })
  })
})

describe("Repository - findUserByEmail", () => {
  it("finds user by email", async () => {
    const user = await repo.findUserByEmail("auth.test@example.com")
    expect(user).not.toBeNull()
    expect(user!.email).toBe("auth.test@example.com")
  })

  it("returns null for unknown email", async () => {
    const user = await repo.findUserByEmail("unknown@example.com")
    expect(user).toBeNull()
  })
})

describe("Repository - findUserByPhone", () => {
  it("finds user by phone", async () => {
    const user = await repo.findUserByPhone("+254700001001")
    expect(user).not.toBeNull()
    expect(user!.phone).toBe("+254700001001")
  })

  it("returns null for unknown phone", async () => {
    const user = await repo.findUserByPhone("+254700009999")
    expect(user).toBeNull()
  })
})
