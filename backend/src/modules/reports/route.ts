import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import {
  getReportSummaryController,
  getAttendanceReportController,
  getFinanceReportController,
  getAcademicReportController,
  getStudentReportController,
} from "./controller"

export const reportsRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/reports` })
  .use(errorHandler)
  .use(authGuard)
  .get("/", getReportSummaryController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Available report types with counts", tags: ["Reports"] },
  })
  .get("/attendance", getAttendanceReportController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Attendance summary", tags: ["Reports"] },
  })
  .get("/finance", getFinanceReportController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Finance summary", tags: ["Reports"] },
  })
  .get("/academic", getAcademicReportController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Academic summary", tags: ["Reports"] },
  })
  .get("/students", getStudentReportController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Student statistics", tags: ["Reports"] },
  })
