import { sendBulkSms, checkBalance as checkBalanceProvider } from "@/infrastructure/messaging/sms/sms.provider";
import { calculateGsm7Segments } from "@/shared/utils";
import type { Gsm7SegmentInfo } from "@/shared/utils";

export interface SmsOptions {
  recipients: string[];
  message: string;
}

export interface RecipientResult {
  mobile: string;
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface SmsSendResult {
  totalRecipients: number;
  successful: number;
  failed: number;
  segmentInfo: Gsm7SegmentInfo;
  results: RecipientResult[];
}

export async function sendSms(options: SmsOptions): Promise<SmsSendResult> {
  const segmentInfo = calculateGsm7Segments(options.message);

  const payload = options.recipients.map((mobile) => {
    let normalized = mobile.replace(/^\+/, "");
    normalized = normalized.startsWith("0") ? `254${normalized.slice(1)}` : normalized;
    return { mobile: normalized, message: options.message };
  });

  const providerResults = await sendBulkSms(payload);

  const results: RecipientResult[] = providerResults.map((r) => ({
    mobile: r.mobile,
    success: r.success,
    messageId: r.messageId,
    ...(r.success ? {} : { error: r.description }),
  }));

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  return {
    totalRecipients: results.length,
    successful,
    failed,
    segmentInfo,
    results,
  };
}

export async function checkSmsBalance(): Promise<{ balance: string }> {
  return checkBalanceProvider();
}

export async function handleDeliveryReceipt(body: unknown): Promise<{
  status: string;
  body: unknown;
}> {
  console.log("SMS delivery receipt:", body);
  return { status: "received", body };
}
