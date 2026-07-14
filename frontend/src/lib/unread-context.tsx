import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface UnreadContextType {
  unreadCount: number
  increment: (n?: number) => void
  decrement: (n?: number) => void
  reset: () => void
}

const UnreadContext = createContext<UnreadContextType>({
  unreadCount: 0,
  increment: () => {},
  decrement: () => {},
  reset: () => {},
})

export function UnreadProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)

  const increment = useCallback((n = 1) => setUnreadCount((c) => c + n), [])
  const decrement = useCallback((n = 1) => setUnreadCount((c) => Math.max(0, c - n)), [])
  const reset = useCallback(() => setUnreadCount(0), [])

  return (
    <UnreadContext.Provider value={{ unreadCount, increment, decrement, reset }}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnread() {
  return useContext(UnreadContext)
}
