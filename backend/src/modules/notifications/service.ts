import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { wsManager } from "@/infrastructure/websocket"
import { sendSms } from "@/modules/communication/sms/service"
import { normalizePhone } from "@/common/validation"
import { cleanPhone } from "@/shared/utils"
import * as repo from "./repository"
import type { CreateConversationInput, SendMessageInput } from "./schema"

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
    if (data.participantIds) {
      for (const userId of data.participantIds) {
        participants.push({ schoolId, conversationId: conv.id, userId, participantType: "member" })
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

export async function getConversation(schoolId: string, conversationId: string) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")
  return conv
}

export async function listMessages(schoolId: string, conversationId: string) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")
  return repo.findMessages(schoolId, conversationId)
}

function normalizeMobileForSms(mobile: string) {
  const normalized = normalizePhone(cleanPhone(mobile))
  return normalized.replace(/^\+/, "")
}

export async function sendMessage(schoolId: string, conversationId: string, authUser: { membershipId?: string; userId?: string }, data: SendMessageInput) {
  const conv = await repo.findConversationById(schoolId, conversationId)
  if (!conv) throw AppError.notFound("Conversation not found")

  let receipts: any[] = []
  if (data.channel === "sms") {
    const recipients = Array.from(
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
      const userId = participant.user?.id ?? participant.membership?.user?.id
      if (!userId) continue
      userByPhone.set(normalizeMobileForSms(phone), userId)
    }

    receipts = smsResult.results.map((result) => ({
      schoolId,
      recipientUserId: userByPhone.get(result.mobile) ?? null,
      status: result.success ? "sent" : "failed",
      channel: "sms",
      providerMessageId: result.messageId != null ? String(result.messageId) : undefined,
    }))
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

  return message
}

export async function markMessageRead(schoolId: string, messageId: string, userId: string) {
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

  const message = await repo.findMessageById(schoolId, messageId)
  if (message) {
    wsManager.broadcastToConversation(message.conversationId!, "receipt:updated", message)
  }

  return { success: true }
}
