import { Elysia } from "elysia";
import { smsRoute } from "./sms/routes";

export const communicationRoute = new Elysia()
    .use(smsRoute);
