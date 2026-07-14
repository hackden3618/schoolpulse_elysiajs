import { t } from "elysia";

export const phonePattern = "^\\+?[0-9]{10,13}$";

export const phoneString = (required: boolean = true) =>
  required
    ? t.String({ minLength: 10, maxLength: 13, pattern: phonePattern })
    : t.Optional(t.String({ minLength: 10, maxLength: 13, pattern: phonePattern }));

/** Known phone field names that should be normalized automatically. */
const PHONE_FIELDS = new Set(["phone", "phoneNumber", "schoolPhone", "mobile"])

/**
 * Normalise a Kenyan phone number to E.164 format (e.g. "0712345678" → "+254712345678").
 * Strips whitespace, hyphens, and parentheses first.
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "")
  if (cleaned.startsWith("+")) return cleaned.slice(1)
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1)
  if (cleaned.startsWith("254")) return cleaned
  return cleaned
}

/**
 * Recursively walk a value and normalise any known phone fields in place.
 * Handles plain objects, arrays, and nested structures.
 */
export function applyPhoneNormalization<T>(data: T): T {
  if (!data || typeof data !== "object") return data
  if (Array.isArray(data)) {
    for (const item of data) applyPhoneNormalization(item)
    return data
  }
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (PHONE_FIELDS.has(key) && typeof value === "string") {
      (data as Record<string, unknown>)[key] = normalizePhone(value) as T
    } else if (typeof value === "object" && value !== null) {
      applyPhoneNormalization(value)
    }
  }
  return data
}

export const emailString = (required: boolean = true) =>
  required
    ? t.String({ format: "email", maxLength: 255 })
    : t.Optional(t.String({ format: "email", maxLength: 255 }));

export const nameString = (min: number = 1, max: number = 100, required: boolean = true) =>
  required
    ? t.String({ minLength: min, maxLength: max })
    : t.Optional(t.String({ minLength: min, maxLength: max }));

export const uuidString = (required: boolean = true) =>
  required
    ? t.String({ format: "uuid" })
    : t.Optional(t.String({ format: "uuid" }));

export const dateString = (required: boolean = true) =>
  required
    ? t.String({ format: "date" })
    : t.Optional(t.String({ format: "date" }));

export const paginationQuery = t.Object({
  page: t.Optional(t.String()),
  pageSize: t.Optional(t.String()),
  search: t.Optional(t.String()),
  sort: t.Optional(t.String()),
  filter: t.Optional(t.String()),
});

export const uuidParam = t.String({ format: "uuid" });

export const schoolIdParam = t.Object({
  schoolId: uuidParam,
});

export const emptyObject = t.Object({});
