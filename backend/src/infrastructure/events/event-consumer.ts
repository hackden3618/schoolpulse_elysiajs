import { prisma } from "@/infrastructure/database/prisma"
import { wsManager } from "@/infrastructure/websocket"

const POLL_INTERVAL = 5_000
const MAX_RETRIES = 3
const RETRY_BACKOFF_MS = 30_000

let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startEventConsumer() {
  if (intervalHandle) return
  intervalHandle = setInterval(pollEvents, POLL_INTERVAL)
}

export function stopEventConsumer() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

async function pollEvents() {
  try {
    const now = new Date()
    const events = await prisma.eventOutbox.findMany({
      where: {
        status: "pending",
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    })

    for (const event of events) {
      await processEvent(event)
    }
  } catch (err) {
    console.error("[EventConsumer] poll error:", err)
  }
}

async function processEvent(event: any) {
  try {
    await prisma.eventOutbox.update({
      where: { id: event.id },
      data: { status: "processing" },
    })

    switch (event.eventType) {
      case "ConversationCreated":
        wsManager.broadcastToSchool(event.schoolId, "conversation:created", event.payload)
        break

      case "MessageSent":
        wsManager.broadcastToConversation(event.payload?.conversationId, "message:new", event.payload)
        break

      case "PaymentReceived":
        wsManager.broadcastToSchool(event.schoolId, "payment:received", event.payload)
        break

      case "PaymentReversed":
        wsManager.broadcastToSchool(event.schoolId, "payment:reversed", event.payload)
        break

      case "AssessmentPublished":
        wsManager.broadcastToSchool(event.schoolId, "assessment:published", event.payload)
        break

      case "StudentAdmitted":
        wsManager.broadcastToSchool(event.schoolId, "student:admitted", event.payload)
        break

      case "StudentArchived":
        wsManager.broadcastToSchool(event.schoolId, "student:archived", event.payload)
        break

      case "StudentTransferred":
        wsManager.broadcastToSchool(event.schoolId, "student:transferred", event.payload)
        break

      case "GuardianAdded":
      case "GuardianRemoved":
        wsManager.broadcastToSchool(event.schoolId, `guardian:${event.eventType === "GuardianAdded" ? "linked" : "unlinked"}`, event.payload)
        break

      case "RoleAssigned":
        wsManager.broadcastToSchool(event.schoolId, "membership:roles_changed", event.payload)
        break

      case "JoinRequestApproved":
      case "SchoolCreated":
      case "SchoolDeleted":
      case "InvoiceGenerated":
      case "UserCreated":
      case "MembershipCreated":
        // Platform/operational events: no real-time school broadcast required.
        break

      default:
        console.warn(`[EventConsumer] no handler for event type "${event.eventType}" (id ${event.id})`)
        break
    }

    await prisma.eventOutbox.update({
      where: { id: event.id },
      data: {
        status: "processed",
        processedAt: new Date(),
      },
    })
  } catch (err: any) {
    const retryCount = event.retryCount + 1
    const isDead = retryCount >= MAX_RETRIES

    await prisma.eventOutbox.update({
      where: { id: event.id },
      data: {
        status: isDead ? "dead_letter" : "pending",
        retryCount,
        experiencedError: true,
        errorMessage: err.message ?? "Unknown error",
        nextAttemptAt: isDead ? undefined : new Date(Date.now() + RETRY_BACKOFF_MS),
      },
    })

    if (isDead) {
      console.error(`[EventConsumer] event ${event.id} moved to dead_letter after ${MAX_RETRIES} retries`)
    }
  }
}
