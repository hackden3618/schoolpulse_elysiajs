import { t } from "elysia"
import { phoneString, emailString, nameString } from "@/common/validation"

export const platformAdminLoginSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
})

export const createPlatformAdminSchema = t.Object({
  firstName: nameString(1, 100),
  lastName: nameString(1, 100),
  email: emailString(true),
  phone: phoneString(true),
  role: t.Optional(t.Enum({ super_admin: "super_admin", admin: "admin", staff: "staff", support: "support" })),
})

export const updatePlatformAdminSchema = t.Object({
  firstName: t.Optional(nameString(1, 100)),
  lastName: t.Optional(nameString(1, 100)),
  email: t.Optional(emailString(false)),
  phone: t.Optional(phoneString(false)),
  role: t.Optional(t.Enum({ super_admin: "super_admin", admin: "admin", staff: "staff", support: "support" })),
})

export const rejectJoinRequestSchema = t.Object({
  reason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
})

export const verifyOtpSchema = t.Object({
  schoolCode: t.String({ minLength: 1, maxLength: 20 }),
  oneTimeCode: t.String({ minLength: 6, maxLength: 6 }),
})

export const setupAdminSchema = t.Object({
  setupToken: t.String({ minLength: 1 }),
  firstName: nameString(1, 100),
  lastName: nameString(1, 100),
  phone: phoneString(true),
  email: emailString(false),
})

export type PlatformAdminLoginInput = typeof platformAdminLoginSchema.static
export type CreatePlatformAdminInput = typeof createPlatformAdminSchema.static
export type UpdatePlatformAdminInput = typeof updatePlatformAdminSchema.static
export type RejectJoinRequestInput = typeof rejectJoinRequestSchema.static
export type VerifyOtpInput = typeof verifyOtpSchema.static
export type SetupAdminInput = typeof setupAdminSchema.static
