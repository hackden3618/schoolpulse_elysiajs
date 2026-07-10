import { t } from "elysia";

export const sendSmsSchema = t.Object({
  recipients: t.Array(
    t.String({ minLength: 10, maxLength: 13, pattern: "^\\+?[0-9]{10,13}$" }),
    { minItems: 1, maxItems: 20 }
  ),
  message: t.String({ minLength: 1, maxLength: 1530 }),
  schoolId: t.Optional(t.String({ format: "uuid" })),
});

export const smsResponseSchema = t.Object({
  totalRecipients: t.Number(),
  successful: t.Number(),
  failed: t.Number(),
  segmentInfo: t.Object({
    characterCount: t.Number(),
    segmentCount: t.Number(),
    perSegmentMax: t.Number(),
    remaining: t.Number(),
  }),
  results: t.Array(
    t.Object({
      mobile: t.String(),
      success: t.Boolean(),
      messageId: t.Optional(t.Number()),
      error: t.Optional(t.String()),
    })
  ),
});

export const segmentInfoSchema = t.Object({
  message: t.String({ minLength: 1, maxLength: 1530 }),
});

export const segmentInfoResponseSchema = t.Object({
  characterCount: t.Number(),
  segmentCount: t.Number(),
  perSegmentMax: t.Number(),
  remaining: t.Number(),
});

export type SendSmsInput = typeof sendSmsSchema.static;
