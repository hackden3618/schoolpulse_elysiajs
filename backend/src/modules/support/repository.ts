import { prisma } from "@/infrastructure/database/prisma"
import type { Prisma } from "@root/generated/prisma-client/client"

const ticketInclude = {
  creator: { select: { id: true, firstName: true, lastName: true, phone: true } },
  school: { select: { id: true, schoolName: true, schoolCode: true } },
  _count: { select: { messages: true } },
} as const

const messageInclude = {
  sender: { select: { id: true, firstName: true, lastName: true } },
} as const

export async function createTicket(data: {
  schoolId: string
  subject: string
  category: string
  createdBy: string
}) {
  return prisma.supportTicket.create({
    data: {
      schoolId: data.schoolId,
      subject: data.subject,
      category: data.category as any,
      createdBy: data.createdBy,
    },
    include: ticketInclude,
  })
}

export async function findTicketsBySchool(
  schoolId: string,
  filters?: { status?: string; category?: string; createdBy?: string }
) {
  const where: any = { schoolId, deletedAt: null }
  if (filters?.status) where.status = filters.status
  if (filters?.category) where.category = filters.category
  if (filters?.createdBy) where.createdBy = filters.createdBy
  return prisma.supportTicket.findMany({
    where,
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
  })
}

export async function findAllTickets(
  filters?: { status?: string; category?: string; q?: string }
) {
  const where: any = { deletedAt: null }
  if (filters?.status) where.status = filters.status
  if (filters?.category) where.category = filters.category
  if (filters?.q) {
    where.OR = [
      { subject: { contains: filters.q, mode: "insensitive" } },
      { school: { schoolName: { contains: filters.q, mode: "insensitive" } } },
    ]
  }
  return prisma.supportTicket.findMany({
    where,
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
  })
}

export async function findTicketById(id: string) {
  return prisma.supportTicket.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...ticketInclude,
      messages: {
        where: { deletedAt: null },
        include: messageInclude,
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function createMessage(data: {
  ticketId: string
  senderId: string
  content: string
  isFromPlatform?: boolean
}) {
  return prisma.supportTicketMessage.create({
    data,
    include: messageInclude,
  })
}

export async function findMessagesByTicket(ticketId: string) {
  return prisma.supportTicketMessage.findMany({
    where: { ticketId, deletedAt: null },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  })
}

export async function updateTicketStatus(id: string, status: string) {
  return prisma.supportTicket.update({
    where: { id },
    data: { status: status as any },
    include: ticketInclude,
  })
}
