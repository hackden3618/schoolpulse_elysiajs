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

export type CreateFeeStructureInput = typeof createFeeStructureSchema.static
export type GenerateInvoiceInput = typeof generateInvoiceSchema.static
export type RecordPaymentInput = typeof recordPaymentSchema.static
export type ReversePaymentInput = typeof reversePaymentSchema.static
