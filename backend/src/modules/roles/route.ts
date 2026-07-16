import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import { checkPermission } from "@/common/middleware/permissionGuard"
import { getRolesController } from "./controller"

export const rolesRoute = new Elysia({ prefix: `${API_PREFIX}/roles` })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("role:assign")] }, (app) => app
    .get("/", getRolesController, {
      detail: { summary: "List all global roles", tags: ["Roles"] },
    })
  )
