import dotenv from "dotenv"
import { app } from "./app"
import { wsManager, handleWsOpen, handleWsMessage, handleWsClose } from "./infrastructure/websocket"
import { startDeliveryPoller } from "./infrastructure/messaging/sms/delivery-poller"
import { scheduleStkReconciler } from "./infrastructure/jobs/mpesa-stk-reconciler"
import { startEventConsumer } from "./infrastructure/events/event-consumer"
import { startScheduledMessageWorker } from "./infrastructure/jobs/scheduled-message-worker"
import { DarajaProvider } from "./infrastructure/payment/daraja.provider"

dotenv.config()

const PORT = Number(process.env.SERVERPORT || 3000)

const clients = new Map<WebSocket, ReturnType<typeof handleWsOpen>>()

startDeliveryPoller()
scheduleStkReconciler()
startEventConsumer()
startScheduledMessageWorker()

// Register the C2B Confirmation/Validation URLs with Safaricom so that
// M-Pesa Transaction Reversals (chargebacks) AND walk-in paybill payments are
// delivered to our webhooks. This is a ONE-TIME setup action on Safaricom's
// side; it is gated behind REGISTER_MPESA_C2B (off by default) so we don't
// re-register on every boot. In production, set REGISTER_MPESA_C2B=true once
// (or register via the Daraja portal). Failures are non-fatal.
if (process.env.REGISTER_MPESA_C2B === "true") {
  DarajaProvider.registerC2BUrls()
}

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
