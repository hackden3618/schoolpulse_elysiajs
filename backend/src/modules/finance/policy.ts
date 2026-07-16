import { AppError } from "@/common/errors"
import * as repo from "./repository"

export class FinancePolicy {
  /**
   * Validates if a fee structure can be created.
   */
  static canCreateFeeStructure(term: any) {
    if (!term) throw AppError.notFound("Term not found")
    if (!term.active) throw AppError.validation("Cannot create fee structure for an inactive term")
  }

  static canCreateFeeStructureForClass(classInstance: any) {
    if (!classInstance) throw AppError.notFound("Class not found")
  }

  static canViewGuardianInvoices(link: any) {
    if (!link) throw AppError.forbidden("You are not linked to this student")
  }

  /**
   * For guardian/parent callers, enforce that the student is linked to them
   * before allowing an M-Pesa payment. Staff roles (holding finance:report)
   * are not restricted to a single student.
   */
  static async assertGuardianOwnsStudent(schoolId: string, studentId: string, authUser: any) {
    const roles: string[] = authUser?.roles ?? []
    const isGuardian = roles.includes("Guardian") || roles.includes("Parent")
    if (!isGuardian) return
    const link = await repo.findGuardianStudentLink(schoolId, studentId, authUser.userId)
    if (!link) throw AppError.forbidden("You are not linked to this student")
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
