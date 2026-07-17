import { wsManager } from "./ws.manager"
import type { WsClient } from "./ws.types"
import * as notificationsService from "@/modules/notifications/service"

interface WsMessage {
  event: string
  data?: Record<string, unknown>
}

export function handleWsOpen(ws: WebSocket, userId: string, schoolId: string, isPlatformAdmin: boolean = false): WsClient {
  const client = wsManager.register(ws, userId, schoolId, isPlatformAdmin)
  return client
}

export function handleWsMessage(client: WsClient, raw: string | Buffer) {
  let parsed: WsMessage
  try {
    parsed = JSON.parse(raw.toString()) as WsMessage
  } catch {
    return
  }

  switch (parsed.event) {
    case "subscribe":
      if (typeof parsed.data?.conversationId === "string") {
        wsManager.subscribe(client, parsed.data.conversationId)
        client.ws.send(JSON.stringify({ event: "subscribed", data: { conversationId: parsed.data.conversationId } }))
      }
      break
    case "unsubscribe":
      if (typeof parsed.data?.conversationId === "string") {
        wsManager.unsubscribe(client, parsed.data.conversationId)
      }
      break
    case "mark_read":
      if (typeof parsed.data?.messageId === "string" && typeof parsed.data?.schoolId === "string") {
        notificationsService.markMessageRead(parsed.data.schoolId, parsed.data.messageId, client.userId).catch(() => {})
      }
      break
    case "ping":
      client.ws.send(JSON.stringify({ event: "pong" }))
      break
    case "presence:sync":
      if (typeof parsed.data?.schoolId === "string") {
        const onlineUsers = wsManager.getOnlineUsers(parsed.data.schoolId)
        client.ws.send(JSON.stringify({ event: "presence:sync", data: { users: onlineUsers } }))
      }
      break
    case "typing:start":
    case "UserTypingStarted":
      if (typeof parsed.data?.conversationId === "string" && typeof parsed.data?.displayName === "string") {
        const payload = { conversationId: parsed.data.conversationId, userId: client.userId, displayName: parsed.data.displayName, typing: true }
        wsManager.broadcastToConversationExcept(parsed.data.conversationId, "typing:indicator", payload, client.userId)
        wsManager.broadcastToConversationExcept(parsed.data.conversationId, "UserTypingStarted", payload, client.userId)
      }
      break
    case "typing:stop":
    case "UserTypingStopped":
      if (typeof parsed.data?.conversationId === "string") {
        const payload = { conversationId: parsed.data.conversationId, userId: client.userId, typing: false }
        wsManager.broadcastToConversationExcept(parsed.data.conversationId, "typing:indicator", payload, client.userId)
        wsManager.broadcastToConversationExcept(parsed.data.conversationId, "UserTypingStopped", payload, client.userId)
      }
      break
    default:
      break
  }
}

export function handleWsClose(client: WsClient) {
  wsManager.unregister(client)
}
