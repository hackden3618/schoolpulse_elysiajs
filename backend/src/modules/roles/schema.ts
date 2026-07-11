import { t } from "elysia"

export const roleResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  permissions: t.Array(t.Any()),
  createdAt: t.String(),
  updatedAt: t.String(),
})
