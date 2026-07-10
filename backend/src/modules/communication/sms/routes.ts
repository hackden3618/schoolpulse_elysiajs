import { Elysia } from "elysia";
import { sendSmsController, deliveryReceiptController } from "./controller";

const app = new Elysia();

export const smsRoute = app;

// Health check / placeholder
app.get("/sms", "hi, you are at the sms route");

// Send SMS
app.post("/sms", sendSmsController);

// Delivery receipt webhook
app.post("/delivery", deliveryReceiptController);

// Incoming message webhook (commented out until needed)
// app.post("/inbox", inboxController);
