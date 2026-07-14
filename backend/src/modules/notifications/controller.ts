import { success } from "@/common/responses"
import * as svc from "./service"

export async function getConversationsController({ params: { schoolId }, authUser, set }: any) {
  const result = await svc.listConversations(schoolId, authUser)
  return success(result, schoolId)
}

export async function createConversationController({ params: { schoolId }, body, authUser, set }: any) {
  set.status = 201
  const result = await svc.createConversation(schoolId, authUser, body)
  return success(result, schoolId)
}

export async function getConversationController({ params: { schoolId, conversationId }, set }: any) {
  const result = await svc.getConversation(schoolId, conversationId)
  return success(result, schoolId)
}

export async function getMessagesController({ params: { schoolId, conversationId }, set }: any) {
  const result = await svc.listMessages(schoolId, conversationId)
  return success(result, schoolId)
}

export async function sendMessageController({ params: { schoolId, conversationId }, body, authUser, set }: any) {
  set.status = 201
  const result = await svc.sendMessage(schoolId, conversationId, authUser, body)
  return success(result, schoolId)
}

export async function markMessageReadController({ params: { schoolId, messageId }, authUser, set }: any) {
  const result = await svc.markMessageRead(schoolId, messageId, authUser.userId)
  return success(result, schoolId)
}

export async function deleteMessageController({ params: { schoolId, messageId }, authUser, set }: any) {
  const result = await svc.deleteMessage(schoolId, messageId, authUser.userId)
  return success(result, schoolId)
}

export async function deleteConversationController({ params: { schoolId, conversationId }, authUser, set }: any) {
  const result = await svc.deleteConversation(schoolId, conversationId, authUser.userId)
  return success(result, schoolId)
}

export async function editMessageController({ params: { schoolId, messageId }, body, authUser, set }: any) {
  const result = await svc.editMessage(schoolId, messageId, authUser.userId, body.content)
  return success(result, schoolId)
}
