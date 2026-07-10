import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import {
  loginController,
  registerController,
  forgotPasswordController,
  resetPasswordController,
  refreshController,
  logoutController,
  createJoinRequestController,
  listJoinRequestsController,
} from "./controller"
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  createJoinRequestSchema,
} from "./schema"

export const authRoute = new Elysia({ prefix: `${API_PREFIX}/auth` })
  .use(errorHandler)
  .post("/login", loginController, {
    body: loginSchema,
    detail: { summary: "Login with phone/email and password", tags: ["Auth"] },
  })
  .post("/register", registerController, {
    body: registerSchema,
    detail: { summary: "Register a new user", tags: ["Auth"] },
  })
  .post("/forgot-password", forgotPasswordController, {
    body: forgotPasswordSchema,
    detail: { summary: "Request password reset", tags: ["Auth"] },
  })
  .post("/reset-password", resetPasswordController, {
    body: resetPasswordSchema,
    detail: { summary: "Reset password with token", tags: ["Auth"] },
  })
  .post("/refresh", refreshController, {
    body: refreshSchema,
    detail: { summary: "Refresh access token", tags: ["Auth"] },
  })
  .post("/logout", logoutController, {
    detail: { summary: "Logout", tags: ["Auth"] },
  })

export const joinRequestRoute = new Elysia({ prefix: `${API_PREFIX}/join-requests` })
  .use(errorHandler)
  .post("/", createJoinRequestController, {
    body: createJoinRequestSchema,
    detail: { summary: "Submit school join request", tags: ["Onboarding"] },
  })
  .get("/", listJoinRequestsController, {
    detail: { summary: "List join requests (admin)", tags: ["Onboarding"] },
  })
