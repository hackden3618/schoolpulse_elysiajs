import { AppError } from "@/common/errors"

export class FinancePolicy {
  /**
   * Validates if a fee structure can be created.
   */
  static canCreateFeeStructure(term: any) {
    if (!term) throw AppError.notFound("Term not found")
    if (!term.active) throw AppError.validation("Cannot create fee structure for an inactive term")
  }

  /**
   * Validates if an invoice can be generated.
   */
  static canGenerateInvoice(student: any, feeStructure: any) {
    if (!student) throw AppError.notFound("Student not found")
    if (student.status !== "active") throw AppError.validation("Student is not active")
    if (!feeStructure) throw AppError.notFound("Fee structure not found")
  }

  /**
   * Validates if a payment can be applied to an invoice.
   */
  static canPayInvoice(invoice: any, paymentAmount: number) {
    if (!invoice) throw AppError.notFound("Invoice not found")
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      throw AppError.conflict("Invoice is already paid or cancelled")
    }
    if (paymentAmount <= 0) {
      throw AppError.validation("Payment amount must be greater than zero")
    }
    if (paymentAmount > Number(invoice.balance)) {
      throw AppError.validation(`Payment amount (${paymentAmount}) exceeds invoice balance (${invoice.balance})`)
    }
  }
}
