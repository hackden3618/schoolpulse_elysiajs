import { t } from "elysia"
import { uuidString, dateString } from "@/common/validation"

export const createSessionSchema = t.Object({
  classInstanceId: uuidString(true),
  sessionDate: dateString(true),
  sessionType: t.UnionEnum(["morning", "afternoon", "lesson"]),
})

export const updateRecordSchema = t.Object({
  status: t.UnionEnum(["present", "absent", "late", "excused"]),
  editReason: t.Optional(t.String({ maxLength: 500 })),
})

export type CreateSessionInput = typeof createSessionSchema.static
export type UpdateRecordInput = typeof updateRecordSchema.static
