import { ROLES } from "@/shared/constants";

export const GUARDIAN_ROLE_NAME = "Guardian"

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
  | "subscription:write";

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
};

export function getRolePermissions(roleName: string): Permission[] {
  return ROLE_PERMISSIONS[roleName] ?? [];
}

/**
 * Super Administrator inherits the complete union of all permissions available
 * to any operational role within the school. This is computed as a union over
 * every role definition so that adding a new role automatically extends the
 * Super Admin's effective permission set — no special-case logic required.
 */
export const SUPER_ADMIN_PERMISSIONS: Permission[] = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat())
);

export function hasPermission(
  roleNames: string[],
  required: Permission,
  activeRole?: string | null
): boolean {
  // When an active role is assumed, authorization is evaluated against that
  // role alone — the assumed context refreshes permissions, accessible routes
  // and cached authorization state. Super Administrator still wins if it is
  // the active role. The assumed role must be one the caller actually holds;
  // otherwise a tampered/invalid activeRole claim cannot grant permissions the
  // user was never assigned.
  if (activeRole) {
    if (activeRole === ROLES.SUPER_ADMIN) {
      return roleNames.includes(ROLES.SUPER_ADMIN);
    }
    if (!roleNames.includes(activeRole)) return false;
    return getRolePermissions(activeRole).includes(required);
  }

  // No assumed role: the union of all assigned roles applies, with Super
  // Administrator inheriting every permission in the school.
  if (roleNames.includes(ROLES.SUPER_ADMIN)) return true;
  return roleNames.some((role) => getRolePermissions(role).includes(required));
}
