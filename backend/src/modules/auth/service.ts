import crypto from "crypto"
import { hashPassword, verifyPasswordOrThrow } from "@/common/auth"
import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { sendSingleSms } from "@/infrastructure/messaging/sms/sms.provider"
import { signToken } from "@/shared/jwt"
import { normalizePhone } from "@/common/validation"
import * as repo from "./repository"
import type {
    LoginInput,
    RegisterInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    ChangePasswordInput,
    CreateJoinRequestInput,
} from "./schema"
import { HOST } from "@/config"

const BASE = process.env.SERVER_HOST

export async function login(data: LoginInput) {
    const loginStr = data.login.startsWith("0") ? normalizePhone(data.login) : data.login
    const user = await repo.findUserByPhone(loginStr) ?? await repo.findUserByEmail(loginStr)
    if (!user || !user.hashedPassword) {
        throw AppError.unauthenticated("Invalid credentials")
    }

    await verifyPasswordOrThrow(data.password, user.hashedPassword)

    const memberships = await repo.findActiveMemberships(user.id)
    const guardianLinks = await prisma.studentGuardian.findMany({
        where: { guardianId: user.id },
        include: { student: { select: { schoolId: true } } }
    })

    if (memberships.length === 0 && guardianLinks.length === 0) {
        throw AppError.forbidden("No active school membership found")
    }

    let schoolId: string;
    let baseMembership: any = null;
    let isGuardianInSchool = false;

    if (memberships.length > 0) {
        baseMembership = memberships[0];
        schoolId = baseMembership.schoolId;
        isGuardianInSchool = guardianLinks.some((g: any) => g.student.schoolId === schoolId);
    } else {
        schoolId = guardianLinks[0]!.student.schoolId;
        isGuardianInSchool = true;
    }

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true, schoolName: true, schoolCode: true, schoolPhone: true, schoolEmail: true, schoolLogo: true, county: true, town: true, country: true, schoolLevel: true, schoolTier: true, subscriptionPlan: true, subscriptionStatus: true, currency: true, timezone: true, settings: true },
    })

    const roles = baseMembership ? baseMembership.roles.map((r: any) => ({
        id: r.role.id,
        name: r.role.name,
        description: r.role.description
    })) : [];

    if (isGuardianInSchool) {
        roles.push({
            id: "guardian-virtual-role",
            name: "guardian",
            description: "Parent / Guardian"
        });
    }

    const roleNames = roles.map((r: any) => r.name)
    const accessToken = signToken({ sub: user.id, schoolId, roles: roleNames })

    const { hashedPassword: _, ...safeUser } = user

    return {
        accessToken,
        refreshToken: accessToken,
        user: safeUser,
        membership: {
            id: baseMembership ? baseMembership.id : `virtual-${schoolId}`,
            schoolId,
            userId: user.id,
            status: baseMembership ? baseMembership.status : "active",
            joinedAt: baseMembership ? baseMembership.joinedAt : new Date(),
            roles,
        },
        school,
    }
}

export async function register(data: RegisterInput) {
    data.phone = normalizePhone(data.phone)
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
    const loginStr = data.login.startsWith("0") ? normalizePhone(data.login) : data.login
    const user = await repo.findUserByPhone(loginStr) ?? await repo.findUserByEmail(loginStr)
    if (!user) {
        return { found: false, message: "No account found with that email or phone number" }
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await repo.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt })

    const smsMessage = `SchoolPulse password reset code: ${rawToken}. Reset your password at ${HOST}/auth/reset-password. This code expires in 1 hour. If you did not request this, ignore this message.`
    await sendSingleSms(user.phone, smsMessage).catch(() => {})

    return { found: true, message: "Reset instructions sent to the phone number on file" }
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

export async function changePassword(userId: string, data: ChangePasswordInput) {
    const user = await repo.findUserById(userId)
    if (!user || !user.hashedPassword) {
        throw AppError.unauthenticated("User not found or cannot change password")
    }

    await verifyPasswordOrThrow(data.currentPassword, user.hashedPassword)
    const newHashed = await hashPassword(data.newPassword)
    
    await repo.updateUser(userId, { hashedPassword: newHashed })
    
    return { message: "Password successfully updated" }
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
    data.phone = normalizePhone(data.phone)
    const existing = await prisma.joinRequest.findFirst({
        where: { schoolName: data.schoolName, phone: data.phone, deletedAt: null },
    })
    if (existing) {
        throw AppError.conflict("A join request with this school name and phone already exists")
    }

    const joinRequest = await repo.createJoinRequest({
        schoolName: data.schoolName,
        phone: data.phone,
        email: data.email,
        schoolLevel: data.schoolLevel,
        county: data.county,
        country: data.country,
        town: data.town,
        requestedBy: data.phone,
    })

    await writeEventOutbox({
        aggregateId: joinRequest.id,
        aggregateType: "join_request",
        eventType: "JoinRequestSubmitted",
        payload: {
            joinRequestId: joinRequest.id,
            schoolName: data.schoolName,
            phone: data.phone,
            county: data.county ?? null,
            country: data.country ?? null,
            town: data.town ?? null,
            requestedAt: joinRequest.requestedAt,
        },
    })

    const smsMessage = `Your request to join ${data.schoolName} has been submitted. We will review it and get back to you.`
    await sendSingleSms(data.phone, smsMessage).catch(() => { })

    return joinRequest
}

export async function listJoinRequests() {
    return repo.findAllJoinRequests()
}

export async function approveJoinRequest(id: string, processedBy: string) {
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
    const hashedOtp = await hashPassword(otp)

    const result = await prisma.$transaction(async (tx: any) => {
        // TODO have an approved school perform an appropriate fetch to create a school through it's API to avoid inconsistent results
        // fetch(`${BASE}/api/v1/schools/`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         schoolName: joinRequest.schoolName,
        //         schoolPhone: joinRequest.phone,
        //         schoolEmail: joinRequest.email,
        //         county: joinRequest.county || "Unknown",
        //         town: joinRequest.town || "Unknown",
        //         country: joinRequest.country || "Kenya",
        //         schoolWebsite: '',
        //         schoolAddress: '',
        //         schoolLogo: '',
        //         postOffice: '',
        //         currency: 'KES',
        //         timezone: 'Africa/Nairobi',
        //         schoolLevel: joinRequest.schoolLevel
        //     })
        // })

        // TODO replace this
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

        const user = await tx.user.create({
            data: {
                firstName: "Admin",
                lastName: joinRequest.schoolName,
                phone: joinRequest.phone,
                email: joinRequest.email,
                hashedPassword: hashedOtp,
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
            where: { id },
            data: {
                status: "approved",
                processedBy,
                processedAt: new Date(),
                oneTimeCode: otp,
            },
        })

        return { school, user }
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
            userId: result.user.id,
        },
    })

    const smsMessage = `Your school ${joinRequest.schoolName} has been approved! Login at ${HOST}/auth/login with phone ${joinRequest.phone} and code ${otp}. Change your password on first login.`
    await sendSingleSms(joinRequest.phone, smsMessage).catch(() => { })

    return {
        school: result.school,
        user: { id: result.user.id, phone: result.user.phone },
        oneTimeCode: otp,
    }
}
