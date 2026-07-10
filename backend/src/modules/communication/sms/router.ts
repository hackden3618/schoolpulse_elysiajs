import { Elysia, t } from "elysia";
import { errorHandler } from "@/common/middleware";
import { API_PREFIX } from "@/shared/constants";
import {
  sendSmsController,
  deliveryReceiptController,
  checkBalanceController,
  segmentInfoController,
} from "./controller";
import { sendSmsSchema, segmentInfoSchema } from "./schema";

export const smsRoute = new Elysia({ prefix: `${API_PREFIX}` })
  .use(errorHandler)
  .get("/sms", () => ({ message: "SMS service is running", status: "ok" }), {
    detail: { summary: "SMS service status", tags: ["Communication"] },
  })
  .post("/sms/send", sendSmsController, {
    body: sendSmsSchema,
    detail: { summary: "Send SMS via TextSMS Kenya", tags: ["Communication"] },
  })
  .post("/sms/segment-info", segmentInfoController, {
    body: segmentInfoSchema,
    detail: {
      summary: "Calculate GSM-7 segments for a message",
      tags: ["Communication"],
    },
  })
  .get("/sms/balance", checkBalanceController, {
    detail: { summary: "Check TextSMS Kenya account balance", tags: ["Communication"] },
  })
  .post("/sms/delivery", deliveryReceiptController, {
    detail: { summary: "Delivery receipt webhook", tags: ["Communication"] },
  });
