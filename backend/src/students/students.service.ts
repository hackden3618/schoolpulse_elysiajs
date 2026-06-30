import { prisma } from "../database/prisma";

export async function listAllStudents() {
    return await prisma.student.findMany();
}

export async function createStudent(data: any) {
    const { dateOfBirth, admissionNumber, classId, schoolId, firstName, secondName, lastName } = data;
    return await prisma.student.create({
        data: {
            dateOfBirth: new Date(dateOfBirth),
            admissionNumber,
            classId,
            schoolId,
            firstName,
            secondName,
            lastName,
        }
    });
}
