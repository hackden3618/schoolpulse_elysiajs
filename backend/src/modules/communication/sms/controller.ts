import {
  sendSms,
  listSmsTemplates,
  createSmsTemplate,
  deleteSmsTemplate,
  handleDeliveryReceipt,
  checkSmsBalance,
} from "./service";
import { success } from "@/common/responses";
import { calculateGsm7Segments } from "@/shared/utils";

export async function sendSmsController({ params: { schoolId }, body, authUser, set }: any) {
  const { recipients, message } = body;
  const result = await sendSms({ recipients, message, schoolId, authUser });
  set.status = 201;
  return success(result, schoolId);
}

export async function getSmsTemplatesController({ params: { schoolId }, set }: any) {
  const templates = await listSmsTemplates(schoolId);
  return success(templates, schoolId);
}

export async function createSmsTemplateController({ params: { schoolId }, body, set }: any) {
  const template = await createSmsTemplate(schoolId, body);
  set.status = 201;
  return success(template, schoolId);
}

export async function deleteSmsTemplateController({ params: { schoolId, templateId }, set }: any) {
  await deleteSmsTemplate(schoolId, templateId);
  return success({ deleted: true }, schoolId);
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
