import { sendSms, handleDeliveryReceipt } from "./service";

export async function sendSmsController({ body, set }: any) {
    try {
        const { recipients, message } = body;
        const result = await sendSms({ recipients, message });
        set.status = 201;
        return result;
    } catch (error: any) {
        console.error("SMS error:", error);
        set.status = 500;
        return { error: "Failed to send SMS" };
    }
}

export async function deliveryReceiptController({ body, set }: any) {
    set.status = 201;
    console.log("message delivery", body);
    return handleDeliveryReceipt(body);
}

// TODO: Implement inbox controller when inbox feature is needed
// export async function inboxController({ body, set }: any) { ... }
