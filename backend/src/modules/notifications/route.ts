import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import {
  getConversationsController,
  createConversationController,
  getConversationController,
  getMessagesController,
  sendMessageController,
} from "./controller"
import { createConversationSchema, sendMessageSchema } from "./schema"

export const notificationsRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId` })
  .use(errorHandler)
  .get("/conversations", getConversationsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List conversations", tags: ["Notifications"] },
  })
  .post("/conversations", createConversationController, {
    params: t.Object({ schoolId: t.String() }),
    body: createConversationSchema,
    detail: { summary: "Create conversation", tags: ["Notifications"] },
  })
  .get("/conversations/:conversationId", getConversationController, {
    params: t.Object({ schoolId: t.String(), conversationId: t.String() }),
    detail: { summary: "Get conversation with messages", tags: ["Notifications"] },
  })
  .get("/conversations/:conversationId/messages", getMessagesController, {
    params: t.Object({ schoolId: t.String(), conversationId: t.String() }),
    detail: { summary: "List messages in conversation", tags: ["Notifications"] },
  })
  .post("/conversations/:conversationId/messages", sendMessageController, {
    params: t.Object({ schoolId: t.String(), conversationId: t.String() }),
    body: sendMessageSchema,
    detail: { summary: "Send message in conversation", tags: ["Notifications"] },
  })
