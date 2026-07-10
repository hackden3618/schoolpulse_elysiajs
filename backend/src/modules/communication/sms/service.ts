import { sms } from "@/infrastructure/sms/sms.provider";

export interface SmsOptions {
    recipients: string[];
    message: string;
}

export async function sendSms(options: SmsOptions) {
    const smsOptions = {
        to: options.recipients,
        message: options.message,
        // from: "SchoolPulse"
    };

    try {
        const response = await sms.send(smsOptions);
        const recipients = response.SMSMessageData.Recipients;
        const recipientNo = recipients[0].number;
        console.log("message sent successfully ", response.SMSMessageData, recipientNo);
        return {
            message: "message sent successfully",
            body: response
        };
    } catch (error: any) {
        console.log("message failed to send ", error);
        const { phoneNumber, failureReason, id, status } = error;
        return {
            phoneNumber,
            status,
        };
    }
}

export async function handleDeliveryReceipt(body: any) {
    return {
        status: "delivered",
        message: "Message delivered successfully",
        body
    };
}

// TODO: Implement inbox handler when needed
// export async function handleIncomingMessage(body: any) { ... }
