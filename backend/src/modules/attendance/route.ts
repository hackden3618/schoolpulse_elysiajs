import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard, checkPermission } from "@/common/middleware"
import {
  getSessionsController,
  getSessionController,
  createSessionController,
  updateRecordController,
  lockSessionController,
} from "./controller"
import { createSessionSchema, updateRecordSchema } from "./schema"

const P = `${API_PREFIX}/schools/:schoolId/attendance`;

export const attendanceRoute = new Elysia({ prefix: P })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("attendance:report")] }, (app) => app
    .get("/sessions", getSessionsController, {
      params: t.Object({ schoolId: t.String() }),
      query: t.Object({
        classInstanceId: t.Optional(t.String()),
        sessionDate: t.Optional(t.String()),
      }),
      detail: { summary: "List attendance sessions", tags: ["Attendance"] },
    })
    .get("/sessions/:sessionId", getSessionController, {
      params: t.Object({ schoolId: t.String(), sessionId: t.String() }),
      detail: { summary: "Get session with records", tags: ["Attendance"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("attendance:mark")] }, (app) => app
    .post("/sessions", createSessionController, {
      params: t.Object({ schoolId: t.String() }),
      body: createSessionSchema,
      detail: { summary: "Create attendance session", tags: ["Attendance"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("attendance:edit")] }, (app) => app
    .patch("/sessions/:sessionId/records/:recordId", updateRecordController, {
      params: t.Object({ schoolId: t.String(), sessionId: t.String(), recordId: t.String() }),
      body: updateRecordSchema,
      detail: { summary: "Edit attendance record", tags: ["Attendance"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("attendance:lock")] }, (app) => app
    .post("/sessions/:sessionId/lock", lockSessionController, {
      params: t.Object({ schoolId: t.String(), sessionId: t.String() }),
      detail: { summary: "Lock attendance session", tags: ["Attendance"] },
    })
  )
