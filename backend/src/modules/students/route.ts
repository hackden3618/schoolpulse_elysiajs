import { Elysia, t } from "elysia";
import { API_PREFIX } from "@/shared/constants";
import { errorHandler } from "@/common/middleware";
import {
  getStudentsController,
  getStudentController,
  createStudentController,
  updateStudentController,
  archiveStudentController,
  linkGuardianController,
  unlinkGuardianController,
  enrollStudentController,
} from "./controller";
import {
  createStudentSchema,
  updateStudentSchema,
  linkGuardianSchema,
  archiveStudentSchema,
  enrollStudentSchema,
} from "./schema";

export const studentRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/students` })
  .use(errorHandler)
  .get("/", getStudentsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List students", tags: ["Students"] },
  })
  .post("/", createStudentController, {
    params: t.Object({ schoolId: t.String() }),
    body: createStudentSchema,
    detail: { summary: "Admit student", tags: ["Students"] },
  })
  .get("/:studentId", getStudentController, {
    params: t.Object({ schoolId: t.String(), studentId: t.String() }),
    detail: { summary: "Get student profile", tags: ["Students"] },
  })
  .patch("/:studentId", updateStudentController, {
    params: t.Object({ schoolId: t.String(), studentId: t.String() }),
    body: updateStudentSchema,
    detail: { summary: "Update student profile", tags: ["Students"] },
  })
  .post("/:studentId/archive", archiveStudentController, {
    params: t.Object({ schoolId: t.String(), studentId: t.String() }),
    body: archiveStudentSchema,
    detail: { summary: "Archive student", tags: ["Students"] },
  })
  .post("/:studentId/guardians", linkGuardianController, {
    params: t.Object({ schoolId: t.String(), studentId: t.String() }),
    body: linkGuardianSchema,
    detail: { summary: "Link guardian to student", tags: ["Students"] },
  })
  .delete("/:studentId/guardians/:guardianId", unlinkGuardianController, {
    params: t.Object({
      schoolId: t.String(),
      studentId: t.String(),
      guardianId: t.String(),
    }),
    detail: { summary: "Remove guardian link", tags: ["Students"] },
  })
  .post("/:studentId/enrollments", enrollStudentController, {
    params: t.Object({ schoolId: t.String(), studentId: t.String() }),
    body: enrollStudentSchema,
    detail: { summary: "Enroll student in class", tags: ["Students"] },
  });
