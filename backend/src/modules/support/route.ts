import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import { platformAuthGuard } from "@/modules/platform-admin/platformAuthGuard"
import {
  createTicketController,
  listSchoolTicketsController,
  getTicketController,
  sendTicketMessageController,
  listAllTicketsController,
  platformSendMessageController,
  platformUpdateStatusController,
} from "./controller"

export const schoolSupportRoute = new Elysia({
  prefix: `${API_PREFIX}/schools/:schoolId/support`,
})
  .use(errorHandler)
  .use(authGuard)
  .get("/tickets", listSchoolTicketsController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List support tickets for school", tags: ["Support"] },
  })
  .post("/tickets", createTicketController, {
    params: t.Object({ schoolId: t.String() }),
    body: t.Object({
      subject: t.String({ minLength: 1, maxLength: 200 }),
      category: t.Optional(t.UnionEnum(["query", "support", "feedback", "other"])),
      message: t.String({ minLength: 1, maxLength: 2000 }),
    }),
    detail: { summary: "Create a support ticket", tags: ["Support"] },
  })
  .get("/tickets/:ticketId", getTicketController, {
    params: t.Object({ schoolId: t.String(), ticketId: t.String() }),
    detail: { summary: "Get a support ticket with messages", tags: ["Support"] },
  })
  .post("/tickets/:ticketId/messages", sendTicketMessageController, {
    params: t.Object({ schoolId: t.String(), ticketId: t.String() }),
    body: t.Object({
      content: t.String({ minLength: 1, maxLength: 2000 }),
    }),
    detail: { summary: "Send a message on a support ticket", tags: ["Support"] },
  })

export const platformSupportRoute = new Elysia({
  prefix: `${API_PREFIX}/platform/support`,
})
  .use(errorHandler)
  .use(platformAuthGuard)
  .get("/tickets", listAllTicketsController, {
    detail: { summary: "List all support tickets (platform)", tags: ["Support"] },
  })
  .get("/tickets/:ticketId", getTicketController, {
    params: t.Object({ ticketId: t.String() }),
    detail: { summary: "Get support ticket detail (platform)", tags: ["Support"] },
  })
  .post("/tickets/:ticketId/messages", platformSendMessageController, {
    params: t.Object({ ticketId: t.String() }),
    body: t.Object({
      content: t.String({ minLength: 1, maxLength: 2000 }),
    }),
    detail: { summary: "Platform admin replies to ticket", tags: ["Support"] },
  })
  .patch("/tickets/:ticketId/status", platformUpdateStatusController, {
    params: t.Object({ ticketId: t.String() }),
    body: t.Object({
      status: t.UnionEnum(["open", "in_progress", "resolved", "closed"]),
    }),
    detail: { summary: "Update support ticket status", tags: ["Support"] },
  })
