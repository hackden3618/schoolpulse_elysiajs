import { Elysia, t } from "elysia";
import { API_PREFIX } from "@/shared/constants";
import { errorHandler, authGuard, checkPermission } from "@/common/middleware";
import {
  getStudentsController,
  getStudentController,
  createStudentController,
  updateStudentController,
  archiveStudentController,
  unarchiveStudentController,
  linkGuardianController,
  unlinkGuardianController,
  enrollStudentController,
  updateEnrollmentController,
  addGuardianByDetailsController,
  getMyStudentsController,
} from "./controller";
import {
  createStudentSchema,
  updateStudentSchema,
  linkGuardianSchema,
  archiveStudentSchema,
  enrollStudentSchema,
  updateEnrollmentSchema,
  addGuardianByDetailsSchema,
} from "./schema";

const P = `${API_PREFIX}/schools/:schoolId/students`;

export const studentRoute = new Elysia({ prefix: P })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("student:read")] }, (app) => app
    .get("/", getStudentsController, {
      params: t.Object({ schoolId: t.String() }),
      query: t.Object({ includeArchived: t.Optional(t.String()) }),
      detail: { summary: "List students", tags: ["Students"] },
    })
    .get("/:studentId", getStudentController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      detail: { summary: "Get student profile", tags: ["Students"] },
    })
    .get("/my", getMyStudentsController, {
      params: t.Object({ schoolId: t.String() }),
      detail: { summary: "Get my students (guardian view)", tags: ["Students"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("student:write")] }, (app) => app
    .post("/", createStudentController, {
      params: t.Object({ schoolId: t.String() }),
      body: createStudentSchema,
      detail: { summary: "Admit student", tags: ["Students"] },
    })
    .patch("/:studentId", updateStudentController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      body: updateStudentSchema,
      detail: { summary: "Update student profile", tags: ["Students"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("student:archive")] }, (app) => app
    .post("/:studentId/archive", archiveStudentController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      body: archiveStudentSchema,
      detail: { summary: "Archive student", tags: ["Students"] },
    })
    .post("/:studentId/unarchive", unarchiveStudentController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      detail: { summary: "Restore archived student", tags: ["Students"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("guardian:link")] }, (app) => app
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
    .post("/:studentId/guardians/by-details", addGuardianByDetailsController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      body: addGuardianByDetailsSchema,
      detail: { summary: "Add guardian by contact details (creates user if needed)", tags: ["Students"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("enrollment:write")] }, (app) => app
    .post("/:studentId/enrollments", enrollStudentController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      body: enrollStudentSchema,
      detail: { summary: "Enroll student in class", tags: ["Students"] },
    })
    .patch("/:studentId/enrollments/:enrollmentId", updateEnrollmentController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String(), enrollmentId: t.String() }),
      body: updateEnrollmentSchema,
      detail: { summary: "Update student enrollment", tags: ["Students"] },
    })
  );
