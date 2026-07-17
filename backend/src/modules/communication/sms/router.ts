import { Elysia, t } from "elysia";
import { errorHandler, authGuard } from "@/common/middleware";
import { checkPermission } from "@/common/middleware/permissionGuard";
import { API_PREFIX } from "@/shared/constants";
import {
  sendSmsController,
  deliveryReceiptController,
  checkBalanceController,
  segmentInfoController,
  getSmsTemplatesController,
  createSmsTemplateController,
  deleteSmsTemplateController,
} from "./controller";
import { sendSmsSchema, segmentInfoSchema, smsTemplateSchema } from "./schema";

export const smsRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/sms` })
  .use(errorHandler)
  .use(authGuard)
  .get("/", () => ({ message: "SMS service is running", status: "ok" }), {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "SMS service status", tags: ["Communication"] },
  })
  .guard({ beforeHandle: [checkPermission("announcement:send")] }, (app) => app
    .post("/send", sendSmsController, {
      params: t.Object({ schoolId: t.String() }),
      body: sendSmsSchema,
      detail: { summary: "Send SMS via TextSMS Kenya", tags: ["Communication"] },
    })
    .post("/templates", createSmsTemplateController, {
      params: t.Object({ schoolId: t.String() }),
      body: smsTemplateSchema,
      detail: { summary: "Create an SMS template", tags: ["Communication"] },
    })
    .delete("/templates/:templateId", deleteSmsTemplateController, {
      params: t.Object({ schoolId: t.String(), templateId: t.String() }),
      detail: { summary: "Delete an SMS template", tags: ["Communication"] },
    })
  )
  .post("/segment-info", segmentInfoController, {
    params: t.Object({ schoolId: t.String() }),
    body: segmentInfoSchema,
    detail: {
      summary: "Calculate GSM-7 segments for a message",
      tags: ["Communication"],
    },
  })
  .get("/balance", checkBalanceController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Check TextSMS Kenya account balance", tags: ["Communication"] },
  })
  .get("/templates", getSmsTemplatesController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "List SMS templates", tags: ["Communication"] },
  })
  .post("/templates", createSmsTemplateController, {
    params: t.Object({ schoolId: t.String() }),
    body: smsTemplateSchema,
    detail: { summary: "Create an SMS template", tags: ["Communication"] },
  })
  .delete("/templates/:templateId", deleteSmsTemplateController, {
    params: t.Object({ schoolId: t.String(), templateId: t.String() }),
    detail: { summary: "Delete an SMS template", tags: ["Communication"] },
  })
  .post("/delivery", deliveryReceiptController, {
    params: t.Object({ schoolId: t.String() }),
    detail: { summary: "Delivery receipt webhook", tags: ["Communication"] },
  });
