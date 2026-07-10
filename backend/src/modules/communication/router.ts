import { Elysia } from "elysia";
import { smsRoute } from "./sms/router";

export const communicationRoute = new Elysia()
    .use(smsRoute);
