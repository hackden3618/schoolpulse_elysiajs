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
