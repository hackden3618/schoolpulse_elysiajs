import { t } from "elysia";
import { phoneString, emailString, nameString } from "@/common/validation";

export const createSchoolSchema = t.Object({
  schoolName: nameString(2, 200),
  schoolPhone: phoneString(true),
  schoolEmail: emailString(false),
  schoolWebsite: t.Optional(t.String({ maxLength: 500 })),
  schoolAddress: t.Optional(t.String({ maxLength: 500 })),
  schoolLogo: t.Optional(t.String({ maxLength: 500 })),
  postOffice: t.Optional(t.String({ maxLength: 100 })),
  county: nameString(2, 100),
  town: nameString(2, 100),
  country: t.Optional(t.String({ minLength: 2, maxLength: 100, default: "Kenya" })),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3, default: "KES" })),
  timezone: t.Optional(t.String({ minLength: 3, maxLength: 100, default: "Africa/Nairobi" })),
  schoolLevel: t.Optional(
    t.UnionEnum(["pre_primary", "primary", "hybrid_pri_jsecondary", "junior_secondary", "senior_secondary", "tertiary"])
  ),
});

export const updateSchoolSchema = t.Object({
  schoolName: t.Optional(t.String({ minLength: 2, maxLength: 200 })),
  schoolPhone: phoneString(false),
  schoolEmail: emailString(false),
  schoolWebsite: t.Optional(t.String({ maxLength: 500 })),
  schoolAddress: t.Optional(t.String({ maxLength: 500 })),
  schoolLogo: t.Optional(t.String({ maxLength: 500 })),
  postOffice: t.Optional(t.String({ maxLength: 100 })),
  county: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  town: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  country: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  timezone: t.Optional(t.String({ minLength: 3, maxLength: 100 })),
  schoolLevel: t.Optional(
    t.UnionEnum(["pre_primary", "primary", "hybrid_pri_jsecondary", "junior_secondary", "senior_secondary", "tertiary"])
  ),
  settings: t.Optional(t.Object({})),
});

export const updateSubscriptionSchema = t.Object({
  subscriptionPlan: t.Optional(
    t.UnionEnum(["free", "monthly", "termly", "yearly", "enterprise"])
  ),
  subscriptionStatus: t.Optional(
    t.UnionEnum(["trial", "active", "suspended", "pending_review", "defaulted", "terminated"])
  ),
  schoolTier: t.Optional(
    t.UnionEnum(["small", "medium", "large", "enterprise"])
  ),
});

export type CreateSchoolInput = typeof createSchoolSchema.static;
export type UpdateSchoolInput = typeof updateSchoolSchema.static;
export type UpdateSubscriptionInput = typeof updateSubscriptionSchema.static;
