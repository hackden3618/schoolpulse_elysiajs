import { Elysia } from "elysia"
import { openapi } from "@elysia/openapi"
import { errorHandler } from "@/common/middleware"

import { authRoute, joinRequestRoute, joinRequestListRoute } from "@/modules/auth/route"
import { platformAdminAuthRoute } from "@/modules/platform-admin/auth.route"
import { platformAdminRoute, platformAdminJoinRequestRoute, platformAdminSchoolRoute, platformSchoolClaimRoute } from "@/modules/platform-admin/routes"
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
import { financeRoute, mpesaWebhookRoute } from "@/modules/finance/route"
import { dashboardRoute } from "@/modules/dashboard/route"
import { reportsRoute } from "@/modules/reports/route"
import { notificationsRoute } from "@/modules/notifications/route"
import { rolesRoute } from "@/modules/roles/route"
import { schoolSupportRoute, platformSupportRoute } from "@/modules/support/route"
import { admissionsRoute } from "@/modules/admissions/route"

export const app = new Elysia()
  .use(openapi())
  .use(errorHandler)
  .use(authRoute)
  .use(joinRequestRoute)
  .use(platformAdminAuthRoute)
  .use(platformSchoolClaimRoute)
  .get("/api/v1/health", { status: "ok", timestamp: new Date().toISOString() }, {
    detail: { summary: "Health check", tags: ["System"] },
  })
  .get("/api/v1/ready", { status: "ok", uptime: process.uptime() }, {
    detail: { summary: "Readiness check", tags: ["System"] },
  })
  .use(mpesaWebhookRoute)
  .use(joinRequestListRoute)
  .use(rolesRoute)
  .use(schoolRoute)
  .use(platformAdminRoute)
  .use(platformAdminJoinRequestRoute)
  .use(platformAdminSchoolRoute)
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
  .use(reportsRoute)
  .use(notificationsRoute)
  .use(admissionsRoute)
  .use(schoolSupportRoute)
  .use(platformSupportRoute)
