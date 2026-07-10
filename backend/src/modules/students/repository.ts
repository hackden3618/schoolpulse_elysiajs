import { prisma } from "@/infrastructure/database/prisma";

export async function findAllStudents() {
    return await prisma.student.findMany();
}

export async function createStudent(data: {
    dateOfBirth: Date;
    admissionNumber: string;
    schoolId: string;
    firstName: string;
    secondName?: string;
    lastName: string;
}) {
    return await prisma.student.create({ data });
}
