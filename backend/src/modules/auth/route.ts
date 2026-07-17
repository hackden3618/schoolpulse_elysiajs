import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import { checkPlatformRole } from "@/common/middleware/permissionGuard"
import { platformAuthGuard } from "@/modules/platform-admin/platformAuthGuard"
import * as controller from "./controller"
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshSchema,
    createJoinRequestSchema,
    switchSchoolSchema,
    switchRoleSchema,
} from "./schema"

export const authRoute = new Elysia({ prefix: `${API_PREFIX}/auth` })
    .use(errorHandler)
    .post("/login", controller.loginController, {
        body: loginSchema,
        detail: { summary: "Login with phone/email and password", tags: ["Auth"] },
    })
    .post("/register", controller.registerController, {
        body: registerSchema,
        detail: { summary: "Register a new user", tags: ["Auth"] },
    })
    .post("/forgot-password", controller.forgotPasswordController, {
        body: forgotPasswordSchema,
        detail: { summary: "Request password reset", tags: ["Auth"] },
    })
    .post("/reset-password", controller.resetPasswordController, {
        body: resetPasswordSchema,
        detail: { summary: "Reset password with token", tags: ["Auth"] },
    })
    .post("/refresh", controller.refreshController, {
        body: refreshSchema,
        detail: { summary: "Refresh access token", tags: ["Auth"] },
    })
    .post("/logout", controller.logoutController, {
        detail: { summary: "Logout", tags: ["Auth"] },
    })
    .use(authGuard)
    .post("/change-password", controller.changePasswordController, {
        body: changePasswordSchema,
        detail: { summary: "Change password for logged-in user", tags: ["Auth"] },
    })
    .get("/memberships", controller.listMembershipsController, {
        detail: { summary: "List all memberships for the current user", tags: ["Auth"] },
    })
    .post("/switch-school", controller.switchSchoolController, {
        body: switchSchoolSchema,
        detail: { summary: "Switch active school without re-login", tags: ["Auth"] },
    })
    .post("/switch-role", controller.switchRoleController, {
        body: switchRoleSchema,
        detail: { summary: "Switch active role without re-login", tags: ["Auth"] },
    })

export const joinRequestRoute = new Elysia({ prefix: `${API_PREFIX}/join-requests` })
    .use(errorHandler)
    .post("/", controller.createJoinRequestController, {
        body: createJoinRequestSchema,
        detail: { summary: "Submit school join request", tags: ["Onboarding"] },
    })

// Join-request administration is a platform-level operation. Only a platform
// Super Admin may list or approve requests; a school-scoped user (including a
// Guardian) must never reach these endpoints.
export const joinRequestListRoute = new Elysia({ prefix: `${API_PREFIX}/join-requests` })
    .use(errorHandler)
    .use(platformAuthGuard)
    .guard({ beforeHandle: [checkPlatformRole(["Super Admin"])] }, (app) =>
        app.get("/", controller.listJoinRequestsController, {
            detail: { summary: "List join requests (platform admin)", tags: ["Onboarding"] },
        })
    )

export const joinRequestApproveRoute = new Elysia({ prefix: `${API_PREFIX}/join-requests` })
    .use(errorHandler)
    .use(platformAuthGuard)
    .guard({ beforeHandle: [checkPlatformRole(["Super Admin"])] }, (app) =>
        app.post("/:id/approve", controller.approveJoinRequestController, {
            params: t.Object({ id: t.String({ format: "uuid" }) }),
            detail: { summary: "Approve a join request (platform admin)", tags: ["Onboarding"] },
        })
    )
