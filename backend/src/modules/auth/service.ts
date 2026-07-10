import crypto from "crypto"
import { hashPassword, verifyPasswordOrThrow } from "@/common/auth"
import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { signToken } from "@/shared/jwt"
import * as repo from "./repository"
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, CreateJoinRequestInput } from "./schema"

export async function login(data: LoginInput) {
  const user = await repo.findUserByPhone(data.login) ?? await repo.findUserByEmail(data.login)
  if (!user || !user.hashedPassword) {
    throw AppError.unauthenticated("Invalid credentials")
  }

  await verifyPasswordOrThrow(data.password, user.hashedPassword)

  const memberships = await repo.findActiveMemberships(user.id)
  if (memberships.length === 0) {
    throw AppError.forbidden("No active school membership found")
  }

  const membership = memberships[0]!
  const school = await prisma.school.findUnique({
    where: { id: membership.schoolId },
    select: { id: true, schoolName: true, schoolCode: true, schoolPhone: true, schoolEmail: true, schoolLogo: true, county: true, town: true, country: true, schoolLevel: true, schoolTier: true, subscriptionPlan: true, subscriptionStatus: true, currency: true, timezone: true, settings: true },
  })

  const roleNames = membership.roles.map((r: any) => r.role.name)
  const accessToken = signToken({ sub: user.id, schoolId: membership.schoolId, roles: roleNames })

  const { hashedPassword: _, ...safeUser } = user

  return {
    accessToken,
    refreshToken: accessToken,
    user: safeUser,
    membership: {
      id: membership.id,
      schoolId: membership.schoolId,
      userId: membership.userId,
      status: membership.status,
      joinedAt: membership.joinedAt,
      roles: membership.roles.map((r: any) => ({ id: r.role.id, name: r.role.name, description: r.role.description })),
    },
    school,
  }
}

export async function register(data: RegisterInput) {
  const existing = await repo.findUserByPhone(data.phone)
  if (existing) {
    throw AppError.conflict("Phone number is already registered", [{ field: "phone", issue: "duplicate" }])
  }

  const hashed = await hashPassword(data.password)

  let schoolId: string | null = null
  if (data.schoolCode) {
    const school = await repo.findSchoolByCode(data.schoolCode)
    if (!school) {
      throw AppError.notFound("School not found with the provided code")
    }
    schoolId = school.id
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        firstName: data.firstName,
        secondName: data.secondName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        hashedPassword: hashed,
      },
      select: {
        id: true, firstName: true, secondName: true, lastName: true,
        phone: true, email: true, status: true, createdAt: true, updatedAt: true,
      },
    })

    if (schoolId) {
      const membership = await tx.schoolMembership.create({
        data: { school: { connect: { id: schoolId } }, user: { connect: { id: user.id } } },
      })

      const parentRole = await repo.findRoleByName("Parent")
      if (parentRole) {
        await tx.schoolMembershipRole.create({
          data: { membershipId: membership.id, roleId: parentRole.id },
        })
      }
    }

    return user
  })

  await writeEventOutbox({
    schoolId: schoolId ?? "",
    aggregateId: result.id,
    aggregateType: "user",
    eventType: "UserCreated",
    payload: { phone: result.phone, method: "register" },
  })

  if (schoolId) {
    return login({ login: data.phone, password: data.password })
  }

  const { hashedPassword: _, ...safeUser } = result as any
  return { user: safeUser, schoolId: null }
}

export async function forgotPassword(data: ForgotPasswordInput) {
  const user = await repo.findUserByPhone(data.login) ?? await repo.findUserByEmail(data.login)
  if (!user) {
    return { message: "If an account exists, a reset link will be sent" }
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await repo.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt })

  await writeEventOutbox({
    aggregateId: user.id,
    aggregateType: "user",
    eventType: "UserCreated",
    payload: { action: "password-reset-requested", phone: user.phone },
  })

  return { message: "If an account exists, a reset link will be sent", token: rawToken }
}

export async function resetPassword(data: ResetPasswordInput) {
  const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex")
  const record = await repo.findValidResetToken(tokenHash)
  if (!record) {
    throw AppError.validation("Invalid or expired reset token")
  }

  const hashed = await hashPassword(data.password)

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({ where: { id: record.userId }, data: { hashedPassword: hashed } })
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
  })

  return { message: "Password successfully reset" }
}

export async function refresh(token: string) {
  const { verifyToken } = await import("@/shared/jwt")
  let payload: any
  try { payload = verifyToken(token) } catch { throw AppError.unauthenticated("Invalid refresh token") }

  const membership = await repo.findMembershipBySchoolAndUser(payload.schoolId, payload.sub)
  if (!membership) {
    throw AppError.forbidden("No active membership found")
  }

  const roleNames = membership.roles.map((r: any) => r.role.name)
  const accessToken = signToken({ sub: payload.sub, schoolId: payload.schoolId, roles: roleNames })

  return { accessToken, refreshToken: accessToken }
}

export async function logout() {
  return { message: "Logged out successfully" }
}

export async function createJoinRequest(data: CreateJoinRequestInput) {
  const existing = await prisma.joinRequest.findFirst({
    where: { schoolName: data.schoolName, phone: data.phone, deletedAt: null },
  })
  if (existing) {
    throw AppError.conflict("A join request with this school name and phone already exists")
  }

  return repo.createJoinRequest({
    schoolName: data.schoolName,
    phone: data.phone,
    email: data.email,
    requestedBy: data.phone,
  })
}

export async function listJoinRequests() {
  return repo.findAllJoinRequests()
}
