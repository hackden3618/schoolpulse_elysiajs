import { t } from "elysia"
import { uuidString } from "@/common/validation"

export const createConversationSchema = t.Object({
  type: t.UnionEnum(["direct", "group", "announcement"]),
  subject: t.Optional(t.String({ maxLength: 200 })),
  participantIds: t.Optional(t.Array(uuidString(true))),
})

export const sendMessageSchema = t.Object({
  content: t.String({ minLength: 1, maxLength: 5000 }),
  channel: t.Optional(t.UnionEnum(["in_app", "sms", "email"])),
  priority: t.Optional(t.UnionEnum(["low", "normal", "high", "urgent"])),
  recipientUserId: t.Optional(uuidString(false)),
})

export type CreateConversationInput = typeof createConversationSchema.static
export type SendMessageInput = typeof sendMessageSchema.static
