import { t } from "elysia";
import { nameString, uuidString, dateString } from "@/common/validation";

export const createStudentSchema = t.Object({
  firstName: nameString(1, 100),
  secondName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  lastName: nameString(1, 100),
  dateOfBirth: dateString(true),
  admissionNumber: t.String({ minLength: 2, maxLength: 50, pattern: "^[A-Za-z0-9/-]+$" }),
  gender: t.Optional(t.UnionEnum(["male", "female"])),
  performanceExpectation: t.Optional(
    t.UnionEnum(["below_expectation", "average", "good", "excellent", "exceptional"])
  ),
  classInstanceId: uuidString(false),
  academicYearId: uuidString(false),
  termId: uuidString(false),
});

export const updateStudentSchema = t.Object({
  firstName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  secondName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  lastName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  dateOfBirth: dateString(false),
  gender: t.Optional(t.UnionEnum(["male", "female"])),
  performanceExpectation: t.Optional(
    t.UnionEnum(["below_expectation", "average", "good", "excellent", "exceptional"])
  ),
});

export const linkGuardianSchema = t.Object({
  guardianId: uuidString(true),
  relationship: t.Optional(
    t.UnionEnum([
      "father", "mother", "sibling", "emergency", "sponsor",
      "legal_guardian", "step_parent", "relative", "other",
    ])
  ),
  isPrimary: t.Optional(t.Boolean()),
  canPay: t.Optional(t.Boolean()),
  receivesSms: t.Optional(t.Boolean()),
  receivesEmail: t.Optional(t.Boolean()),
});

export const archiveStudentSchema = t.Object({
  reason: t.UnionEnum([
    "graduated", "dropped_out", "expelled", "transferred", "deceased", "other",
  ]),
  details: t.Optional(t.String({ maxLength: 500 })),
});

export const enrollStudentSchema = t.Object({
  classInstanceId: uuidString(true),
  academicYearId: uuidString(true),
  termId: uuidString(false),
});

export type CreateStudentInput = typeof createStudentSchema.static;
export type UpdateStudentInput = typeof updateStudentSchema.static;
export type LinkGuardianInput = typeof linkGuardianSchema.static;
export type ArchiveStudentInput = typeof archiveStudentSchema.static;
export type EnrollStudentInput = typeof enrollStudentSchema.static;
