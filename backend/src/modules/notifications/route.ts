import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import {
  getConversationsController,
  createConversationController,
  getConversationController,
  getMessagesController,
  sendMessageController,
  markMessageReadController,
  deleteMessageController,
  deleteConversationController,
  editMessageController,
} from "./controller"
import { createConversationSchema, sendMessageSchema, editMessageSchema } from "./schema"

export const notificationsRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId` })
  .use(errorHandler)
  .use(authGuard)
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
  .post("/messages/:messageId/read", markMessageReadController, {
    params: t.Object({ schoolId: t.String(), messageId: t.String() }),
    detail: { summary: "Mark message as read", tags: ["Notifications"] },
  })
  .delete("/messages/:messageId", deleteMessageController, {
    params: t.Object({ schoolId: t.String(), messageId: t.String() }),
    detail: { summary: "Delete (soft) a message", tags: ["Notifications"] },
  })
  .delete("/conversations/:conversationId", deleteConversationController, {
    params: t.Object({ schoolId: t.String(), conversationId: t.String() }),
    detail: { summary: "Delete (soft) a conversation", tags: ["Notifications"] },
  })
  .patch("/messages/:messageId", editMessageController, {
    params: t.Object({ schoolId: t.String(), messageId: t.String() }),
    body: editMessageSchema,
    detail: { summary: "Edit a message (in-app, within 30 min)", tags: ["Notifications"] },
  })
