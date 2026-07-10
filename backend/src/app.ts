import { Elysia } from "elysia"
import { openapi } from "@elysia/openapi"
import { errorHandler, authGuard } from "@/common/middleware"

import { authRoute, joinRequestRoute } from "@/modules/auth/route"
import { schoolRoute } from "@/modules/schools/route"
import { userRoute, membershipRoute } from "@/modules/users/route"
import { studentRoute } from "@/modules/students/route"
import {
  academicYearRoute,
  termRoute,
  classRoute,
  classInstanceRoute,
  subjectRoute,
} from "@/modules/classes/route"
import { communicationRoute } from "@/modules/communication/router"
import { attendanceRoute } from "@/modules/attendance/route"
import { examRoute, assessmentRoute } from "@/modules/exams/route"
import { financeRoute } from "@/modules/finance/route"
import { dashboardRoute } from "@/modules/dashboard/route"
import { notificationsRoute } from "@/modules/notifications/route"

export const app = new Elysia()
  .use(openapi())
  .use(errorHandler)
  .use(authRoute)
  .use(joinRequestRoute)
  .get("/api/v1/health", { status: "ok", timestamp: new Date().toISOString() }, {
    detail: { summary: "Health check", tags: ["System"] },
  })
  .get("/api/v1/ready", { status: "ok", uptime: process.uptime() }, {
    detail: { summary: "Readiness check", tags: ["System"] },
  })
  .use(authGuard)
  .use(schoolRoute)
  .use(userRoute)
  .use(membershipRoute)
  .use(studentRoute)
  .use(academicYearRoute)
  .use(termRoute)
  .use(classRoute)
  .use(classInstanceRoute)
  .use(subjectRoute)
  .use(communicationRoute)
  .use(attendanceRoute)
  .use(examRoute)
  .use(assessmentRoute)
  .use(financeRoute)
  .use(dashboardRoute)
  .use(notificationsRoute)
