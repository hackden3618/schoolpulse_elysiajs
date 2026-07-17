import { t } from "elysia";
import { nameString, uuidString, dateString } from "@/common/validation";

export const createAcademicYearSchema = t.Object({
  name: nameString(1, 100),
  startDate: dateString(true),
  endDate: dateString(true),
});

export const updateAcademicYearSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  startDate: dateString(false),
  endDate: dateString(false),
});

export const createTermSchema = t.Object({
  academicYearId: uuidString(true),
  name: nameString(1, 100),
  startDate: dateString(true),
  endDate: dateString(true),
});

export const updateTermSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  startDate: dateString(false),
  endDate: dateString(false),
});

export const createClassSchema = t.Object({
  name: nameString(1, 100),
  level: t.Number({ minimum: 1, maximum: 20 }),
});

export const createClassInstanceSchema = t.Object({
  classId: uuidString(true),
  academicYearId: uuidString(true),
  streamName: t.String({ minLength: 1, maxLength: 50, pattern: "^[A-Za-z0-9 -]+$" }),
});

export const createSubjectSchema = t.Object({
  name: nameString(1, 100),
  code: t.String({ minLength: 1, maxLength: 20, pattern: "^[A-Za-z0-9/]+$" }),
  isCompulsory: t.Optional(t.Boolean({ default: true })),
});

export const assignSubjectsSchema = t.Object({
  assignments: t.Array(
    t.Object({
      subjectId: uuidString(true),
      teacherMembershipId: uuidString(false),
    })
  ),
});

export type CreateAcademicYearInput = typeof createAcademicYearSchema.static;
export type UpdateAcademicYearInput = typeof updateAcademicYearSchema.static;
export type CreateTermInput = typeof createTermSchema.static;
export type UpdateTermInput = typeof updateTermSchema.static;
export type CreateClassInput = typeof createClassSchema.static;
export type CreateClassInstanceInput = typeof createClassInstanceSchema.static;
export type CreateSubjectInput = typeof createSubjectSchema.static;
export type AssignSubjectsInput = typeof assignSubjectsSchema.static;
