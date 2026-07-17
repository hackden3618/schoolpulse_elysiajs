import { prisma } from "@/infrastructure/database/prisma"

const conversationInclude = {
  participants: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      membership: { include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } } },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: {
      sender: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      receipts: true,
    },
  },
} as const

const messageInclude = {
  sender: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      roles: { include: { role: { select: { id: true, name: true } } } },
    },
  },
  recipient: { select: { id: true, firstName: true, lastName: true } },
  receipts: true,
} as const

export async function findConversations(schoolId: string, userId?: string) {
  const where: any = { schoolId, deletedAt: null }
  if (userId) {
    where.participants = { some: { userId } }
  }
  return prisma.conversation.findMany({
    where,
    include: conversationInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findConversationById(schoolId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, schoolId, deletedAt: null },
    include: conversationInclude,
  })
}

export async function createConversation(data: any) {
  return prisma.conversation.create({ data, include: conversationInclude })
}

export async function addParticipants(conversationId: string, participantData: any[]) {
  return prisma.conversationParticipant.createMany({ data: participantData })
}

export async function findMessages(schoolId: string, conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId, schoolId, deletedAt: null },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  })
}

export async function findMessageById(schoolId: string, messageId: string) {
  return prisma.message.findFirst({
    where: { id: messageId, schoolId, deletedAt: null },
    include: messageInclude,
  })
}

export async function createMessage(data: any) {
  return prisma.message.create({ data, include: messageInclude })
}

export async function softDeleteMessage(messageId: string, schoolId: string) {
  return prisma.message.update({
    where: { id: messageId, schoolId },
    data: { deletedAt: new Date() },
  })
}

export async function softDeleteConversation(conversationId: string, schoolId: string) {
  return prisma.conversation.update({
    where: { id: conversationId, schoolId },
    data: { deletedAt: new Date() },
  })
}

export async function updateMessage(messageId: string, schoolId: string, data: { content: string }) {
  return prisma.message.update({
    where: { id: messageId, schoolId },
    data,
    include: messageInclude,
  })
}
