import { Elysia, t } from "elysia";
import { API_PREFIX } from "@/shared/constants";
import { errorHandler, authGuard } from "@/common/middleware";
import { checkPermission } from "@/common/middleware/permissionGuard";
import {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  getSelfController,
  updateSelfController,
  getMembershipsController,
  searchMembersController,
  createMembershipController,
  updateMembershipController,
  assignRolesController,
} from "./controller";
import {
  createUserSchema,
  updateUserSchema,
  createMembershipSchema,
  updateMembershipSchema,
  assignRolesSchema,
} from "./schema";

const userRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/users` })
  .use(errorHandler)
  .use(authGuard)
  .get("/me", getSelfController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Get own profile (self-service)", tags: ["Users"] },
  })
  .patch("/me", updateSelfController, {
    params: t.Object({ schoolId: t.String() }),
    body: updateUserSchema,
    detail: { summary: "Update own profile (self-service)", tags: ["Users"] },
  })
  .guard({ beforeHandle: [checkPermission("user:read")] }, (app) => app
    .get("/", getUsersController, {
      params: t.Object({ schoolId: t.String() }),
      detail: { summary: "List users in school", tags: ["Users"] },
    })
    .get("/:userId", getUserController, {
      params: t.Object({ schoolId: t.String(), userId: t.String() }),
      detail: { summary: "Get user in school context", tags: ["Users"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("user:write")] }, (app) => app
    .post("/", createUserController, {
      params: t.Object({ schoolId: t.String() }),
      body: createUserSchema,
      detail: { summary: "Create user (staff or guardian)", tags: ["Users"] },
    })
    .patch("/:userId", updateUserController, {
      params: t.Object({ schoolId: t.String(), userId: t.String() }),
      body: updateUserSchema,
      detail: { summary: "Update user profile", tags: ["Users"] },
    })
    .delete("/:userId", deleteUserController, {
      params: t.Object({ schoolId: t.String(), userId: t.String() }),
      detail: { summary: "Remove user from school (soft-delete)", tags: ["Users"] },
    })
  );

const membershipRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/memberships` })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("membership:read")] }, (app) => app
    .get("/", getMembershipsController, {
      params: t.Object({ schoolId: t.String() }),
      detail: { summary: "List memberships", tags: ["Memberships"] },
    })
    .get("/search", searchMembersController, {
      params: t.Object({ schoolId: t.String() }),
      query: t.Object({ q: t.Optional(t.String()) }),
      detail: { summary: "Search school members", tags: ["Memberships"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("membership:write")] }, (app) => app
    .post("/", createMembershipController, {
      params: t.Object({ schoolId: t.String() }),
      body: createMembershipSchema,
      detail: { summary: "Add user to school", tags: ["Memberships"] },
    })
    .patch("/:membershipId", updateMembershipController, {
      params: t.Object({ schoolId: t.String(), membershipId: t.String() }),
      body: updateMembershipSchema,
      detail: { summary: "Update membership status", tags: ["Memberships"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("role:assign")] }, (app) => app
    .put("/:membershipId/roles", assignRolesController, {
      params: t.Object({ schoolId: t.String(), membershipId: t.String() }),
      body: assignRolesSchema,
      detail: { summary: "Replace membership roles", tags: ["Memberships"] },
    })
  );

export { userRoute, membershipRoute };
