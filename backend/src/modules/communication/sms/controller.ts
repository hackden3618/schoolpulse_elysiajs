import { sendSms, checkSmsBalance, handleDeliveryReceipt } from "./service";
import { success } from "@/common/responses";
import { calculateGsm7Segments } from "@/shared/utils";

export async function sendSmsController({ body, set }: any) {
  const { recipients, message } = body;
  const result = await sendSms({ recipients, message });
  set.status = 201;
  return success(result, body.schoolId);
}

export async function deliveryReceiptController({ body, set }: any) {
  const result = await handleDeliveryReceipt(body);
  return success(result);
}

export async function checkBalanceController({ set }: any) {
  const result = await checkSmsBalance();
  return success(result);
}

export async function segmentInfoController({ body, set }: any) {
  const info = calculateGsm7Segments(body.message);
  return success(info);
}
