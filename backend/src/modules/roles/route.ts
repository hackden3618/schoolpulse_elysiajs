import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import { getRolesController } from "./controller"

export const rolesRoute = new Elysia({ prefix: `${API_PREFIX}/roles` })
  .use(errorHandler)
  .get("/", getRolesController, {
    detail: { summary: "List all global roles", tags: ["Roles"] },
  })
