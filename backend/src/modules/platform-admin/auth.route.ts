console.log('=== LOADED auth.route.ts ===')
import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import { loginController } from "./controller"
import { platformAdminLoginSchema } from "./schema"

export const platformAdminAuthRoute = new Elysia({
  prefix: `${API_PREFIX}/platform/auth`,
})
  .use(errorHandler)
  .post("/login", loginController, {
    body: platformAdminLoginSchema,
    detail: { summary: "Platform admin login", tags: ["Platform Admin"] },
  })
