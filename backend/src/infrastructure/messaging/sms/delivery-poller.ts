import { prisma } from "@/infrastructure/database/prisma";
import { getDeliveryReport } from "./sms.provider";
import { wsManager } from "@/infrastructure/websocket";

const POLL_INTERVAL_MS = 60_000;
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startDeliveryPoller() {
  if (intervalId) return;
  intervalId = setInterval(pollDeliveries, POLL_INTERVAL_MS);
  pollDeliveries();
}

export function stopDeliveryPoller() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function pollDeliveries() {
  try {
    const receipts = await prisma.messageReceipt.findMany({
      where: {
        status: "sent",
        channel: "sms",
        providerMessageId: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        messageId: true,
        providerMessageId: true,
      },
      take: 200,
    });

    if (receipts.length === 0) return;

    const uniqueMessageIds = [...new Set(receipts.map((r) => r.providerMessageId!).filter(Boolean))];
    const receiptByMessageId = new Map<string, typeof receipts>();
    for (const r of receipts) {
      if (!r.providerMessageId) continue;
      if (!receiptByMessageId.has(r.providerMessageId)) {
        receiptByMessageId.set(r.providerMessageId, []);
      }
      receiptByMessageId.get(r.providerMessageId)!.push(r);
    }

    const results: { messageId: string; status: string }[] = [];

    for (const providerMessageId of uniqueMessageIds) {
      try {
        const response: any = await getDeliveryReport(Number(providerMessageId));
        const dlr = response?.responses?.[0] ?? response;
        const responseCode = dlr?.["response-code"] ?? dlr?.responseCode ?? null;

        if (responseCode === 200) {
          const desc = (dlr?.["response-description"] ?? dlr?.responseDescription ?? dlr?.status ?? "").toLowerCase();
          const isDelivered = desc.includes("delivered") || desc.includes("success") || desc === "" || desc.includes("sent");
          results.push({ messageId: providerMessageId, status: isDelivered ? "delivered" : "sent" });
        } else if (responseCode === 1008) {
          continue;
        } else if (responseCode === null && dlr?.status) {
          const s = String(dlr.status).toLowerCase();
          if (s.includes("delivered") || s.includes("success")) {
            results.push({ messageId: providerMessageId, status: "delivered" });
          } else if (s.includes("failed") || s.includes("rejected")) {
            results.push({ messageId: providerMessageId, status: "failed" });
          } else {
            continue;
          }
        } else {
          results.push({ messageId: providerMessageId, status: "failed" });
        }
      } catch {
        continue;
      }
    }

    for (const { messageId: providerMsgId, status } of results) {
      const targetReceipts = receiptByMessageId.get(providerMsgId) || [];
      if (targetReceipts.length === 0) continue;

      await prisma.messageReceipt.updateMany({
        where: {
          id: { in: targetReceipts.map((r) => r.id) },
          status: "sent",
        },
        data: { status: status as any },
      });

      const messageIds = [...new Set(targetReceipts.map((r) => r.messageId))];
      for (const mid of messageIds) {
        const message = await prisma.message.findFirst({
          where: { id: mid, deletedAt: null },
          include: {
            sender: { include: { user: true } },
            receipts: true,
            recipient: true,
          },
        });
        if (message && message.conversationId) {
          wsManager.broadcastToConversation(message.conversationId, "receipt:updated", message);
        }
      }
    }
  } catch {
    // Silently handle polling errors
  }
}
