import { verifyToken } from "@/shared/jwt"
import type { JwtPayload } from "@/shared/jwt"
import type { WsClient } from "./ws.types"

class WsManager {
  private connections = new Map<string, Set<WsClient>>()
  private conversationSubs = new Map<string, Set<WsClient>>()

  authenticate(url: string): { userId: string; schoolId: string } | null {
    const params = new URLSearchParams(url.includes("?") ? url.split("?")[1] ?? "" : "")
    const token = params.get("token")
    if (!token) return null
    try {
      const payload: JwtPayload = verifyToken(token)
      return { userId: payload.sub, schoolId: payload.schoolId }
    } catch {
      return null
    }
  }

  register(ws: WebSocket, userId: string, schoolId: string): WsClient {
    const client: WsClient = { ws, userId, schoolId, subscribedConversations: new Set() }
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(client)
    return client
  }

  unregister(client: WsClient) {
    const userConns = this.connections.get(client.userId)
    if (userConns) {
      userConns.delete(client)
      if (userConns.size === 0) this.connections.delete(client.userId)
    }
    for (const [convId, subs] of this.conversationSubs) {
      subs.delete(client)
      if (subs.size === 0) this.conversationSubs.delete(convId)
    }
  }

  subscribe(client: WsClient, conversationId: string) {
    client.subscribedConversations.add(conversationId)
    if (!this.conversationSubs.has(conversationId)) {
      this.conversationSubs.set(conversationId, new Set())
    }
    this.conversationSubs.get(conversationId)!.add(client)
  }

  unsubscribe(client: WsClient, conversationId: string) {
    client.subscribedConversations.delete(conversationId)
    this.conversationSubs.get(conversationId)?.delete(client)
  }

  broadcastToConversation(conversationId: string, event: string, data: unknown) {
    const subs = this.conversationSubs.get(conversationId)
    if (!subs) return
    const message = JSON.stringify({ event, data })
    for (const client of subs) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    }
  }

  broadcastToUser(userId: string, event: string, data: unknown) {
    const userConns = this.connections.get(userId)
    if (!userConns) return
    const message = JSON.stringify({ event, data })
    for (const client of userConns) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    }
  }

  broadcastToSchool(schoolId: string, event: string, data: unknown) {
    const message = JSON.stringify({ event, data })
    for (const [, clients] of this.connections) {
      for (const client of clients) {
        if (client.schoolId === schoolId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message)
        }
      }
    }
  }
}

export const wsManager = new WsManager()
