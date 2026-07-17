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
  specialNeeds: t.Optional(t.Record(t.String(), t.Any())),
  classInstanceId: uuidString(false),
  academicYearId: uuidString(false),
  termId: uuidString(false),
  guardians: t.Optional(t.Array(t.Object({
    firstName: nameString(1, 100),
    lastName: nameString(1, 100),
    phone: t.String({ minLength: 9, maxLength: 15 }),
    email: t.Optional(t.String({ format: "email" })),
    relationship: t.Optional(t.UnionEnum([
      "father", "mother", "sibling", "emergency", "sponsor",
      "legal_guardian", "step_parent", "relative", "other",
    ])),
  }), { minItems: 1 })),
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
  specialNeeds: t.Optional(t.Record(t.String(), t.Any())),
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

export const updateEnrollmentSchema = t.Object({
  classInstanceId: t.Optional(uuidString(false)),
  academicYearId: t.Optional(uuidString(false)),
  termId: t.Optional(uuidString(false)),
  status: t.Optional(t.UnionEnum([
    "active", "suspended", "transferred", "expelled", "on_leave",
    "medical_leave", "truant", "dropped_out", "graduated"
  ])),
});

export const addGuardianByDetailsSchema = t.Object({
  firstName: nameString(1, 100),
  lastName: nameString(1, 100),
  phone: t.String({ minLength: 9, maxLength: 15 }),
  email: t.Optional(t.String({ format: "email" })),
  relationship: t.Optional(t.UnionEnum([
    "father", "mother", "sibling", "emergency", "sponsor",
    "legal_guardian", "step_parent", "relative", "other",
  ])),
  isPrimary: t.Optional(t.Boolean()),
});

export type CreateStudentInput = typeof createStudentSchema.static;
export type UpdateStudentInput = typeof updateStudentSchema.static;
export type LinkGuardianInput = typeof linkGuardianSchema.static;
export type ArchiveStudentInput = typeof archiveStudentSchema.static;
export type EnrollStudentInput = typeof enrollStudentSchema.static;
export type UpdateEnrollmentInput = typeof updateEnrollmentSchema.static;
export type AddGuardianByDetailsInput = typeof addGuardianByDetailsSchema.static;
