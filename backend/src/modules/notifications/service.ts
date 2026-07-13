import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import { sendSms } from "@/modules/communication/sms/service"
import { cleanPhone } from "@/shared/utils"
import * as repo from "./repository"
import type { CreateConversationInput, SendMessageInput } from "./schema"

export async function listConversations(schoolId: string, authUser: { userId?: string }) {
  return repo.findConversations(schoolId, authUser.userId)
}

export async function createConversation(schoolId: string, authUser: { membershipId?: string }, data: CreateConversationInput) {
  const result = await prisma.$transaction(async (tx: any) => {
    const conv = await tx.conversation.create({
      data: {
        schoolId,
        type: data.type,
        subject: data.subject,
      },
    })

    const participants = [{ schoolId, conversationId: conv.id, userId: authUser.membershipId ?? "", participantType: "member" }]
    if (data.participantIds) {
      for (const userId of data.participantIds) {
        participants.push({ schoolId, conversationId: conv.id, userId, participantType: "member" })
      }
    }
    await tx.conversationParticipant.createMany({ data: participants })

    return repo.findConversationById(schoolId, conv.id)
  })

  await writeEventOutbox({
    schoolId,
    aggregateId: result!.id,
    aggregateType: "conversation",
    eventType: "ConversationCreated",
    payload: { type: data.type },
  })

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
  let normalized = cleanPhone(mobile)
  if (normalized.startsWith("+")) normalized = normalized.slice(1)
  if (normalized.startsWith("0")) normalized = `254${normalized.slice(1)}`
  return normalized
}

export async function sendMessage(schoolId: string, conversationId: string, authUser: { membershipId?: string }, data: SendMessageInput) {
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
      userByPhone.set(normalizeMobileForSms(phone), participant.user?.id ?? participant.membership?.user?.id)
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

  return message
}
