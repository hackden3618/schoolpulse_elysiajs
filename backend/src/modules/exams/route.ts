import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import { checkPermission } from "@/common/middleware/permissionGuard"
import {
  getExamsController,
  getExamController,
  createExamController,
  updateExamController,
  publishExamController,
  createAssessmentController,
  getAssessmentController,
  enterResultsController,
  publishResultsController,
} from "./controller"
import {
  createExamSchema,
  updateExamSchema,
  createAssessmentSchema,
  createResultSchema,
} from "./schema"

export const examRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/exams` })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("exam:write")] }, (app) => app
    .get("/", getExamsController, {
      params: t.Object({ schoolId: t.String() }),
      query: t.Object({ termId: t.Optional(t.String()) }),
      detail: { summary: "List exams", tags: ["Exams"] },
    })
    .post("/", createExamController, {
      params: t.Object({ schoolId: t.String() }),
      body: createExamSchema,
      detail: { summary: "Create exam", tags: ["Exams"] },
    })
    .get("/:examId", getExamController, {
      params: t.Object({ schoolId: t.String(), examId: t.String() }),
      detail: { summary: "Get exam with assessments", tags: ["Exams"] },
    })
    .patch("/:examId", updateExamController, {
      params: t.Object({ schoolId: t.String(), examId: t.String() }),
      body: updateExamSchema,
      detail: { summary: "Update exam", tags: ["Exams"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("assessment:publish")] }, (app) => app
    .post("/:examId/publish", publishExamController, {
      params: t.Object({ schoolId: t.String(), examId: t.String() }),
      detail: { summary: "Publish exam results", tags: ["Exams"] },
    })
  )

export const assessmentRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/assessments` })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("assessment:write")] }, (app) => app
    .post("/", createAssessmentController, {
      params: t.Object({ schoolId: t.String() }),
      body: createAssessmentSchema,
      detail: { summary: "Create assessment within exam", tags: ["Exams"] },
    })
    .get("/:assessmentId", getAssessmentController, {
      params: t.Object({ schoolId: t.String(), assessmentId: t.String() }),
      detail: { summary: "Get assessment with results", tags: ["Exams"] },
    })
    .post("/:assessmentId/results", enterResultsController, {
      params: t.Object({ schoolId: t.String(), assessmentId: t.String() }),
      body: createResultSchema,
      detail: { summary: "Enter assessment results", tags: ["Exams"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("assessment:publish")] }, (app) => app
    .post("/:assessmentId/publish", publishResultsController, {
      params: t.Object({ schoolId: t.String(), assessmentId: t.String() }),
      detail: { summary: "Publish assessment results", tags: ["Exams"] },
    })
  )
