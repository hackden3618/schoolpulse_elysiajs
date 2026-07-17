import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { wsManager } from "@/infrastructure/websocket"
import { sendSms } from "@/modules/communication/sms/service"
import { normalizePhone } from "@/common/validation"
import { DURATION } from "@/shared/constants"
import * as repo from "./repository"
import type { CreateConversationInput, SendMessageInput } from "./schema"

function isParticipant(conv: { participants: { userId: string | null }[] }, userId: string): boolean {
  return conv.participants.some((p) => p.userId === userId)
}

function assertParticipant(conv: { participants: { userId: string | null }[] }, userId: string) {
  if (!isParticipant(conv, userId)) {
    throw AppError.forbidden("You are not a participant in this conversation")
  }
}

export async function listConversations(schoolId: string, authUser: { userId?: string }) {
  return repo.findConversations(schoolId, authUser.userId)
}

export async function createConversation(schoolId: string, authUser: { userId?: string | null }, data: CreateConversationInput) {
  const convId = await prisma.$transaction(async (tx: any) => {
    const conv = await tx.conversation.create({
      data: {
        schoolId,
        type: data.type,
        subject: data.subject,
      },
    })

    const participants: { schoolId: string; conversationId: string; userId: string; participantType: string }[] = []
    if (authUser.userId) {
      participants.push({ schoolId, conversationId: conv.id, userId: authUser.userId, participantType: "member" })
    }

    if (data.type === "announcement") {
      const allMembers = await tx.schoolMembership.findMany({
        where: { schoolId, deletedAt: null, user: { deletedAt: null } },
        select: { userId: true },
      })
      for (const m of allMembers) {
        if (m.userId !== authUser.userId) {
          participants.push({ schoolId, conversationId: conv.id, userId: m.userId, participantType: "member" })
        }
      }
    } else if (data.participantIds) {
      const validMemberships = await tx.schoolMembership.findMany({
        where: { schoolId, userId: { in: data.participantIds }, deletedAt: null },
        select: { userId: true },
      })
      const validUserIds = new Set(validMemberships.map((m: any) => m.userId))
      for (const userId of data.participantIds) {
        if (validUserIds.has(userId)) {
          participants.push({ schoolId, conversationId: conv.id, userId, participantType: "member" })
        }
      }
    }
    await tx.conversationParticipant.createMany({ data: participants })

    return conv.id
  })

  const result = await repo.findConversationById(schoolId, convId)

  await writeEventOutbox({
    schoolId,
    aggregateId: result!.id,
    aggregateType: "conversation",
    eventType: "ConversationCreated",
    payload: { type: data.type },
  })

  wsManager.broadcastToSchool(schoolId, "conversation:created", result)

  return result
}

export async function getConversation(schoolId: string, conversationId: string, userId?: string) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")
  if (userId) assertParticipant(conv, userId)
  return conv
}

export async function listMessages(schoolId: string, conversationId: string, userId?: string) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")
  if (userId) assertParticipant(conv, userId)
  return repo.findMessages(schoolId, conversationId)
}

function normalizeMobileForSms(mobile: string) {
  return normalizePhone(mobile).replace(/^\+/, "")
}

export async function sendMessage(schoolId: string, conversationId: string, authUser: { membershipId?: string; userId?: string }, data: SendMessageInput) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")
  if (authUser.userId) assertParticipant(conv, authUser.userId)

  let receipts: any[] = []
  if (data.channel === "sms") {
    const recipients = data.recipientPhones && data.recipientPhones.length > 0
      ? data.recipientPhones.map((p: string) => normalizeMobileForSms(p))
      : Array.from(
          new Set(
            conv.participants
              .map((p) => p.user?.phone ?? p.membership?.user?.phone)
              .filter(Boolean)
              .map((phone) => normalizeMobileForSms(phone as string))
          )
        )

    if (recipients.length === 0) {
      throw AppError.badRequest("No SMS recipients found for this conversation")
    }

    const smsResult = await sendSms({ recipients, message: data.content, schoolId })
    const userByPhone = new Map<string, string>()
    for (const participant of conv.participants) {
      const phone = participant.user?.phone ?? participant.membership?.user?.phone
      if (!phone) continue
      const uid = participant.user?.id ?? participant.membership?.user?.id
      if (!uid) continue
      userByPhone.set(normalizeMobileForSms(phone), uid)
    }

    receipts = smsResult.results.map((result) => ({
      schoolId,
      recipientUserId: userByPhone.get(result.mobile) ?? null,
      status: result.success ? "sent" : "failed",
      channel: "sms",
      providerMessageId: result.messageId != null ? String(result.messageId) : undefined,
    }))
  }

  if (data.channel !== "sms" && authUser.userId) {
    for (const p of conv.participants) {
      const uid = p.user?.id ?? p.membership?.user?.id
      if (uid && uid !== authUser.userId) {
        receipts.push({
          schoolId,
          recipientUserId: uid,
          status: "sent",
          channel: "in_app",
        })
      }
    }
  }

  const message = await repo.createMessage({
    schoolId,
    conversationId,
    senderMembershipId: authUser.membershipId ?? null,
    recipientUserId: data.recipientUserId ?? null,
    channel: data.channel ?? "in_app",
    messageType: "text",
    priority: data.priority ?? "normal",
    content: data.content,
    ...(receipts.length > 0 ? { receipts: { create: receipts } } : {}),
  })

  await writeEventOutbox({
    schoolId,
    aggregateId: message.id,
    aggregateType: "conversation",
    eventType: "MessageSent",
    payload: { conversationId, channel: data.channel ?? "in_app" },
  })

  wsManager.broadcastToConversation(conversationId, "message:new", message)

  if (conv.type === "announcement") {
    wsManager.broadcastToSchool(schoolId, "message:new", message)
  }

  return message
}

export async function deleteConversation(schoolId: string, conversationId: string, userId: string) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")

  assertParticipant(conv, userId)

  await repo.softDeleteConversation(conversationId, schoolId)

  wsManager.broadcastToConversation(conversationId, "conversation:deleted", {
    conversationId,
  })

  return { deleted: true }
}

export async function editMessage(schoolId: string, messageId: string, userId: string, content: string) {
  const message = await repo.findMessageById(schoolId, messageId)
  if (!message) throw AppError.notFound("Message not found")
  if (message.sender?.user?.id !== userId) {
    throw AppError.forbidden("You can only edit your own messages")
  }
  if (message.channel !== "in_app") {
    throw AppError.badRequest("Only in-app messages can be edited")
  }

  const age = Date.now() - new Date(message.createdAt).getTime()
  if (age > DURATION.THIRTY_MINUTES_MS) {
    throw AppError.badRequest("Messages can only be edited within 30 minutes of sending")
  }

  const updated = await repo.updateMessage(messageId, schoolId, { content })

  wsManager.broadcastToConversation(message.conversationId!, "message:updated", updated)

  return updated
}

export async function deleteMessage(schoolId: string, messageId: string, userId: string) {
  const message = await repo.findMessageById(schoolId, messageId)
  if (!message) throw AppError.notFound("Message not found")
  if (message.sender?.user?.id !== userId) {
    throw AppError.forbidden("You can only delete your own messages")
  }
  await repo.softDeleteMessage(messageId, schoolId)
  wsManager.broadcastToConversation(message.conversationId!, "message:deleted", {
    messageId,
    conversationId: message.conversationId,
  })
  return { deleted: true }
}

export async function markMessageRead(schoolId: string, messageId: string, userId: string) {
  const message = await repo.findMessageById(schoolId, messageId)
  if (!message) throw AppError.notFound("Message not found")

  const conv = await repo.findConversationById(schoolId, message.conversationId!)
  if (conv) assertParticipant(conv, userId)

  const existing = await prisma.messageReceipt.findFirst({
    where: { messageId, schoolId, recipientUserId: userId },
  })

  if (existing) {
    if (existing.status !== "read") {
      await prisma.messageReceipt.update({
        where: { id: existing.id },
        data: { status: "read" },
      })
    }
  } else {
    await prisma.messageReceipt.create({
      data: {
        schoolId,
        messageId,
        recipientUserId: userId,
        status: "read",
        channel: "in_app",
      },
    })
  }

  wsManager.broadcastToConversation(message.conversationId!, "receipt:updated", message)

  // Keep the recipient's unread badge accurate in real time. The count is
  // scoped to the caller so a tampered userId cannot read another user's total.
  const remainingUnread = await prisma.messageReceipt.count({
    where: { schoolId, recipientUserId: userId, status: { not: "read" } },
  })
  wsManager.broadcastToUser(userId, "UnreadCountChanged", { unreadCount: remainingUnread })

  return { success: true }
}
