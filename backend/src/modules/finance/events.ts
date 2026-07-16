import { writeEventOutbox } from "@/infrastructure/events"

export class FinanceEvents {
  static async invoiceGenerated(schoolId: string, invoiceId: string, payload: any) {
    await writeEventOutbox({
      schoolId,
      aggregateId: invoiceId,
      aggregateType: "invoice",
      eventType: "InvoiceGenerated",
      payload,
    })
  }

  static async paymentReceived(schoolId: string, paymentId: string, payload: any) {
    await writeEventOutbox({
      schoolId,
      aggregateId: paymentId,
      aggregateType: "payment",
      eventType: "PaymentReceived",
      payload,
    })
  }

  static async paymentReversed(schoolId: string, paymentId: string, payload: any) {
    await writeEventOutbox({
      schoolId,
      aggregateId: paymentId,
      aggregateType: "payment",
      eventType: "PaymentReversed",
      payload,
    })
  }
}
