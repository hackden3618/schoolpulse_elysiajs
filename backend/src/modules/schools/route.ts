import { Elysia, t } from "elysia";
import { API_PREFIX } from "@/shared/constants";
import { errorHandler, authGuard } from "@/common/middleware";
import {
  getSchoolsController,
  getSchoolController,
  createSchoolController,
  updateSchoolController,
  getSubscriptionController,
  updateSubscriptionController,
} from "./controller";
import {
  createSchoolSchema,
  updateSchoolSchema,
  updateSubscriptionSchema,
} from "./schema";

export const schoolRoute = new Elysia({ prefix: `${API_PREFIX}/schools` })
  .use(errorHandler)
  .use(authGuard)
  .get("/", getSchoolsController, {
    detail: { summary: "List all schools", tags: ["Schools"] },
  })
  .post("/", createSchoolController, {
    body: createSchoolSchema,
    detail: { summary: "Create a school tenant", tags: ["Schools"] },
  })
  .get("/:schoolId", getSchoolController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Get school profile", tags: ["Schools"] },
  })
  .patch("/:schoolId", updateSchoolController, {
    params: t.Object({ schoolId: t.String() }),
    body: updateSchoolSchema,
    detail: { summary: "Update school profile", tags: ["Schools"] },
  })
  .get("/:schoolId/subscription", getSubscriptionController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Get subscription state", tags: ["Schools"] },
  })
  .patch("/:schoolId/subscription", updateSubscriptionController, {
    params: t.Object({ schoolId: t.String() }),
    body: updateSubscriptionSchema,
    detail: { summary: "Update subscription state", tags: ["Schools"] },
  });
