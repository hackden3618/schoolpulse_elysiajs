export const API_PREFIX = "/api/v1";

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PROVIDER_ERROR: "PROVIDER_ERROR",
} as const;

export const SALT_ROUNDS = 10;

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 25,
  maxPageSize: 100,
} as const;

export const ROLES = {
  PLATFORM_ADMIN: "Platform Admin",
  SUPER_ADMIN: "Super Admin",
  PRINCIPAL: "Principal",
  DEPUTY_PRINCIPAL: "Deputy Principal",
  ACADEMIC_MASTER: "Academic Master",
  BURSAR: "Bursar",
  TEACHER: "Teacher",
  ADMISSIONS: "Admissions",
  RECEPTION: "Reception",
  PARENT: "Parent",
} as const;
