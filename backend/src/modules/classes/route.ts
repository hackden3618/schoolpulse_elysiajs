import { Elysia, t } from "elysia";
import { API_PREFIX } from "@/shared/constants";
import { errorHandler } from "@/common/middleware";
import {
  getAcademicYearsController,
  getAcademicYearController,
  createAcademicYearController,
  activateAcademicYearController,
  getTermsController,
  createTermController,
  activateTermController,
  getClassesController,
  createClassController,
  getClassInstancesController,
  createClassInstanceController,
  getSubjectsController,
  createSubjectController,
  assignSubjectsController,
} from "./controller";
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createTermSchema,
  createClassSchema,
  createClassInstanceSchema,
  createSubjectSchema,
  assignSubjectsSchema,
} from "./schema";

const academicYearRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/academic-years` })
  .use(errorHandler)
  .get("/", getAcademicYearsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List academic years", tags: ["Academic"] },
  })
  .post("/", createAcademicYearController, {
    params: t.Object({ schoolId: t.String() }),
    body: createAcademicYearSchema,
    detail: { summary: "Create academic year", tags: ["Academic"] },
  })
  .patch("/:academicYearId", getAcademicYearController, {
    params: t.Object({ schoolId: t.String(), academicYearId: t.String() }),
    body: updateAcademicYearSchema,
    detail: { summary: "Update academic year", tags: ["Academic"] },
  })
  .post("/:academicYearId/activate", activateAcademicYearController, {
    params: t.Object({ schoolId: t.String(), academicYearId: t.String() }),
    detail: { summary: "Activate academic year", tags: ["Academic"] },
  });

const termRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/terms` })
  .use(errorHandler)
  .get("/", getTermsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List terms", tags: ["Academic"] },
  })
  .post("/", createTermController, {
    params: t.Object({ schoolId: t.String() }),
    body: createTermSchema,
    detail: { summary: "Create term", tags: ["Academic"] },
  })
  .post("/:termId/activate", activateTermController, {
    params: t.Object({ schoolId: t.String(), termId: t.String() }),
    detail: { summary: "Activate term", tags: ["Academic"] },
  });

const classRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/classes` })
  .use(errorHandler)
  .get("/", getClassesController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List classes", tags: ["Academic"] },
  })
  .post("/", createClassController, {
    params: t.Object({ schoolId: t.String() }),
    body: createClassSchema,
    detail: { summary: "Create class", tags: ["Academic"] },
  });

const classInstanceRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/class-instances` })
  .use(errorHandler)
  .get("/", getClassInstancesController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List class instances", tags: ["Academic"] },
  })
  .post("/", createClassInstanceController, {
    params: t.Object({ schoolId: t.String() }),
    body: createClassInstanceSchema,
    detail: { summary: "Create class instance", tags: ["Academic"] },
  })
  .put("/:classInstanceId/subjects", assignSubjectsController, {
    params: t.Object({ schoolId: t.String(), classInstanceId: t.String() }),
    body: assignSubjectsSchema,
    detail: { summary: "Assign subjects and teachers", tags: ["Academic"] },
  });

const subjectRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/subjects` })
  .use(errorHandler)
  .get("/", getSubjectsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List subjects", tags: ["Academic"] },
  })
  .post("/", createSubjectController, {
    params: t.Object({ schoolId: t.String() }),
    body: createSubjectSchema,
    detail: { summary: "Create subject", tags: ["Academic"] },
  });

export {
  academicYearRoute,
  termRoute,
  classRoute,
  classInstanceRoute,
  subjectRoute,
};
