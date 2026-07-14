import crypto from "crypto"
import { hashPassword, verifyPasswordOrThrow } from "@/common/auth"
import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { sendSingleSms } from "@/infrastructure/messaging/sms/sms.provider"
import { signToken } from "@/shared/jwt"
import { normalizePhone } from "@/common/validation"
import { extractInitials, generateSchoolCode } from "@/modules/schools/service"
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

function buildRoles(membership: any) {
    return membership ? membership.roles.map((r: any) => ({
        id: r.role.id,
        name: r.role.name,
        description: r.role.description
    })) : [];
}

function buildMembershipResponse(membership: any, schoolId: string, userId: string, roles: any[]) {
    return {
        id: membership.id,
        schoolId,
        userId,
        status: membership.status,
        joinedAt: membership.joinedAt,
        user: membership.user ?? { id: userId },
        roles,
    };
}

const schoolSelect = {
    id: true, schoolName: true, schoolCode: true, schoolPhone: true,
    schoolEmail: true, schoolLogo: true, county: true, town: true,
    country: true, schoolLevel: true, schoolTier: true,
    subscriptionPlan: true, subscriptionStatus: true, currency: true,
    timezone: true, settings: true,
} as const;

async function ensureGuardianMemberships(userId: string, guardianLinks: any[], memberships: any[]): Promise<any[]> {
    let updated = memberships
    for (const link of guardianLinks) {
        const membership = updated.find((m: any) => m.schoolId === link.student.schoolId)
        if (!membership) {
            const newMembership = await prisma.schoolMembership.create({
                data: {
                    schoolId: link.student.schoolId,
                    userId,
                    status: "active",
                },
            })
            const guardianRole = await repo.findRoleByName("Guardian")
            if (guardianRole) {
                await prisma.schoolMembershipRole.create({
                    data: { membershipId: newMembership.id, roleId: guardianRole.id },
                })
            }
            updated = await repo.findMembershipsByUserId(userId)
            break
        }
    }
    return updated
}

export async function login(data: LoginInput) {
    const loginStr = normalizePhone(data.login)
    const user = await repo.findUserByPhone(loginStr) ?? await repo.findUserByEmail(loginStr)
    if (!user || !user.hashedPassword) {
        throw AppError.unauthenticated("Invalid credentials")
    }

    await verifyPasswordOrThrow(data.password, user.hashedPassword)

    let allMemberships = await repo.findMembershipsByUserId(user.id)
    const guardianLinks = await prisma.studentGuardian.findMany({
        where: { guardianId: user.id },
        include: { student: { select: { schoolId: true } } }
    })

    // Backfill memberships for existing guardians who don't have one yet
    if (guardianLinks.length > 0) {
        allMemberships = await ensureGuardianMemberships(user.id, guardianLinks, allMemberships)
    }

    if (allMemberships.length === 0) {
        throw AppError.forbidden("No active school membership found")
    }

    let activeMembership: any = null;

    if (data.membershipId) {
        activeMembership = allMemberships.find((m: any) => m.id === data.membershipId) ?? null;
    }
    if (!activeMembership) {
        activeMembership = allMemberships[0];
    }

    const schoolId = activeMembership.schoolId;

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: schoolSelect,
    })

    const roles = buildRoles(activeMembership);
    const roleNames = roles.map((r: any) => r.name)
    const accessToken = signToken({ sub: user.id, schoolId, membershipId: activeMembership.id, roles: roleNames })

    const { hashedPassword: _, ...safeUser } = user

    return {
        accessToken,
        refreshToken: accessToken,
        user: safeUser,
        membership: buildMembershipResponse(activeMembership, schoolId, user.id, roles),
        school,
        memberships: allMemberships.map((m: any) => {
            const mRoles = buildRoles(m);
            return buildMembershipResponse(m, m.schoolId, user.id, mRoles);
        }),
        schools: allMemberships.map((m: any) => m.school),
    }
}

export async function listMemberships(userId: string) {
    let allMemberships = await repo.findMembershipsByUserId(userId)
    const guardianLinks = await prisma.studentGuardian.findMany({
        where: { guardianId: userId },
        include: { student: { select: { schoolId: true } } }
    })

    if (guardianLinks.length > 0) {
        allMemberships = await ensureGuardianMemberships(userId, guardianLinks, allMemberships)
    }

    const memberships = allMemberships.map((m: any) => {
        const roles = buildRoles(m);
        return buildMembershipResponse(m, m.schoolId, userId, roles);
    });

    const schools = allMemberships.map((m: any) => m.school);

    return { memberships, schools }
}

export async function switchSchool(userId: string, data: { membershipId?: string; schoolId?: string }) {
    const targetId = data.membershipId || data.schoolId;
    if (!targetId) {
        throw AppError.validation("membershipId or schoolId is required");
    }

    let membership: any;
    if (data.membershipId) {
        membership = await repo.findMembershipById(data.membershipId);
    } else {
        const allMemberships = await repo.findMembershipsByUserId(userId);
        membership = allMemberships.find((m: any) => m.schoolId === data.schoolId) ?? null;
    }

    if (!membership || membership.userId !== userId) {
        throw AppError.forbidden("No active membership found for the target school");
    }

    const roles = buildRoles(membership);
    const roleNames = roles.map((r: any) => r.name);
    const accessToken = signToken({ sub: userId, schoolId: membership.schoolId, membershipId: membership.id, roles: roleNames });

    const school = await prisma.school.findUnique({
        where: { id: membership.schoolId },
        select: schoolSelect,
    })

    return {
        accessToken,
        refreshToken: accessToken,
        membership: buildMembershipResponse(membership, membership.schoolId, userId, roles),
        school,
    }
}

export async function register(data: RegisterInput) {
    data.phone = normalizePhone(data.phone)
    const existing = await repo.findUserByPhone(data.phone)

    if (existing) {
        if (!data.schoolCode) {
            throw AppError.conflict("Phone number is already registered", [{ field: "phone", issue: "duplicate" }])
        }

        const school = await repo.findSchoolByCode(data.schoolCode)
        if (!school) {
            throw AppError.notFound("School not found with the provided code")
        }

        const existingMembership = await repo.findMembershipBySchoolAndUser(school.id, existing.id)
        if (existingMembership) {
            throw AppError.conflict("You are already a member of this school")
        }

        await prisma.$transaction(async (tx: any) => {
            const membership = await tx.schoolMembership.create({
                data: { school: { connect: { id: school.id } }, user: { connect: { id: existing.id } } },
            })
            const parentRole = await repo.findRoleByName("Parent")
            if (parentRole) {
                await tx.schoolMembershipRole.create({
                    data: { membershipId: membership.id, roleId: parentRole.id },
                })
            }
        })

        await writeEventOutbox({
            schoolId: school.id,
            aggregateId: existing.id,
            aggregateType: "user",
            eventType: "MembershipCreated",
            payload: { phone: existing.phone, schoolCode: data.schoolCode, method: "register_existing" },
        })

        return login({ login: data.phone, password: data.password })
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
    const loginStr = normalizePhone(data.login)
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = await hashPassword(otp)

    const result = await prisma.$transaction(async (tx: any) => {
        const county = joinRequest.county || "Unknown"
        const town = joinRequest.town || "Unknown"
        const initials = extractInitials(joinRequest.schoolName)
        const prefix = `${county.slice(0, 3).toUpperCase()}${town.slice(0, 3).toUpperCase()}${initials}`

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

        // NOTE: User & membership creation is duplicated inline (rather than
        // calling users/service.ts) because the centralized functions use
        // the global prisma client and cannot participate in this transaction.
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
