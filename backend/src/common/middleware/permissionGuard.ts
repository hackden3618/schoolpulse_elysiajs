import { AppError } from "@/common/errors"
import { hasPermission, type Permission } from "@/common/permissions"
import type { AuthUser } from "./authGuard"

export function checkPermission(permission: Permission) {
  return function permissionCheck({ authUser }: { authUser?: AuthUser }) {
    if (!authUser) {
      throw AppError.unauthenticated("Authentication required")
    }
    if (!hasPermission(authUser.roles || [], permission)) {
      throw AppError.forbidden(`Requires ${permission}`)
    }
  }
}

export function requirePermission(permission: Permission) {
  return function permissionGuard(app: any) {
    return app.derive(({ authUser }: { authUser?: AuthUser }) => {
      if (!authUser) {
        throw AppError.unauthenticated("Authentication required")
      }
      if (!hasPermission(authUser.roles || [], permission)) {
        throw AppError.forbidden(`Requires ${permission}`)
      }
      return {}
    })
  }
}

export function checkPlatformRole(allowedRoles: string[]) {
  return function platformRoleCheck({ platformAdmin }: { platformAdmin?: { id: string; role: string; type: string } }) {
    if (!platformAdmin) {
      throw AppError.unauthenticated("Platform authentication required")
    }
    if (!allowedRoles.includes(platformAdmin.role)) {
      throw AppError.forbidden(`Requires platform role: ${allowedRoles.join(" or ")}`)
    }
  }
}

/**
 * Allows the request when the caller holds `permission` OR is a verified
 * guardian of the student named in `params.studentId`. This lets a user who
 * is also a guardian (e.g. a Super Admin who is a Parent) reach guardian
 * endpoints without switching their active membership context.
 */
export function checkPermissionOrGuardianOfStudent(permission: Permission) {
  return async function guard({ authUser, params }: { authUser?: AuthUser; params?: any }) {
    if (!authUser) {
      throw AppError.unauthenticated("Authentication required")
    }
    if (hasPermission(authUser.roles || [], permission)) {
      return
    }
    const studentId: string | undefined = params?.studentId
    if (!studentId) {
      throw AppError.forbidden(`Requires ${permission}`)
    }
    const { prisma } = await import("@/infrastructure/database/prisma")
    const link = await prisma.studentGuardian.findFirst({
      where: {
        schoolId: authUser.schoolId,
        studentId,
        guardianId: authUser.userId,
        deletedAt: null,
      },
    })
    if (!link) {
      throw AppError.forbidden(`Requires ${permission}`)
    }
  }
}
