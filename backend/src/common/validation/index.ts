import { t } from "elysia";

export const phonePattern = "^\\+?[0-9]{10,13}$";

export const phoneString = (required: boolean = true) =>
  required
    ? t.String({ minLength: 10, maxLength: 13, pattern: phonePattern })
    : t.Optional(t.String({ minLength: 10, maxLength: 13, pattern: phonePattern }));

export function normalizePhone(phone: string): string {
  if (phone.startsWith("0")) {
    return "+254" + phone.slice(1)
  }
  if (phone.startsWith("254") && !phone.startsWith("+")) {
    return "+" + phone
  }
  return phone
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
