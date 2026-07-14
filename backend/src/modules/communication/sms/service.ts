import crypto from "crypto";
import { AppError } from "@/common/errors";
import { normalizePhone } from "@/common/validation";
import { sendBulkSms, checkBalance as checkBalanceProvider } from "@/infrastructure/messaging/sms/sms.provider";
import { calculateGsm7Segments } from "@/shared/utils";
import type { Gsm7SegmentInfo } from "@/shared/utils";
import * as schoolRepo from "@/modules/schools/repository";

export interface SmsOptions {
  recipients: string[];
  message: string;
  schoolId?: string;
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

export interface SmsTemplate {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export function getSmsSettings(settings: unknown): { templates: SmsTemplate[] } {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return { templates: [] };
  }

  const smsSettings = (settings as Record<string, unknown>).sms;
  if (!smsSettings || typeof smsSettings !== "object" || Array.isArray(smsSettings)) {
    return { templates: [] };
  }

  const templates = (smsSettings as Record<string, unknown>).templates;
  if (!Array.isArray(templates)) {
    return { templates: [] };
  }

  return {
    templates: templates.filter(
      (item): item is SmsTemplate =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as any).id === "string" &&
        typeof (item as any).name === "string" &&
        typeof (item as any).message === "string" &&
        typeof (item as any).createdAt === "string" &&
        typeof (item as any).updatedAt === "string"
    ),
  };
}

export function buildSettings(settings: unknown, templates: SmsTemplate[]): Record<string, unknown> & { sms: Record<string, unknown> & { templates: SmsTemplate[] } } {
  const baseSettings = typeof settings === "object" && settings !== null && !Array.isArray(settings)
    ? { ...(settings as Record<string, unknown>) }
    : {};

  return {
    ...baseSettings,
    sms: {
      ...(baseSettings.sms && typeof baseSettings.sms === "object" ? (baseSettings.sms as Record<string, unknown>) : {}),
      templates,
    },
  };
}

async function findSchool(schoolId: string) {
  const school = await schoolRepo.findSchoolById(schoolId);
  if (!school) {
    throw AppError.notFound("School not found");
  }
  return school;
}

export async function listSmsTemplates(schoolId: string): Promise<SmsTemplate[]> {
  const school = await findSchool(schoolId);
  return getSmsSettings(school.settings).templates;
}

export async function createSmsTemplate(schoolId: string, data: { name: string; message: string }): Promise<SmsTemplate> {
  const school = await findSchool(schoolId);
  const templates = getSmsSettings(school.settings).templates;
  const now = new Date().toISOString();
  const template: SmsTemplate = {
    id: crypto.randomUUID(),
    name: data.name,
    message: data.message,
    createdAt: now,
    updatedAt: now,
  };

  await schoolRepo.updateSchool(schoolId, {
    settings: buildSettings(school.settings as unknown, [...templates, template]) as any,
  });

  return template;
}

export async function deleteSmsTemplate(schoolId: string, templateId: string): Promise<void> {
  const school = await findSchool(schoolId);
  const templates = getSmsSettings(school.settings).templates;
  const remaining = templates.filter((template) => template.id !== templateId);

  if (remaining.length === templates.length) {
    throw AppError.notFound("SMS template not found");
  }

  await schoolRepo.updateSchool(schoolId, {
    settings: buildSettings(school.settings as unknown, remaining) as any,
  });
}

export async function sendSms(options: SmsOptions): Promise<SmsSendResult> {
  const segmentInfo = calculateGsm7Segments(options.message);
  const BATCH_SIZE = 20;

  const normalized = options.recipients.map((mobile) => ({
    mobile: normalizePhone(mobile).replace(/^\+/, ""),
    message: options.message,
  }));

  const allResults: RecipientResult[] = [];

  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    const batch = normalized.slice(i, i + BATCH_SIZE);
    const providerResults = await sendBulkSms(batch);
    const batchResults: RecipientResult[] = providerResults.map((r) => ({
      mobile: r.mobile,
      success: r.success,
      messageId: r.messageId,
      ...(r.success ? {} : { error: r.description }),
    }));
    allResults.push(...batchResults);
  }

  const successful = allResults.filter((r) => r.success).length;
  const failed = allResults.length - successful;

  return {
    totalRecipients: allResults.length,
    successful,
    failed,
    segmentInfo,
    results: allResults,
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
