import { AppError } from "@/common/errors";
import { writeEventOutbox } from "@/infrastructure/events";
import * as repo from "./repository";
import type { CreateSchoolInput, UpdateSchoolInput, UpdateSubscriptionInput } from "./schema";

export function extractInitials(name: string): string {
  return name
    .split(/[\s'-]+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 4)
    .join("");
}

export function generateSchoolCode(
  county: string,
  town: string,
  initials: string,
  sequence: number
): string {
  const countyPart = county.slice(0, 3).toUpperCase();
  const townPart = town.slice(0, 3).toUpperCase();
  const seq = String(sequence).padStart(3, "0");
  return `${countyPart}${townPart}${initials}${seq}`;
}

export async function listAllSchools() {
  return repo.findAllSchools();
}

export async function getSchoolById(id: string) {
  const school = await repo.findSchoolById(id);
  if (!school) {
    throw AppError.notFound("School not found");
  }
  return school;
}

export async function createSchool(data: CreateSchoolInput) {
  const initials = extractInitials(data.schoolName);
  const prefix = `${data.county.slice(0, 3).toUpperCase()}${data.town.slice(0, 3).toUpperCase()}${initials}`;

  const existing = await repo.findSchoolsByCodePrefix(prefix);
  const sequence = existing.length > 0
    ? parseInt(existing[0]!.schoolCode.slice(-3), 10) + 1
    : 1;

  const schoolCode = generateSchoolCode(data.county, data.town, initials, sequence);

  const codeTaken = await repo.findSchoolByCode(schoolCode);
  if (codeTaken) {
    throw AppError.conflict("Generated school code collides with an existing school");
  }

  const school = await repo.createSchool({
    schoolCode,
    schoolName: data.schoolName,
    schoolPhone: data.schoolPhone,
    schoolEmail: data.schoolEmail,
    schoolWebsite: data.schoolWebsite,
    schoolAddress: data.schoolAddress,
    schoolLogo: data.schoolLogo,
    postOffice: data.postOffice,
    county: data.county,
    town: data.town,
    country: data.country ?? "Kenya",
    currency: data.currency ?? "KES",
    timezone: data.timezone ?? "Africa/Nairobi",
    schoolLevel: (data.schoolLevel ?? "mixed") as any,
  });

  await writeEventOutbox({
    schoolId: school.id,
    aggregateId: school.id,
    aggregateType: "school",
    eventType: "SchoolCreated",
    payload: {
      schoolCode: school.schoolCode,
      schoolName: school.schoolName,
    },
  });

  return school;
}

export async function updateSchool(id: string, data: UpdateSchoolInput) {
  const school = await repo.findSchoolById(id);
  if (!school) {
    throw AppError.notFound("School not found");
  }
  return repo.updateSchool(id, data as any);
}

export async function getSubscription(id: string) {
  const school = await repo.findSchoolById(id);
  if (!school) {
    throw AppError.notFound("School not found");
  }
  return {
    id: school.id,
    subscriptionPlan: school.subscriptionPlan,
    subscriptionStatus: school.subscriptionStatus,
    schoolTier: school.schoolTier,
  };
}

export async function updateSubscriptionState(
  id: string,
  data: UpdateSubscriptionInput
) {
  const school = await repo.findSchoolById(id);
  if (!school) {
    throw AppError.notFound("School not found");
  }
  return repo.updateSubscription(id, data);
}
