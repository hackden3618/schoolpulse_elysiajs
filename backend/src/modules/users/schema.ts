import { t } from "elysia";
import { phoneString, emailString, nameString, uuidString } from "@/common/validation";

export const createUserSchema = t.Object({
  firstName: nameString(1, 100),
  secondName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  lastName: nameString(1, 100),
  phone: phoneString(true),
  email: emailString(false),
  password: t.Optional(t.String({ minLength: 6, maxLength: 128 })),
});

export const updateUserSchema = t.Object({
  firstName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  secondName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  lastName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  phone: phoneString(false),
  email: emailString(false),
  status: t.Optional(t.UnionEnum(["active", "inactive", "archived"])),
});

export const createMembershipSchema = t.Object({
  userId: uuidString(true),
  roleIds: t.Optional(t.Array(uuidString(true))),
});

export const updateMembershipSchema = t.Object({
  status: t.Optional(
    t.UnionEnum(["active", "on_leave", "suspended", "resigned", "terminated"])
  ),
});

export const assignRolesSchema = t.Object({
  roleIds: t.Array(uuidString(true)),
});

export type CreateUserInput = typeof createUserSchema.static;
export type UpdateUserInput = typeof updateUserSchema.static;
export type CreateMembershipInput = typeof createMembershipSchema.static;
export type UpdateMembershipInput = typeof updateMembershipSchema.static;
export type AssignRolesInput = typeof assignRolesSchema.static;
