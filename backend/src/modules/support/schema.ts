import { t } from "elysia"

export const createTicketSchema = t.Object({
  subject: t.String({ minLength: 1, maxLength: 200 }),
  category: t.Optional(t.UnionEnum(["query", "support", "feedback", "other"])),
  message: t.String({ minLength: 1, maxLength: 2000 }),
})

export type CreateTicketInput = typeof createTicketSchema.static
