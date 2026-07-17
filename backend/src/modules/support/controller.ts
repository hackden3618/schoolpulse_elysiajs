import { success } from "@/common/responses"
import * as svc from "./service"

export async function createTicketController({ params: { schoolId }, body, authUser, set }: any) {
  const ticket = await svc.createTicket(schoolId, authUser, body)
  set.status = 201
  return success(ticket, schoolId)
}

export async function listSchoolTicketsController({ params: { schoolId }, query, authUser }: any) {
  const tickets = await svc.listSchoolTickets(schoolId, authUser, {
    status: query?.status,
    category: query?.category,
  })
  return success(tickets, schoolId)
}

export async function getTicketController({ params: { ticketId }, authUser }: any) {
  const ticket = await svc.getTicket(ticketId, authUser)
  return success(ticket, ticket.schoolId)
}

export async function sendTicketMessageController({ params: { schoolId, ticketId }, body, authUser }: any) {
  const result = await svc.sendMessage(ticketId, authUser?.userId, body, false, schoolId)
  return success(result, result.ticket?.schoolId)
}

export async function listAllTicketsController({ query }: any) {
  const tickets = await svc.listAllTickets({
    status: query?.status,
    category: query?.category,
    q: query?.q,
  })
  return success(tickets)
}

export async function platformSendMessageController({ params: { ticketId }, body, platformAdmin }: any) {
  const result = await svc.sendMessage(ticketId, platformAdmin.id, body, true)
  return success(result, result.ticket?.schoolId)
}

export async function platformUpdateStatusController({ params: { ticketId }, body, platformAdmin }: any) {
  const updated = await svc.updateTicketStatus(ticketId, body.status, platformAdmin.id)
  return success(updated, updated.schoolId)
}
