import { prisma } from "@/infrastructure/database/prisma"
import { DarajaProvider } from "@/infrastructure/payment/daraja.provider"
import * as repo from "@/modules/finance/repository"
import { resolveStkResult } from "@/modules/finance/service"

/**
 * Reconciles M-Pesa STK pushes that never called back (user ignored the
 * prompt, network drop, or Safaricom skipped the callback). Such payments
 * would otherwise stay `pending` forever.
 *
 * Policy:
 *  - Payments older than STUCK_AGE_MS (2 min) are queried via Daraja.
 *  - If Daraja returns a definitive result, we resolve it via the shared
 *    `resolveStkResult` (success/failure).
 *  - If Daraja still reports pending and the payment is older than
 *    ABANDON_AGE_MS (5 min), we mark it `failed` (timed out).
 */

const STUCK_AGE_MS = 2 * 60 * 1000
const ABANDON_AGE_MS = 5 * 60 * 1000
const POLL_INTERVAL_MS = 60 * 1000

export async function reconcileStuckStkPayments() {
  const stuck = await repo.findStuckPendingStk(STUCK_AGE_MS)
  if (stuck.length === 0) return

  for (const payment of stuck) {
    const checkoutRequestId = payment.transactionRef
    try {
      const query = await DarajaProvider.queryStkPush({ checkoutRequestId })

      // Definitive result from Safaricom → resolve it.
      if (typeof query.resultCode === "number") {
        await resolveStkResult(checkoutRequestId, {
          resultCode: query.resultCode,
          resultDesc: query.resultDesc,
          merchantRequestId: query.merchantRequestId,
          source: "reconciler",
          raw: query,
        })
        continue
      }

      // Still pending → abandon if old enough.
      const ageMs = Date.now() - new Date(payment.receivedAt).getTime()
      if (ageMs >= ABANDON_AGE_MS) {
        await prisma.$transaction(async (tx: any) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "failed",
              metadata: {
                ...(payment.metadata as object),
                resultCode: "timeout",
                resultDesc: "STK push timed out (no callback received)",
                reconciledAt: new Date().toISOString(),
              } as any,
            },
          })
          await tx.financialAuditLog.create({
            data: {
              schoolId: payment.schoolId,
              paymentId: payment.id,
              studentId: payment.studentId,
              actionDescription: "M-Pesa STK push timed out (no callback received)",
              metadata: { reason: "timeout", source: "reconciler" },
            },
          })
        })
        console.warn(`[STKReconciler] Marked timed-out payment ${payment.id} as failed.`)
      }
    } catch (error: any) {
      // Transient gateway error → leave for the next poll.
      console.error(`[STKReconciler] Error reconciling ${payment.id}:`, error?.message || error)
    }
  }
}

export function scheduleStkReconciler() {
  reconcileStuckStkPayments().catch(console.error)
  setInterval(() => {
    reconcileStuckStkPayments().catch(console.error)
  }, POLL_INTERVAL_MS)
  console.log(`[STKReconciler] Scheduled every ${POLL_INTERVAL_MS / 1000}s.`)
}
