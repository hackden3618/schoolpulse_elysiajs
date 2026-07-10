import { prisma } from "@/infrastructure/database/prisma";

export async function findAllSchools() {
    return await prisma.school.findMany();
}

export async function createSchool(data: {
    schoolCode: string;
    schoolName: string;
    country: string;
    schoolPhone: string;
    county: string;
    town: string;
    schoolAddress?: string;
    schoolEmail?: string;
}) {
    return await prisma.school.create({ data });
}
