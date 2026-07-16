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
    "communication:write", "announcement:send",
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
    "communication:write", "announcement:send",
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
    "communication:write", "announcement:send",
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
    "fee-structure:write", "invoice:generate", "payment:record",
    "finance:report",
    "communication:write", "announcement:send",
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
    "communication:write",
  ],
  [ROLES.BURSAR]: [
    "school:read",
    "user:read",
    "membership:read",
    "student:read",
    "fee-structure:write", "invoice:generate", "payment:record", "payment:reverse",
    "finance:report",
    "communication:write",
    "audit:read",
  ],
  [ROLES.TEACHER]: [
    "student:read",
    "attendance:mark",
    "assessment:write",
    "communication:write",
  ],
  [ROLES.ADMISSIONS]: [
    "user:read",
    "student:read", "student:write", "student:bulk-import",
    "guardian:link", "enrollment:write",
    "communication:write",
  ],
  [ROLES.RECEPTION]: [
    "student:read", "student:write",
    "guardian:link",
    "communication:write",
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

export function hasPermission(
  roleNames: string[],
  required: Permission
): boolean {
  return roleNames.some((role) =>
    getRolePermissions(role).includes(required)
  );
}
