import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import {
  loginController,
  createAdminController,
  listAdminsController,
  updateAdminController,
  resetPasswordController,
  approveJoinRequestController,
  rejectJoinRequestController,
  claimSchoolController,
  listSchoolsController,
  deleteSchoolController,
} from "./controller"
import {
  platformAdminLoginSchema,
  createPlatformAdminSchema,
  updatePlatformAdminSchema,
  rejectJoinRequestSchema,
  claimSchoolSchema,
} from "./schema"
import { platformAuthGuard } from "./platformAuthGuard"

export const platformAdminAuthRoute = new Elysia({
  prefix: `${API_PREFIX}/platform/auth`,
})
  .use(errorHandler)
  .post("/login", loginController, {
    body: platformAdminLoginSchema,
    detail: { summary: "Platform admin login", tags: ["Platform Admin"] },
  })

export const platformAdminRoute = new Elysia({
  prefix: `${API_PREFIX}/platform/admins`,
})
  .use(errorHandler)
  .use(platformAuthGuard)
  .get("/", listAdminsController, {
    detail: { summary: "List platform admins", tags: ["Platform Admin"] },
  })
  .post("/", createAdminController, {
    body: createPlatformAdminSchema,
    detail: { summary: "Create platform admin", tags: ["Platform Admin"] },
  })
  .patch("/:id", updateAdminController, {
    body: updatePlatformAdminSchema,
    params: t.Object({ id: t.String({ format: "uuid" }) }),
    detail: { summary: "Update platform admin", tags: ["Platform Admin"] },
  })
  .post("/:id/reset-password", resetPasswordController, {
    params: t.Object({ id: t.String({ format: "uuid" }) }),
    detail: {
      summary: "Reset platform admin password",
      tags: ["Platform Admin"],
    },
  })

export const platformAdminSchoolRoute = new Elysia({
  prefix: `${API_PREFIX}/platform/schools`,
})
  .use(errorHandler)
  .use(platformAuthGuard)
  .get("/", listSchoolsController, {
    detail: { summary: "List all schools", tags: ["Platform Admin"] },
  })
  .delete("/:id", deleteSchoolController, {
    params: t.Object({ id: t.String({ format: "uuid" }) }),
    detail: { summary: "Soft-delete a school", tags: ["Platform Admin"] },
  })

export const platformAdminJoinRequestRoute = new Elysia({
  prefix: `${API_PREFIX}/platform/join-requests`,
})
  .use(errorHandler)
  .use(platformAuthGuard)
  .post("/:id/approve", approveJoinRequestController, {
    params: t.Object({ id: t.String({ format: "uuid" }) }),
    detail: {
      summary: "Approve a join request (platform admin)",
      tags: ["Platform Admin"],
    },
  })
  .post("/:id/reject", rejectJoinRequestController, {
    params: t.Object({ id: t.String({ format: "uuid" }) }),
    body: rejectJoinRequestSchema,
    detail: {
      summary: "Reject a join request (platform admin)",
      tags: ["Platform Admin"],
    },
  })

export const platformSchoolClaimRoute = new Elysia({
  prefix: `${API_PREFIX}/schools`,
})
  .use(errorHandler)
  .post("/claim", claimSchoolController, {
    body: claimSchoolSchema,
    detail: {
      summary: "Claim a school after approval (public)",
      tags: ["Onboarding"],
    },
  })
