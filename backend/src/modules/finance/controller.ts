import { success } from "@/common/responses"
import * as svc from "./service"

export async function getFeeStructuresController({ params: { schoolId }, set }: any) {
  const result = await svc.listFeeStructures(schoolId)
  return success(result, schoolId)
}

export async function createFeeStructureController({ params: { schoolId }, body, set }: any) {
  set.status = 201
  const result = await svc.createFeeStructure(schoolId, body)
  return success(result, schoolId)
}

export async function generateInvoiceController({ params: { schoolId }, body, set }: any) {
  set.status = 201
  const result = await svc.generateInvoice(schoolId, body)
  return success(result, schoolId)
}

export async function generateBulkInvoicesController({ params: { schoolId }, body, set }: any) {
  set.status = 201
  const result = await svc.generateBulkInvoices(schoolId, body)
  return success(result, schoolId)
}

export async function getInvoicesController({ params: { schoolId }, query: { studentId }, set }: any) {
  const result = await svc.listInvoices(schoolId, studentId)
  return success(result, schoolId)
}

export async function getInvoiceController({ params: { schoolId, invoiceId }, set }: any) {
  const result = await svc.getInvoice(schoolId, invoiceId)
  return success(result, schoolId)
}

export async function getGuardianInvoicesController({ params: { schoolId, studentId }, authUser, set }: any) {
  const result = await svc.listGuardianInvoices(schoolId, studentId, authUser.userId)
  return success(result, schoolId)
}

export async function recordPaymentController({ params: { schoolId }, body, authUser, set }: any) {
  set.status = 201
  const result = await svc.recordPayment(schoolId, authUser, body)
  return success(result, schoolId)
}

export async function getPaymentsController({ params: { schoolId }, query: { studentId }, set }: any) {
  const result = await svc.listPayments(schoolId, studentId)
  return success(result, schoolId)
}

export async function initiateMpesaPaymentController({ params: { schoolId }, body, authUser, set }: any) {
  set.status = 201
  const result = await svc.initiateMpesaPayment(schoolId, body, authUser)
  return success(result, schoolId)
}

export async function initiateBulkMpesaPaymentController({ params: { schoolId }, body, authUser, set }: any) {
  set.status = 201
  const result = await svc.initiateBulkMpesaPayment(schoolId, body, authUser)
  return success(result, schoolId)
}

export async function mpesaCallbackController({ body, set }: any) {
  // Webhook from Safaricom. Always return 200 OK to acknowledge receipt.
  try {
    await svc.processMpesaCallback(body)
  } catch (error) {
    console.error("[FinanceController] Error processing M-Pesa Callback:", error)
  }
  set.status = 200
  return { ResultCode: 0, ResultDesc: "Success" }
}

export async function mpesaReversalController({ body, set }: any) {
  // Safaricom transaction reversal webhook (chargeback / timeout). Always
  // acknowledge with 200 so Safaricom stops retrying the delivery.
  try {
    await svc.processMpesaReversal(body)
  } catch (error) {
    console.error("[FinanceController] Error processing M-Pesa Reversal:", error)
  }
  set.status = 200
  return { ResultCode: 0, ResultDesc: "Success" }
}
