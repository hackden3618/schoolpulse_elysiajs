import { t } from "elysia"
import { nameString, uuidString, dateString } from "@/common/validation"

export const createExamSchema = t.Object({
  termId: uuidString(true),
  name: nameString(1, 200),
  type: t.Optional(t.UnionEnum(["cat", "midterm", "endterm", "mock", "opener", "continuous_assessment", "practical", "project", "oral", "national", "custom"])),
  startDate: dateString(true),
  endDate: dateString(true),
})

export const updateExamSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  type: t.Optional(t.UnionEnum(["cat", "midterm", "endterm", "mock", "opener", "continuous_assessment", "practical", "project", "oral", "national", "custom"])),
  startDate: dateString(false),
  endDate: dateString(false),
  completed: t.Optional(t.Boolean()),
})

export const createAssessmentSchema = t.Object({
  examId: uuidString(true),
  classInstanceId: uuidString(true),
  subjectId: uuidString(true),
  totalMarks: t.Number({ minimum: 1, maximum: 9999 }),
  accountedInFinal: t.Optional(t.Boolean()),
})

export const createResultSchema = t.Object({
  results: t.Array(t.Object({
    studentId: uuidString(true),
    attainedMarks: t.Number({ minimum: 0 }),
    remarks: t.Optional(t.String({ maxLength: 500 })),
  })),
})

export const publishAssessmentSchema = t.Object({})

export type CreateExamInput = typeof createExamSchema.static
export type UpdateExamInput = typeof updateExamSchema.static
export type CreateAssessmentInput = typeof createAssessmentSchema.static
export type CreateResultInput = typeof createResultSchema.static
