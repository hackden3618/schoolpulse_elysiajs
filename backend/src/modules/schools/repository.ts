import { prisma } from "@/infrastructure/database/prisma";
import type { Prisma } from "@root/generated/prisma-client/client";

const schoolInclude = {
  _count: {
    select: {
      students: true,
      memberships: true,
      classInstances: true,
    },
  },
} satisfies Prisma.SchoolInclude;

export async function findAllSchools() {
  return prisma.school.findMany({
    where: { deletedAt: null },
    include: schoolInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findSchoolById(id: string) {
  return prisma.school.findFirst({
    where: { id, deletedAt: null },
    include: schoolInclude,
  });
}

export async function findSchoolByCode(code: string) {
  return prisma.school.findFirst({
    where: { schoolCode: code },
  });
}

export async function findSchoolsByCodePrefix(prefix: string) {
  return prisma.school.findMany({
    where: { schoolCode: { startsWith: prefix } },
    select: { schoolCode: true },
    orderBy: { schoolCode: "desc" },
    take: 1,
  });
}

export async function createSchool(data: Prisma.SchoolCreateInput) {
  return prisma.school.create({ data, include: schoolInclude });
}

export async function updateSchool(id: string, data: Prisma.SchoolUpdateInput) {
  return prisma.school.update({
    where: { id },
    data,
    include: schoolInclude,
  });
}

export async function updateSubscription(
  id: string,
  data: {
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    schoolTier?: string;
  }
) {
  return prisma.school.update({
    where: { id },
    data: {
      ...(data.subscriptionPlan ? { subscriptionPlan: data.subscriptionPlan as any } : {}),
      ...(data.subscriptionStatus ? { subscriptionStatus: data.subscriptionStatus as any } : {}),
      ...(data.schoolTier ? { schoolTier: data.schoolTier as any } : {}),
    },
    select: {
      id: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      schoolTier: true,
      updatedAt: true,
    },
  });
}
