import { AppError } from "@/common/errors";

const BASE_URL = "https://sms.textsms.co.ke/api/services";

function getCredentials() {
    const apikey = process.env.TEXTSMS_API_KEY;
    const partnerID = process.env.TEXTSMS_PARTNER_ID;
    const shortcode = process.env.TEXTSMS_SENDER_ID;

    if (!apikey || !partnerID || !shortcode) {
        throw AppError.internal(
            "TextSMS Kenya is not configured. Set TEXTSMS_API_KEY, TEXTSMS_PARTNER_ID, and TEXTSMS_SENDER_ID in .env"
        );
    }

    return { apikey, partnerID, shortcode };
}

export interface TextSmsSendResult {
    mobile: string;
    success: boolean;
    messageId?: number;
    code?: number;
    description?: string;
}

export async function sendSingleSms(
    mobile: string,
    message: string
): Promise<TextSmsSendResult> {
    const { apikey, partnerID, shortcode } = getCredentials();

    const response = await fetch(`${BASE_URL}/sendsms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apikey,
            partnerID,
            message,
            shortcode,
            mobile,
            pass_type: "plain",
        }),
    });

    const body: any = await response.json();
    const result = body.responses?.[0];

    if (!result) {
        return { mobile, success: false, description: "No response from provider" };
    }

    return {
        mobile,
        success: result["response-code"] === 200,
        messageId: result.messageid,
        code: result["response-code"],
        description: result["response-description"],
    };
}

export async function sendBulkSms(
    recipients: { mobile: string; message: string }[]
): Promise<TextSmsSendResult[]> {
    const { apikey, partnerID, shortcode } = getCredentials();

    const smslist = recipients.map((r, i) => ({
        partnerID,
        apikey,
        pass_type: "plain",
        clientsmsid: Date.now() + i,
        mobile: r.mobile,
        message: r.message,
        shortcode,
    }));

    const response = await fetch(`${BASE_URL}/sendbulk/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: smslist.length, smslist }),
    });

    const body: any = await response.json();
    const results = (body.responses ?? []) as any[];

    return results.map((r: any) => ({
        mobile: r.mobile,
        success: r["response-code"] === 200,
        messageId: r.messageid,
        code: r["response-code"],
        description: r["response-description"],
    }));
}

export async function checkBalance(): Promise<{
    balance: string;
    raw: unknown;
}> {
    const { apikey, partnerID } = getCredentials();

    const response = await fetch(`${BASE_URL}/getbalance/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apikey, partnerID }),
    });

    const body: any = await response.json();
    return { balance: String(body), raw: body };
}

export async function getDeliveryReport(
    messageId: number
): Promise<unknown> {
    const { apikey, partnerID } = getCredentials();

    const response = await fetch(`${BASE_URL}/getdlr/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apikey, partnerID, messageID: String(messageId) }),
    });

    return response.json();
}
