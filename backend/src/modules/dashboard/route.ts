import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import {
  getDashboardSummaryController,
  getRecentActivityController,
} from "./controller"

export const dashboardRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/dashboard` })
  .use(errorHandler)
  .use(authGuard)
  .get("/summary", getDashboardSummaryController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Dashboard summary counts", tags: ["Dashboard"] },
  })
  .get("/activity", getRecentActivityController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Recent activity feed", tags: ["Dashboard"] },
  })
