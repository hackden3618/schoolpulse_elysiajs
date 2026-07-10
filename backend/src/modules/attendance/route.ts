import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import {
  getSessionsController,
  getSessionController,
  createSessionController,
  updateRecordController,
  lockSessionController,
} from "./controller"
import { createSessionSchema, updateRecordSchema } from "./schema"

export const attendanceRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/attendance` })
  .use(errorHandler)
  .get("/sessions", getSessionsController, {
    params: t.Object({ schoolId: t.String() }),
    query: t.Object({
      classInstanceId: t.Optional(t.String()),
      sessionDate: t.Optional(t.String()),
    }),
    detail: { summary: "List attendance sessions", tags: ["Attendance"] },
  })
  .post("/sessions", createSessionController, {
    params: t.Object({ schoolId: t.String() }),
    body: createSessionSchema,
    detail: { summary: "Create attendance session", tags: ["Attendance"] },
  })
  .get("/sessions/:sessionId", getSessionController, {
    params: t.Object({ schoolId: t.String(), sessionId: t.String() }),
    detail: { summary: "Get session with records", tags: ["Attendance"] },
  })
  .patch("/sessions/:sessionId/records/:recordId", updateRecordController, {
    params: t.Object({ schoolId: t.String(), sessionId: t.String(), recordId: t.String() }),
    body: updateRecordSchema,
    detail: { summary: "Edit attendance record", tags: ["Attendance"] },
  })
  .post("/sessions/:sessionId/lock", lockSessionController, {
    params: t.Object({ schoolId: t.String(), sessionId: t.String() }),
    detail: { summary: "Lock attendance session", tags: ["Attendance"] },
  })
