import crypto from "crypto"
import { hashPassword, verifyPasswordOrThrow } from "@/common/auth"
import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { sendSingleSms } from "@/infrastructure/messaging/sms/sms.provider"
import jwt from "jsonwebtoken"
import * as repo from "./repository"
import type {
  PlatformAdminLoginInput,
  CreatePlatformAdminInput,
  UpdatePlatformAdminInput,
  RejectJoinRequestInput,
  ClaimSchoolInput,
} from "./schema"

const JWT_SECRET = process.env.JWT_SECRET || "schoolpulse-dev-fallback-secret"

export async function login(data: PlatformAdminLoginInput) {
  const admin = await repo.findByEmail(data.email)
  if (!admin || !admin.hashedPassword) {
    throw AppError.unauthenticated("Invalid credentials")
  }

  if (admin.status !== "active") {
    throw AppError.forbidden("Account is not active")
  }

  await verifyPasswordOrThrow(data.password, admin.hashedPassword)

  const accessToken = jwt.sign(
    { sub: admin.id, role: admin.role, type: "platform" },
    JWT_SECRET,
    { expiresIn: "2h" },
  )

  await repo.updateLastLogin(admin.id)

  const { hashedPassword: _, ...safeAdmin } = admin
  return { accessToken, admin: safeAdmin }
}

export async function createAdmin(data: CreatePlatformAdminInput) {
  const existingEmail = await repo.findByEmail(data.email)
  if (existingEmail) {
    throw AppError.conflict("A platform admin with this email already exists")
  }

  const existingPhone = await repo.findByPhone(data.phone)
  if (existingPhone) {
    throw AppError.conflict("A platform admin with this phone already exists")
  }

  const rawPassword = crypto.randomBytes(4).toString("hex")
  const hashed = await hashPassword(rawPassword)

  const admin = await repo.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    role: data.role ?? "staff",
    hashedPassword: hashed,
    status: "invited",
  })

  await writeEventOutbox({
    aggregateId: admin.id,
    aggregateType: "platform_admin",
    eventType: "PlatformAdminCreated",
    payload: {
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    },
  })

  const smsMessage = `You have been invited as a Platform Admin (${admin.role}). Login email: ${admin.email}, password: ${rawPassword}. Please change your password on first login.`
  await sendSingleSms(admin.phone, smsMessage).catch(() => {})

  return { admin, temporaryPassword: rawPassword }
}

export async function listAdmins() {
  return repo.list()
}

export async function updateAdmin(id: string, data: UpdatePlatformAdminInput) {
  const admin = await repo.findById(id)
  if (!admin) {
    throw AppError.notFound("Platform admin not found")
  }

  if (data.email && data.email !== admin.email) {
    const existing = await repo.findByEmail(data.email)
    if (existing && existing.id !== id) {
      throw AppError.conflict("Email already in use")
    }
  }

  if (data.phone && data.phone !== admin.phone) {
    const existing = await repo.findByPhone(data.phone)
    if (existing && existing.id !== id) {
      throw AppError.conflict("Phone already in use")
    }
  }

  return repo.update(id, data)
}

export async function resetPassword(id: string) {
  const admin = await repo.findById(id)
  if (!admin) {
    throw AppError.notFound("Platform admin not found")
  }

  const rawPassword = crypto.randomBytes(4).toString("hex")
  const hashed = await hashPassword(rawPassword)

  await repo.update(id, { hashedPassword: hashed })

  const smsMessage = `Your Platform Admin password has been reset. New password: ${rawPassword}. Please change your password on next login.`
  await sendSingleSms(admin.phone, smsMessage).catch(() => {})

  return { temporaryPassword: rawPassword }
}

export async function listSchools() {
  return repo.findAllSchools()
}

export async function deleteSchool(id: string) {
  const school = await repo.findSchoolById(id)
  if (!school) {
    throw AppError.notFound("School not found")
  }
  await repo.softDeleteSchool(id)
  await writeEventOutbox({
    schoolId: id,
    aggregateId: id,
    aggregateType: "school",
    eventType: "SchoolDeleted",
    payload: { schoolId: id, schoolName: school.schoolName },
  })
  return { deleted: true }
}

export async function approveJoinRequest(id: string, processedBy: string) {
  try {
    const joinRequest = await repo.findJoinRequestById(id)
    if (!joinRequest) {
      throw AppError.notFound("Join request not found")
    }

    if (!["pending_review", "submitted"].includes(joinRequest.status)) {
      throw AppError.validation("Join request is not in a pending state")
    }

    const county = joinRequest.county || "Unknown"
    const prefix = county.slice(0, 3).toUpperCase()

    const latestSchool = await repo.findLatestSchoolCode(prefix)
    let nextNumber = 1
    if (latestSchool) {
      const numPart = parseInt(latestSchool.schoolCode.slice(3), 10)
      if (!isNaN(numPart)) nextNumber = numPart + 1
    }
    const schoolCode = `${prefix}${String(nextNumber).padStart(3, "0")}`

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const result = await prisma.$transaction(async (tx: any) => {
      const school = await tx.school.create({
        data: {
          schoolCode,
          schoolName: joinRequest.schoolName,
          schoolPhone: joinRequest.phone,
          schoolEmail: joinRequest.email,
          county: joinRequest.county || "Unknown",
          town: joinRequest.town || "Unknown",
          country: joinRequest.country || "Kenya",
        },
      })

      await tx.smsWallet.create({
        data: {
          schoolId: school.id,
          balance: 5,
        },
      })

      await tx.joinRequest.update({
        where: { id },
        data: {
          status: "approved",
          processedBy,
          processedAt: new Date(),
          oneTimeCode: otp,
        },
      })

      return { school }
    })

    await writeEventOutbox({
      schoolId: result.school.id,
      aggregateId: id,
      aggregateType: "join_request",
      eventType: "JoinRequestApproved",
      payload: {
        joinRequestId: id,
        schoolId: result.school.id,
        schoolName: joinRequest.schoolName,
        phone: joinRequest.phone,
      },
    })

    const smsMessage = `Your school ${joinRequest.schoolName} has been approved! School code: ${schoolCode}. Claim your school at schoolpulse.app/setup using code ${schoolCode} and OTP: ${otp}`
    await sendSingleSms(joinRequest.adminPhone, smsMessage).catch(() => {})

    return {
      school: result.school,
      oneTimeCode: otp,
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    console.error("approveJoinRequest unexpected error:", err)
    throw AppError.internal(
      err instanceof Error ? err.message : "An unexpected error occurred during approval"
    )
  }
}

export async function rejectJoinRequest(id: string, processedBy: string, data?: RejectJoinRequestInput) {
  const joinRequest = await repo.findJoinRequestById(id)
  if (!joinRequest) {
    throw AppError.notFound("Join request not found")
  }

  if (!["pending_review", "submitted"].includes(joinRequest.status)) {
    throw AppError.validation("Join request is not in a pending state")
  }

  await repo.updateJoinRequest(id, {
    status: "rejected",
    processedBy,
    processedAt: new Date(),
  })

  await writeEventOutbox({
    aggregateId: id,
    aggregateType: "join_request",
    eventType: "JoinRequestRejected",
    payload: {
      joinRequestId: id,
      schoolName: joinRequest.schoolName,
      reason: data?.reason ?? null,
    },
  })

  if (data?.reason) {
    const smsMessage = `Your school ${joinRequest.schoolName} registration has been declined. Reason: ${data.reason}. Contact support for more information.`
    await sendSingleSms(joinRequest.adminPhone, smsMessage).catch(() => {})
  }

  return { rejected: true }
}

export async function claimSchool(data: ClaimSchoolInput) {
  const school = await repo.findSchoolByCode(data.schoolCode)
  if (!school) {
    throw AppError.notFound("Invalid school code")
  }

  const joinRequest = await repo.findJoinRequestByOneTimeCode(data.oneTimeCode)
  if (!joinRequest || joinRequest.oneTimeCode !== data.oneTimeCode) {
    throw AppError.validation("Invalid one-time code")
  }

  if (joinRequest.status !== "approved") {
    throw AppError.validation("School registration has not been approved yet")
  }

  if (joinRequest.schoolName !== school.schoolName) {
    throw AppError.validation("School code and OTP do not match")
  }

  const existingUser = await prisma.user.findFirst({ where: { phone: data.phone } })
  if (existingUser) {
    throw AppError.conflict("A user with this phone number already exists")
  }

  if (data.email) {
    const existingEmail = await prisma.user.findFirst({ where: { email: data.email } })
    if (existingEmail) {
      throw AppError.conflict("A user with this email already exists")
    }
  }

  const hashedPassword = await hashPassword(data.password)

  const result = await prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        hashedPassword,
      },
    })

    const membership = await tx.schoolMembership.create({
      data: { schoolId: school.id, userId: user.id, status: "active" },
    })

    const superAdminRole = await repo.findRoleByName("Super Admin")
    if (superAdminRole) {
      await tx.schoolMembershipRole.create({
        data: { membershipId: membership.id, roleId: superAdminRole.id },
      })
    }

    await tx.joinRequest.update({
      where: { id: joinRequest.id },
      data: { oneTimeCode: null },
    })

    return { user, membership }
  })

  await writeEventOutbox({
    schoolId: school.id,
    aggregateId: school.id,
    aggregateType: "school",
    eventType: "SchoolClaimed",
    payload: {
      schoolId: school.id,
      schoolName: school.schoolName,
      userId: result.user.id,
    },
  })

  return {
    message: "School claimed successfully. You can now log in.",
    user: {
      id: result.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  }
}
