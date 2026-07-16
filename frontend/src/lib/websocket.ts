import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "./auth-context"
import { getAccessToken, getPlatformToken } from "./api"

type WsEventHandler = (data: any) => void

interface WsSubscription {
  conversationId: string
  onMessage: WsEventHandler
  onReceiptUpdate: WsEventHandler
  onDelete?: WsEventHandler
  onMessageUpdated?: WsEventHandler
}

interface WsCallbacks {
  onTicketNew?: WsEventHandler
  onMessageNew?: WsEventHandler
  onTicketUpdated?: WsEventHandler
  onConversationCreated?: WsEventHandler
  onTyping?: WsEventHandler
  onImportProgress?: WsEventHandler
}

export function useWebSocket(
  subscriptions: WsSubscription[] = [],
  callbacks?: WsCallbacks,
  platformMode?: boolean
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { isAuthenticated } = useAuth()
  const subsRef = useRef<WsSubscription[]>(subscriptions)
  subsRef.current = subscriptions
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const connect = useCallback(() => {
    const token = platformMode ? getPlatformToken() : getAccessToken()
    if (!token) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = import.meta.env.DEV ? "localhost:3000" : window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${token}`)

    ws.onopen = () => {
      for (const sub of subsRef.current) {
        ws.send(JSON.stringify({ event: "subscribe", data: { conversationId: sub.conversationId } }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const { event: eventType, data } = JSON.parse(event.data)
        switch (eventType) {
          case "message:new":
            for (const sub of subsRef.current) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onMessage(data)
              }
            }
            break
          case "receipt:updated":
            for (const sub of subsRef.current) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onReceiptUpdate(data)
              }
            }
            break
          case "message:deleted":
            for (const sub of subsRef.current) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onDelete?.(data)
              }
            }
            break
          case "message:updated":
            for (const sub of subsRef.current) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onMessageUpdated?.(data)
              }
            }
            break
          case "support:ticket:new":
            callbacksRef.current?.onTicketNew?.(data)
            break
          case "support:message:new":
            callbacksRef.current?.onMessageNew?.(data)
            break
          case "support:ticket:updated":
            callbacksRef.current?.onTicketUpdated?.(data)
            break
          case "conversation:created":
            callbacksRef.current?.onConversationCreated?.(data)
            break
          case "typing:indicator":
            callbacksRef.current?.onTyping?.(data)
            break
          case "import:progress":
            callbacksRef.current?.onImportProgress?.(data)
            break
          default:
            break
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onclose = () => {
      reconnectTimerRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    connect()
    return () => {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isAuthenticated, connect])

  const subscribe = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "subscribe", data: { conversationId } }))
    }
  }, [])

  const markRead = useCallback((messageId: string, schoolId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "mark_read", data: { messageId, schoolId } }))
    }
  }, [])

  return { subscribe, markRead, ws: wsRef }
}
