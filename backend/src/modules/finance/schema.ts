import { t } from "elysia"
import { nameString, uuidString } from "@/common/validation"

export const createFeeStructureSchema = t.Object({
  academicYearId: uuidString(true),
  termId: uuidString(true),
  classId: t.Optional(uuidString(false)),
  isGlobal: t.Optional(t.Boolean()),
  items: t.Array(t.Object({
    name: nameString(1, 200),
    amount: t.Number({ minimum: 0 }),
    optional: t.Optional(t.Boolean()),
    description: t.Optional(t.String({ maxLength: 500 })),
  })),
})

export const generateInvoiceSchema = t.Object({
  studentId: uuidString(true),
  enrollmentId: t.Optional(uuidString(false)),
  feeStructureId: uuidString(true),
  termId: uuidString(true),
})

export const recordPaymentSchema = t.Object({
  studentId: uuidString(true),
  invoiceId: uuidString(true),
  amount: t.Number({ minimum: 1 }),
  method: t.UnionEnum(["mpesa_stk", "mpesa_c2b", "bank_transfer", "bursary", "cash", "adjustment", "credit"]),
  transactionRef: t.String({ minLength: 1, maxLength: 200 }),
  payerId: t.Optional(uuidString(false)),
})

export const reversePaymentSchema = t.Object({
  reason: t.String({ minLength: 1, maxLength: 500 }),
})

export const initiateMpesaPaymentSchema = t.Object({
  invoiceId: uuidString(true),
  phoneNumber: t.String({ minLength: 9, maxLength: 15 }),
  amount: t.Number({ minimum: 1 }),
})

export const initiateBulkMpesaPaymentSchema = t.Object({
  studentId: uuidString(true),
  allocations: t.Array(t.Object({
    invoiceId: t.Optional(uuidString(false)),
    amount: t.Number({ minimum: 1 }),
  }), { minItems: 1 }),
  phoneNumber: t.String({ minLength: 9, maxLength: 15 }),
  totalAmount: t.Number({ minimum: 1 }),
})

export const mpesaCallbackSchema = t.Object({
  Body: t.Object({
    stkCallback: t.Object({
      MerchantRequestID: t.String(),
      CheckoutRequestID: t.String(),
      ResultCode: t.Number(),
      ResultDesc: t.String(),
      CallbackMetadata: t.Optional(
        t.Object({
          Item: t.Array(
            t.Object({
              Name: t.String(),
              Value: t.Any(),
            })
          ),
        })
      ),
    }),
  }),
})

export const generateBulkInvoicesSchema = t.Object({
  classId: uuidString(true),
  termId: uuidString(true),
  feeStructureId: uuidString(true),
})

export type CreateFeeStructureInput = typeof createFeeStructureSchema.static
export type GenerateInvoiceInput = typeof generateInvoiceSchema.static
export type GenerateBulkInvoicesInput = typeof generateBulkInvoicesSchema.static
export type RecordPaymentInput = typeof recordPaymentSchema.static
export type ReversePaymentInput = typeof reversePaymentSchema.static
export type InitiateMpesaPaymentInput = typeof initiateMpesaPaymentSchema.static
export type InitiateBulkMpesaPaymentInput = typeof initiateBulkMpesaPaymentSchema.static
export type MpesaCallbackInput = typeof mpesaCallbackSchema.static
