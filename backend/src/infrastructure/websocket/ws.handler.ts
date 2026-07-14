import { wsManager } from "./ws.manager"
import type { WsClient } from "./ws.types"
import * as notificationsService from "@/modules/notifications/service"

interface WsMessage {
  event: string
  data?: Record<string, unknown>
}

export function handleWsOpen(ws: WebSocket, userId: string, schoolId: string): WsClient {
  return wsManager.register(ws, userId, schoolId)
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
    default:
      break
  }
}

export function handleWsClose(client: WsClient) {
  wsManager.unregister(client)
}
