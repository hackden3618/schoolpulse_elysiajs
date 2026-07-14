import dotenv from "dotenv"
import { app } from "./app"
import { wsManager, handleWsOpen, handleWsMessage, handleWsClose } from "./infrastructure/websocket"
import { startDeliveryPoller } from "./infrastructure/messaging/sms/delivery-poller"

dotenv.config()

const PORT = Number(process.env.SERVERPORT || 3000)

const clients = new Map<WebSocket, ReturnType<typeof handleWsOpen>>()

startDeliveryPoller()

Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url)

    if (url.pathname === "/ws") {
      const auth = wsManager.authenticate(url.search)
      if (!auth) {
        return new Response("Unauthorized", { status: 401 })
      }
      const upgraded = server.upgrade(req, { data: { userId: auth.userId, schoolId: auth.schoolId, isPlatformAdmin: auth.isPlatformAdmin } } as any)
      if (upgraded) return undefined
      return new Response("WebSocket upgrade failed", { status: 400 })
    }

    return app.fetch(req)
  },
  websocket: {
    open(ws) {
      const d = ws.data as any
      const client = handleWsOpen(ws as any, d.userId, d.schoolId, d.isPlatformAdmin)
      clients.set(ws as any, client)
    },
    message(ws, message) {
      const client = clients.get(ws as any)
      if (client) handleWsMessage(client, message)
    },
    close(ws) {
      const client = clients.get(ws as any)
      if (client) {
        handleWsClose(client)
        clients.delete(ws as any)
      }
    },
  },
})

console.log("The app is currently running in http://localhost:" + PORT)
