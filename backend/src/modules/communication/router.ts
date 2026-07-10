import { Elysia } from "elysia";
import { errorHandler } from "@/common/middleware";
import { smsRoute } from "./sms/router";

export const communicationRoute = new Elysia()
  .use(errorHandler)
  .use(smsRoute);
