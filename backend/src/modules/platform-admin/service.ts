import crypto from "crypto"
import { hashPassword, verifyPasswordOrThrow } from "@/common/auth"
import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { sendSingleSms } from "@/infrastructure/messaging/sms/sms.provider"
import { extractInitials, generateSchoolCode } from "@/modules/schools/service"
import { HOST } from "@/config"
import { signToken, verifyToken } from "@/shared/jwt"
import type { JwtPayload } from "@/shared/jwt"
import jwt from "jsonwebtoken"
import * as repo from "./repository"
import type {
  PlatformAdminLoginInput,
  CreatePlatformAdminInput,
  UpdatePlatformAdminInput,
  RejectJoinRequestInput,
  VerifyOtpInput,
  SetupAdminInput,
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

  const smsMessage = `You have been invited as a Platform Admin (${admin.role}). Login email: ${admin.email}, password: ${rawPassword}. Please visit ${HOST}/platform/login to access SchoolPulse.`
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

  const smsMessage = `Your Platform Admin password has been reset. New password: ${rawPassword}. Please visit ${HOST}/platform/login to access SchoolPulse.`
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

    const initials = extractInitials(joinRequest.schoolName)
    const county = joinRequest.county || "Unknown"
    const town = joinRequest.town || "Unknown"
    const prefix = `${county.slice(0, 3).toUpperCase()}${town.slice(0, 3).toUpperCase()}${initials}`

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const school = await prisma.$transaction(async (tx) => {
      const existing = await tx.school.findMany({
        where: { schoolCode: { startsWith: prefix }, deletedAt: null },
        select: { schoolCode: true },
        orderBy: { schoolCode: "desc" },
        take: 1,
      })

      const sequence = existing.length > 0
        ? parseInt(existing[0]!.schoolCode.slice(-3), 10) + 1
        : 1

      const schoolCode = generateSchoolCode(county, town, initials, sequence)

      const codeTaken = await tx.school.findFirst({
        where: { schoolCode, deletedAt: null },
      })
      if (codeTaken) {
        throw AppError.conflict("Generated school code collides with an existing school")
      }

      const s = await tx.school.create({
        data: {
          schoolCode,
          schoolName: joinRequest.schoolName,
          schoolPhone: joinRequest.phone,
          schoolEmail: joinRequest.email ?? undefined,
          county,
          town,
          country: joinRequest.country || "Kenya",
          schoolLevel: (joinRequest.schoolLevel ?? "mixed") as any,
        },
      })

      await tx.smsWallet.create({
        data: { schoolId: s.id, balance: 5 },
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

      return s
    })

    await writeEventOutbox({
      schoolId: school.id,
      aggregateId: id,
      aggregateType: "join_request",
      eventType: "JoinRequestApproved",
      payload: {
        joinRequestId: id,
        schoolId: school.id,
        schoolName: joinRequest.schoolName,
        phone: joinRequest.phone,
        schoolCode: school.schoolCode,
      },
    })

    const smsMessage = `Your school ${joinRequest.schoolName} has been approved! School code: ${school.schoolCode}. Claim your school at ${HOST}/setup using code ${school.schoolCode} and OTP: ${otp}`
    await sendSingleSms(joinRequest.phone, smsMessage).catch(() => {})

    return {
      school,
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
    await sendSingleSms(joinRequest.phone, smsMessage).catch(() => {})
  }

  return { rejected: true }
}

export async function markUnderReview(id: string, processedBy: string) {
  const joinRequest = await repo.findJoinRequestById(id)
  if (!joinRequest) {
    throw AppError.notFound("Join request not found")
  }

  if (joinRequest.status !== "submitted") {
    throw AppError.validation("Only new join requests can be marked as under review")
  }

  await repo.updateJoinRequest(id, {
    status: "pending_review",
    processedBy,
    processedAt: new Date(),
  })

  await writeEventOutbox({
    aggregateId: id,
    aggregateType: "join_request",
    eventType: "JoinRequestUnderReview",
    payload: {
      joinRequestId: id,
      schoolName: joinRequest.schoolName,
    },
  })

  return { underReview: true }
}

export async function verifyOtp(data: VerifyOtpInput) {
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

  const setupToken = signToken(
    { sub: school.id, schoolId: school.id, roles: ["setup"], joinRequestId: joinRequest.id },
    { expiresIn: "30m" },
  )

  return {
    setupToken,
    schoolName: school.schoolName,
    schoolCode: school.schoolCode,
  }
}

export async function setupAdmin(data: SetupAdminInput) {
  let payload: JwtPayload
  try {
    payload = verifyToken(data.setupToken)
  } catch {
    throw AppError.unauthenticated("Invalid or expired setup token")
  }

  if (!payload.roles.includes("setup")) {
    throw AppError.unauthenticated("Invalid setup token")
  }

  const school = await repo.findSchoolById(payload.sub)
  if (!school) {
    throw AppError.notFound("School not found")
  }

  const joinRequest = await repo.findJoinRequestById(payload.joinRequestId!)
  if (!joinRequest || joinRequest.oneTimeCode === null) {
    throw AppError.validation("Setup session has expired or already used")
  }

  const otp = joinRequest.oneTimeCode!
  const hashedOtp = await hashPassword(otp)

  const { user, membership } = await prisma.$transaction(async (tx) => {
    const existingPhone = await tx.user.findFirst({
      where: { phone: data.phone, deletedAt: null }
    })
    if (existingPhone) {
      throw AppError.conflict("Phone number is already registered")
    }

    const u = await tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email ?? undefined,
        hashedPassword: hashedOtp,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    const superAdminRole = await tx.role.findUnique({
      where: { name: "Super Admin" }
    })

    const m = await tx.schoolMembership.create({
      data: {
        schoolId: school.id,
        userId: u.id,
        status: "active"
      }
    })

    if (superAdminRole) {
      await tx.schoolMembershipRole.create({
        data: {
          membershipId: m.id,
          roleId: superAdminRole.id
        }
      })
    }

    await tx.joinRequest.update({
      where: { id: payload.joinRequestId! },
      data: { oneTimeCode: null }
    })

    return { user: u, membership: m }
  })

  await writeEventOutbox({
    aggregateId: user.id,
    aggregateType: "user",
    eventType: "UserCreated",
    payload: { phone: user.phone },
  })

  await writeEventOutbox({
    schoolId: school.id,
    aggregateId: membership.id,
    aggregateType: "membership",
    eventType: "MembershipCreated",
    payload: { userId: user.id },
  })

  await writeEventOutbox({
    schoolId: school.id,
    aggregateId: school.id,
    aggregateType: "school",
    eventType: "SchoolClaimed",
    payload: {
      schoolId: school.id,
      schoolName: school.schoolName,
      userId: user.id,
    },
  })

  const accessToken = signToken(
    { sub: user.id, schoolId: school.id, roles: ["Super Admin"] },
    { expiresIn: "24h" },
  )

  return {
    message: "Admin account created successfully.",
    accessToken,
    user: {
      id: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
    schoolCode: school.schoolCode,
    onboardingRequired: true,
  }
}
