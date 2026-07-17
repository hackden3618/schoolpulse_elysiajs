import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from "react"
import { getAccessToken, getPlatformToken } from "./api"
import { useAuth } from "./auth-context"
import { useUnread } from "./unread-context"

export type WsEventHandler = (data: any) => void

export interface WsSubscription {
  conversationId: string
  onMessage: WsEventHandler
  onReceiptUpdate: WsEventHandler
  onDelete?: WsEventHandler
  onMessageUpdated?: WsEventHandler
}

export interface WsCallbacks {
  onTicketNew?: WsEventHandler
  onMessageNew?: WsEventHandler
  onTicketUpdated?: WsEventHandler
  onConversationCreated?: WsEventHandler
  onTyping?: WsEventHandler
  onImportProgress?: WsEventHandler
  onUnreadChanged?: WsEventHandler
}

interface WsContextType {
  subscribe: (conversationId: string) => void
  markRead: (messageId: string, schoolId: string) => void
  send: (data: unknown) => void
  registerSubscriptions: (subs: WsSubscription[]) => () => void
  registerCallbacks: (callbacks: WsCallbacks) => () => void
}

const WsContext = createContext<WsContextType>({
  subscribe: () => {},
  markRead: () => {},
  send: () => {},
  registerSubscriptions: () => () => {},
  registerCallbacks: () => () => {},
})

export function useWs() {
  return useContext(WsContext)
}

export function WsProvider({ children, platformMode, onGlobalMessageNew }: { children: ReactNode; platformMode?: boolean; onGlobalMessageNew?: WsEventHandler }) {
  const { isAuthenticated, school } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const subsRef = useRef<WsSubscription[]>([])
  const callbacksRef = useRef<WsCallbacks>({})
  const onGlobalMessageNewRef = useRef(onGlobalMessageNew)
  onGlobalMessageNewRef.current = onGlobalMessageNew

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
        const subs = subsRef.current
        const cbs = callbacksRef.current
        switch (eventType) {
          case "message:new":
            onGlobalMessageNewRef.current?.(data)
            for (const sub of subs) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onMessage(data)
              }
            }
            break
          case "receipt:updated":
            for (const sub of subs) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onReceiptUpdate(data)
              }
            }
            break
          case "message:deleted":
            for (const sub of subs) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onDelete?.(data)
              }
            }
            break
          case "message:updated":
            for (const sub of subs) {
              if (sub.conversationId === data.conversationId || data.conversationId === sub.conversationId) {
                sub.onMessageUpdated?.(data)
              }
            }
            break
          case "support:ticket:new":
            cbs.onTicketNew?.(data)
            break
          case "support:message:new":
            cbs.onMessageNew?.(data)
            break
          case "support:ticket:updated":
            cbs.onTicketUpdated?.(data)
            break
          case "conversation:created":
            cbs.onConversationCreated?.(data)
            break
          case "typing:indicator":
            cbs.onTyping?.(data)
            break
          case "import:progress":
            cbs.onImportProgress?.(data)
            break
          case "UnreadCountChanged":
            cbs.onUnreadChanged?.(data)
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
    if (!isAuthenticated) {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }
    connect()
    return () => {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isAuthenticated, school?.id, connect])

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

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const registerSubscriptions = useCallback((subs: WsSubscription[]) => {
    subsRef.current = subs
    return () => { subsRef.current = [] }
  }, [])

  const registerCallbacks = useCallback((callbacks: WsCallbacks) => {
    callbacksRef.current = callbacks
    return () => { callbacksRef.current = {} }
  }, [])

  return (
    <WsContext.Provider value={{ subscribe, markRead, send, registerSubscriptions, registerCallbacks }}>
      {children}
    </WsContext.Provider>
  )
}
