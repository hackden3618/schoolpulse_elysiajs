import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler } from "@/common/middleware"
import {
  getFeeStructuresController,
  createFeeStructureController,
  generateInvoiceController,
  getInvoicesController,
  getInvoiceController,
  recordPaymentController,
  getPaymentsController,
  initiateMpesaPaymentController,
  mpesaCallbackController,
} from "./controller"
import {
  createFeeStructureSchema,
  generateInvoiceSchema,
  recordPaymentSchema,
  initiateMpesaPaymentSchema,
  mpesaCallbackSchema,
} from "./schema"

// Callback Route (Public, no schoolId prefix required by Safaricom, but we can put it anywhere if we extract schoolId, 
// wait, the callback URL in Daraja doesn't easily support dynamic paths if we register a static one, but we pass CallBackURL dynamically per request!)
export const mpesaWebhookRoute = new Elysia({ prefix: `/mpesa` })
  .use(errorHandler)
  .post("/callback", mpesaCallbackController, {
    body: mpesaCallbackSchema,
    detail: { summary: "M-Pesa Webhook Callback", tags: ["Finance", "Webhooks"] },
  })

export const financeRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/finance` })
  .use(errorHandler)
  .get("/fee-structures", getFeeStructuresController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List fee structures", tags: ["Finance"] },
  })
  .post("/fee-structures", createFeeStructureController, {
    params: t.Object({ schoolId: t.String() }),
    body: createFeeStructureSchema,
    detail: { summary: "Create fee structure with items", tags: ["Finance"] },
  })
  .post("/invoices", generateInvoiceController, {
    params: t.Object({ schoolId: t.String() }),
    body: generateInvoiceSchema,
    detail: { summary: "Generate invoice for student", tags: ["Finance"] },
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
  .post("/payments", recordPaymentController, {
    params: t.Object({ schoolId: t.String() }),
    body: recordPaymentSchema,
    detail: { summary: "Record payment", tags: ["Finance"] },
  })
  .get("/payments", getPaymentsController, {
    params: t.Object({ schoolId: t.String() }),
    query: t.Object({ studentId: t.Optional(t.String()) }),
    detail: { summary: "List payments", tags: ["Finance"] },
  })
  .post("/mpesa/stk-push", initiateMpesaPaymentController, {
    params: t.Object({ schoolId: t.String() }),
    body: initiateMpesaPaymentSchema,
    detail: { summary: "Initiate M-Pesa STK Push", tags: ["Finance"] },
  })
