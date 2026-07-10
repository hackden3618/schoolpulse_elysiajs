import { findAllStudents, createStudent as createStudentInRepo } from "./repository";

export async function listAllStudents() {
    return await findAllStudents();
}

export async function createStudent(data: any) {
    const { dateOfBirth, admissionNumber, schoolId, firstName, secondName, lastName } = data;
    return await createStudentInRepo({
        dateOfBirth: new Date(dateOfBirth),
        admissionNumber,
        schoolId,
        firstName,
        secondName,
        lastName,
    });
}
