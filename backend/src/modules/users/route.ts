import { Elysia, t } from "elysia";
import { API_PREFIX } from "@/shared/constants";
import { errorHandler } from "@/common/middleware";
import {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  getMembershipsController,
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
  .get("/", getUsersController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List users in school", tags: ["Users"] },
  })
  .post("/", createUserController, {
    params: t.Object({ schoolId: t.String() }),
    body: createUserSchema,
    detail: { summary: "Create user (staff or guardian)", tags: ["Users"] },
  })
  .get("/:userId", getUserController, {
    params: t.Object({ schoolId: t.String(), userId: t.String() }),
    detail: { summary: "Get user in school context", tags: ["Users"] },
  })
  .patch("/:userId", updateUserController, {
    params: t.Object({ schoolId: t.String(), userId: t.String() }),
    body: updateUserSchema,
    detail: { summary: "Update user profile", tags: ["Users"] },
  });

const membershipRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/memberships` })
  .use(errorHandler)
  .get("/", getMembershipsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List memberships", tags: ["Memberships"] },
  })
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
  .put("/:membershipId/roles", assignRolesController, {
    params: t.Object({ schoolId: t.String(), membershipId: t.String() }),
    body: assignRolesSchema,
    detail: { summary: "Replace membership roles", tags: ["Memberships"] },
  });

export { userRoute, membershipRoute };
