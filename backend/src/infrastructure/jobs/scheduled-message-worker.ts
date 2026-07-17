import { prisma } from "@/infrastructure/database/prisma"
import { sendSms } from "@/modules/communication/sms/service"

const MAX_BATCH = 100

export function startScheduledMessageWorker() {
  Bun.cron("* * * * *", async () => {
    try {
      const now = new Date()

      const messages = await prisma.message.findMany({
        where: {
          scheduledAt: { lte: now },
          sentAt: null,
          deletedAt: null,
        },
        include: {
          conversation: {
            select: { type: true },
          },
          receipts: {
            where: { status: "pending" },
          },
        },
        take: MAX_BATCH,
      })

      for (const message of messages) {
        try {
          if (message.channel === "sms") {
            const phoneNumbers: string[] = []
            for (const receipt of message.receipts) {
              if (receipt.recipientUserId) {
                const user = await prisma.user.findUnique({
                  where: { id: receipt.recipientUserId },
                  select: { phone: true },
                })
                if (user?.phone) phoneNumbers.push(user.phone)
              }
            }

            if (phoneNumbers.length > 0) {
              const result = await sendSms({
                recipients: phoneNumbers,
                message: message.content,
                schoolId: message.schoolId,
              })

              await prisma.messageReceipt.updateMany({
                where: { messageId: message.id },
                data: { status: "sent" },
              })
            }
          }

          await prisma.message.update({
            where: { id: message.id },
            data: { sentAt: now },
          })
        } catch (err) {
          console.error(`[ScheduledMessageWorker] failed to send message ${message.id}:`, err)
        }
      }
    } catch (err) {
      console.error("[ScheduledMessageWorker] poll error:", err)
    }
  })
}
