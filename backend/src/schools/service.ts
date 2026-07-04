import { prisma } from "@/database/prisma";

export async function listAllSchools() {
    return await prisma.school.findMany();
}

export async function createSchool(data: any) {
    const { schoolCode, schoolName, country, county, town, schoolPhone, schoolAddress, schoolEmail } = data;
    return await prisma.school.create({
        data: {
            schoolCode,
            schoolName,
            country,
            schoolPhone,
            county,
            town,
            schoolAddress,
            schoolEmail,
        }
    });
}
