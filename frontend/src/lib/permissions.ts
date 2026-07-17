export type Permission =
  | "school:read"
  | "school:write"
  | "school:admin"
  | "user:read"
  | "user:write"
  | "membership:read"
  | "membership:write"
  | "role:assign"
  | "student:read"
  | "student:write"
  | "student:archive"
  | "student:bulk-import"
  | "guardian:link"
  | "enrollment:write"
  | "academic-year:write"
  | "term:write"
  | "class:write"
  | "class-instance:write"
  | "subject:write"
  | "teacher:assign"
  | "attendance:mark"
  | "attendance:edit"
  | "attendance:lock"
  | "attendance:report"
  | "exam:write"
  | "assessment:write"
  | "assessment:publish"
  | "fee-structure:write"
  | "invoice:generate"
  | "payment:record"
  | "payment:reverse"
  | "finance:report"
  | "finance:guardian_view"
  | "communication:write"
  | "announcement:send"
  | "communication:history"
  | "audit:read"
  | "subscription:write"

export const ROLES = {
  PLATFORM_ADMIN: "PlatformAdmin",
  SUPER_ADMIN: "SuperAdmin",
  PRINCIPAL: "Principal",
  DEPUTY_PRINCIPAL: "DeputyPrincipal",
  ACADEMIC_MASTER: "AcademicMaster",
  BURSAR: "Bursar",
  TEACHER: "Teacher",
  ADMISSIONS: "Admissions",
  RECEPTION: "Reception",
  PARENT: "Parent",
  GUARDIAN: "Guardian",
} as const

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [ROLES.PLATFORM_ADMIN]: [
    "school:read", "school:write", "school:admin",
    "user:read", "user:write",
    "membership:read", "membership:write", "role:assign",
    "student:read", "student:write", "student:archive", "student:bulk-import",
    "guardian:link", "enrollment:write",
    "academic-year:write", "term:write", "class:write", "class-instance:write",
    "subject:write", "teacher:assign",
    "attendance:mark", "attendance:edit", "attendance:lock", "attendance:report",
    "exam:write", "assessment:write", "assessment:publish",
    "fee-structure:write", "invoice:generate", "payment:record", "payment:reverse",
    "finance:report",
    "communication:write", "communication:history", "announcement:send",
    "audit:read", "subscription:write",
  ],
  [ROLES.SUPER_ADMIN]: [
    "school:read", "school:write",
    "user:read", "user:write",
    "membership:read", "membership:write", "role:assign",
    "student:read", "student:write", "student:archive", "student:bulk-import",
    "guardian:link", "enrollment:write",
    "academic-year:write", "term:write", "class:write", "class-instance:write",
    "subject:write", "teacher:assign",
    "attendance:mark", "attendance:edit", "attendance:lock", "attendance:report",
    "exam:write", "assessment:write", "assessment:publish",
    "fee-structure:write", "invoice:generate", "payment:record", "payment:reverse",
    "finance:report",
    "communication:write", "communication:history", "announcement:send",
    "audit:read",
  ],
  [ROLES.PRINCIPAL]: [
    "school:read", "school:write",
    "user:read", "user:write",
    "membership:read", "membership:write", "role:assign",
    "student:read", "student:write", "student:archive", "student:bulk-import",
    "guardian:link", "enrollment:write",
    "academic-year:write", "term:write", "class:write", "class-instance:write",
    "subject:write", "teacher:assign",
    "attendance:mark", "attendance:edit", "attendance:lock", "attendance:report",
    "exam:write", "assessment:write", "assessment:publish",
    "fee-structure:write", "invoice:generate", "payment:record", "payment:reverse",
    "finance:report",
    "communication:write", "communication:history", "announcement:send",
    "audit:read",
  ],
  [ROLES.DEPUTY_PRINCIPAL]: [
    "school:read",
    "user:read",
    "membership:read",
    "student:read", "student:write", "student:archive",
    "guardian:link", "enrollment:write",
    "academic-year:write", "term:write", "class:write", "class-instance:write",
    "subject:write", "teacher:assign",
    "attendance:mark", "attendance:edit", "attendance:lock", "attendance:report",
    "exam:write", "assessment:write",
    "fee-structure:write", "invoice:generate", "payment:record", "payment:reverse",
    "finance:report",
    "communication:write", "communication:history", "announcement:send",
    "audit:read",
  ],
  [ROLES.ACADEMIC_MASTER]: [
    "school:read",
    "user:read",
    "membership:read",
    "student:read", "student:write",
    "guardian:link", "enrollment:write",
    "academic-year:write", "term:write", "class:write", "class-instance:write",
    "subject:write", "teacher:assign",
    "attendance:mark", "attendance:report",
    "exam:write", "assessment:write", "assessment:publish",
    "communication:write", "communication:history",
  ],
  [ROLES.BURSAR]: [
    "school:read",
    "user:read",
    "membership:read",
    "student:read",
    "fee-structure:write", "invoice:generate", "payment:record", "payment:reverse",
    "finance:report",
    "communication:write", "communication:history",
    "audit:read",
  ],
  [ROLES.TEACHER]: [
    "student:read",
    "attendance:mark",
    "assessment:write",
    "communication:write", "communication:history",
  ],
  [ROLES.ADMISSIONS]: [
    "user:read",
    "student:read", "student:write", "student:bulk-import",
    "guardian:link", "enrollment:write",
    "communication:write", "communication:history",
  ],
  [ROLES.RECEPTION]: [
    "student:read", "student:write",
    "guardian:link",
    "communication:write", "communication:history",
  ],
  [ROLES.PARENT]: [
    "student:read",
    "finance:guardian_view",
    "payment:record",
    "communication:write",
  ],
  [ROLES.GUARDIAN]: [
    "student:read",
    "finance:guardian_view",
    "payment:record",
    "communication:write",
  ],
}

export function getRolePermissions(roleName: string): Permission[] {
  return ROLE_PERMISSIONS[roleName] ?? []
}

export const SUPER_ADMIN_PERMISSIONS: Permission[] = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat())
)

/**
 * Frontend projection of backend authorization. Never the source of truth —
 * the backend enforces every permission. This is used only to derive which
 * navigation entries are visible.
 */
export function hasPermission(
  roleNames: string[],
  required: Permission,
  activeRole?: string | null
): boolean {
  if (activeRole) {
    if (activeRole === ROLES.SUPER_ADMIN) {
      return roleNames.includes(ROLES.SUPER_ADMIN)
    }
    if (!roleNames.includes(activeRole)) return false
    return getRolePermissions(activeRole).includes(required)
  }

  if (roleNames.includes(ROLES.SUPER_ADMIN)) return true
  return roleNames.some((role) => getRolePermissions(role).includes(required))
}

/**
 * Computes the effective permission set for the current assumed role context.
 * Used by the UI to derive navigation and show/hide actions.
 */
export function getEffectivePermissions(
  roleNames: string[],
  activeRole?: string | null
): Set<Permission> {
  if (activeRole) {
    if (activeRole === ROLES.SUPER_ADMIN && roleNames.includes(ROLES.SUPER_ADMIN)) {
      return new Set(SUPER_ADMIN_PERMISSIONS)
    }
    if (!roleNames.includes(activeRole)) return new Set()
    return new Set(getRolePermissions(activeRole))
  }
  if (roleNames.includes(ROLES.SUPER_ADMIN)) {
    return new Set(SUPER_ADMIN_PERMISSIONS)
  }
  const union = new Set<Permission>()
  for (const role of roleNames) {
    for (const p of getRolePermissions(role)) union.add(p)
  }
  return union
}
