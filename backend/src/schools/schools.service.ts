import { prisma } from "../database/prisma";

export async function listAllSchools() {
    return await prisma.school.findMany();
}

export async function createSchool(data: any) {
    const { schoolName, schoolPhone, schoolAddress, schoolEmail } = data;
    return await prisma.school.create({
        data: {
            schoolName,
            schoolPhone,
            schoolAddress,
            schoolEmail,
        }
    });
}
