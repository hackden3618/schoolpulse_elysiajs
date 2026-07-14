import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { wsManager } from "@/infrastructure/websocket"
import * as repo from "./repository"
import type { CreateTicketInput } from "./schema"

interface ListTicketsQuery {
  status?: string
  category?: string
  q?: string
}

interface SendTicketMessageInput {
  content: string
}

export async function createTicket(
  schoolId: string,
  authUser: { userId?: string },
  data: CreateTicketInput
) {
  if (!authUser.userId) throw AppError.unauthenticated("Authentication required")

  const membership = await prisma.schoolMembership.findFirst({
    where: { schoolId, userId: authUser.userId, deletedAt: null },
  })
  if (!membership) throw AppError.forbidden("You are not a member of this school")

  const ticket = await repo.createTicket({
    schoolId,
    subject: data.subject,
    category: data.category ?? "support",
    createdBy: authUser.userId,
  })

  await repo.createMessage({
    ticketId: ticket.id,
    senderId: authUser.userId,
    content: data.message,
  })

  const full = await repo.findTicketById(ticket.id)
  wsManager.broadcastToSchool(schoolId, "support:ticket:new", full)
  wsManager.broadcastToAdmins("support:ticket:new", full)

  return full
}

export async function listSchoolTickets(
  schoolId: string,
  authUser: { userId?: string },
  filters?: { status?: string; category?: string }
) {
  if (!authUser.userId) throw AppError.unauthenticated("Authentication required")
  const membership = await prisma.schoolMembership.findFirst({
    where: { schoolId, userId: authUser.userId, deletedAt: null },
  })
  if (!membership) throw AppError.forbidden("You are not a member of this school")
  return repo.findTicketsBySchool(schoolId, filters)
}

export async function listAllTickets(filters?: ListTicketsQuery) {
  return repo.findAllTickets(filters)
}

export async function getTicket(ticketId: string) {
  const ticket = await repo.findTicketById(ticketId)
  if (!ticket) throw AppError.notFound("Support ticket not found")
  return ticket
}

export async function sendMessage(
  ticketId: string,
  senderId: string,
  data: SendTicketMessageInput,
  isFromPlatform: boolean
) {
  const ticket = await repo.findTicketById(ticketId)
  if (!ticket) throw AppError.notFound("Support ticket not found")

  let resolvedSenderId = senderId

  if (isFromPlatform) {
    const platformAdmin = await prisma.platformAdmin.findFirst({
      where: { id: senderId, deletedAt: null },
    })
    if (!platformAdmin) throw AppError.unauthenticated("Platform admin not found")

    let user = platformAdmin.email
      ? await prisma.user.findFirst({ where: { email: platformAdmin.email, deletedAt: null } })
      : null

    if (!user && platformAdmin.email) {
      user = await prisma.user.create({
        data: {
          firstName: platformAdmin.firstName,
          lastName: platformAdmin.lastName,
          email: platformAdmin.email,
          phone: platformAdmin.phone,
          status: "active",
        },
      })
    }

    if (!user) throw AppError.unauthenticated("Could not resolve user for platform admin")
    resolvedSenderId = user.id
  } else {
    const user = await prisma.user.findFirst({ where: { id: senderId, deletedAt: null } })
    if (!user) throw AppError.unauthenticated("User not found")
  }

  const msg = await repo.createMessage({
    ticketId,
    senderId: resolvedSenderId,
    content: data.content,
    isFromPlatform,
  })

  if (!isFromPlatform && ticket.status === "closed") {
    await repo.updateTicketStatus(ticketId, "open")
  }

  const updated = await repo.findTicketById(ticketId)

  const event = "support:message:new"
  wsManager.broadcastToSchool(ticket.schoolId, event, { message: msg, ticket: updated })
  wsManager.broadcastToAdmins(event, { message: msg, ticket: updated })

  return { message: msg, ticket: updated }
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  actorId: string
) {
  const ticket = await repo.findTicketById(ticketId)
  if (!ticket) throw AppError.notFound("Support ticket not found")

  const updated = await repo.updateTicketStatus(ticketId, status)

  const event = "support:ticket:updated"
  wsManager.broadcastToSchool(ticket.schoolId, event, updated)
  wsManager.broadcastToAdmins(event, updated)

  return updated
}
