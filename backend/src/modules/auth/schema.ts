import { t } from "elysia"
import { phoneString, emailString, nameString } from "@/common/validation"

export const loginSchema = t.Object({
  login: t.String({ minLength: 1 }),
  password: t.String({ minLength: 1 }),
})

export const registerSchema = t.Object({
  firstName: nameString(1, 100),
  secondName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  lastName: nameString(1, 100),
  phone: phoneString(true),
  email: emailString(false),
  password: t.String({ minLength: 6, maxLength: 128 }),
  schoolCode: t.Optional(t.String({ minLength: 2, maxLength: 20 })),
})

export const forgotPasswordSchema = t.Object({
  login: t.String({ minLength: 1 }),
})

export const resetPasswordSchema = t.Object({
  token: t.String({ minLength: 1 }),
  password: t.String({ minLength: 6, maxLength: 128 }),
})

export const refreshSchema = t.Object({
  refreshToken: t.String({ minLength: 1 }),
})

export const createJoinRequestSchema = t.Object({
  schoolName: t.String({ minLength: 2, maxLength: 200 }),
  phone: phoneString(true),
  email: emailString(false),
})

export type LoginInput = typeof loginSchema.static
export type RegisterInput = typeof registerSchema.static
export type ForgotPasswordInput = typeof forgotPasswordSchema.static
export type ResetPasswordInput = typeof resetPasswordSchema.static
export type RefreshInput = typeof refreshSchema.static
export type CreateJoinRequestInput = typeof createJoinRequestSchema.static
