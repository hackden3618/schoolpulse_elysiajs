import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import { checkPermission, checkPermissionOrGuardianOfStudent } from "@/common/middleware/permissionGuard"
import {
  getFeeStructuresController,
  createFeeStructureController,
  generateInvoiceController,
  generateBulkInvoicesController,
  getInvoicesController,
  getInvoiceController,
  getGuardianInvoicesController,
  recordPaymentController,
  getPaymentsController,
  initiateMpesaPaymentController,
  initiateBulkMpesaPaymentController,
  mpesaCallbackController,
} from "./controller"
import {
  createFeeStructureSchema,
  generateInvoiceSchema,
  generateBulkInvoicesSchema,
  recordPaymentSchema,
  initiateMpesaPaymentSchema,
  initiateBulkMpesaPaymentSchema,
  mpesaCallbackSchema,
} from "./schema"

export const mpesaWebhookRoute = new Elysia({ prefix: `/mpesa` })
  .use(errorHandler)
  .post("/callback", mpesaCallbackController, {
    body: mpesaCallbackSchema,
    detail: { summary: "M-Pesa Webhook Callback", tags: ["Finance", "Webhooks"] },
  })

export const financeRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/finance` })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("finance:report")] }, (app) => app
    .get("/fee-structures", getFeeStructuresController, {
      params: t.Object({ schoolId: t.String() }),
      detail: { summary: "List fee structures", tags: ["Finance"] },
    })
    .get("/invoices", getInvoicesController, {
      params: t.Object({ schoolId: t.String() }),
      query: t.Object({ studentId: t.Optional(t.String()) }),
      detail: { summary: "List invoices", tags: ["Finance"] },
    })
    .get("/invoices/:invoiceId", getInvoiceController, {
      params: t.Object({ schoolId: t.String(), invoiceId: t.String() }),
      detail: { summary: "Get invoice details", tags: ["Finance"] },
    })
    .get("/payments", getPaymentsController, {
      params: t.Object({ schoolId: t.String() }),
      query: t.Object({ studentId: t.Optional(t.String()) }),
      detail: { summary: "List payments", tags: ["Finance"] },
    })
  )
  .guard({ beforeHandle: [checkPermissionOrGuardianOfStudent("finance:guardian_view")] }, (app) => app
    .get("/invoices/guardian/:studentId", getGuardianInvoicesController, {
      params: t.Object({ schoolId: t.String(), studentId: t.String() }),
      detail: { summary: "List a guardian's linked student invoices", tags: ["Finance", "Guardian"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("fee-structure:write")] }, (app) => app
    .post("/fee-structures", createFeeStructureController, {
      params: t.Object({ schoolId: t.String() }),
      body: createFeeStructureSchema,
      detail: { summary: "Create fee structure with items", tags: ["Finance"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("invoice:generate")] }, (app) => app
    .post("/invoices", generateInvoiceController, {
      params: t.Object({ schoolId: t.String() }),
      body: generateInvoiceSchema,
      detail: { summary: "Generate invoice for student", tags: ["Finance"] },
    })
    .post("/invoices/bulk", generateBulkInvoicesController, {
      params: t.Object({ schoolId: t.String() }),
      body: generateBulkInvoicesSchema,
      detail: { summary: "Generate invoices for all students in a class", tags: ["Finance"] },
    })
  )
  .guard({ beforeHandle: [checkPermission("payment:record")] }, (app) => app
    .post("/payments", recordPaymentController, {
      params: t.Object({ schoolId: t.String() }),
      body: recordPaymentSchema,
      detail: { summary: "Record payment", tags: ["Finance"] },
    })
    .post("/mpesa/stk-push", initiateMpesaPaymentController, {
      params: t.Object({ schoolId: t.String() }),
      body: initiateMpesaPaymentSchema,
      detail: { summary: "Initiate STK Push (Single Invoice)", tags: ["Finance", "Daraja"] },
    })
    .post("/mpesa/bulk-stk-push", initiateBulkMpesaPaymentController, {
      params: t.Object({ schoolId: t.String() }),
      body: initiateBulkMpesaPaymentSchema,
      detail: { summary: "Initiate STK Push (Bulk Invoices)", tags: ["Finance", "Daraja"] },
    })
  )
