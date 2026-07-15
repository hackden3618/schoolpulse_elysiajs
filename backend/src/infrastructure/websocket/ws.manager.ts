import { verifyToken } from "@/shared/jwt"
import type { JwtPayload } from "@/shared/jwt"
import type { WsClient } from "./ws.types"

class WsManager {
    private connections = new Map<string, Set<WsClient>>()
    private conversationSubs = new Map<string, Set<WsClient>>()
    private adminConnections = new Set<WsClient>()

    authenticate(urlOrSearch: string): { userId: string; schoolId: string; isPlatformAdmin: boolean } | null {
        const params = new URLSearchParams(urlOrSearch.includes("?") ? urlOrSearch.split("?")[1] ?? "" : urlOrSearch)
        const token = params.get("token")
        if (!token) return null
        try {
            const payload: any = verifyToken(token)
            if (payload.type === "platform") {
                return { userId: payload.sub, schoolId: "", isPlatformAdmin: true }
            }
            return { userId: payload.sub, schoolId: payload.schoolId, isPlatformAdmin: false }
        } catch {
            return null
        }
    }

    register(ws: WebSocket, userId: string, schoolId: string, isPlatformAdmin: boolean): WsClient {
        const client: WsClient = { ws, userId, schoolId, isPlatformAdmin, subscribedConversations: new Set() }
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set())
        }
        this.connections.get(userId)!.add(client)
        if (isPlatformAdmin) {
            this.adminConnections.add(client)
        }
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
        this.adminConnections.delete(client)
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

    broadcastToConversationExcept(conversationId: string, event: string, data: unknown, excludeUserId: string) {
        const subs = this.conversationSubs.get(conversationId)
        if (!subs) return
        const message = JSON.stringify({ event, data })
        for (const client of subs) {
            if (client.userId !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
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

    broadcastToAdmins(event: string, data: unknown) {
        const message = JSON.stringify({ event, data })
        for (const client of this.adminConnections) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message)
            }
        }
    }
}

export const wsManager = new WsManager()
