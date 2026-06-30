import { listAllStudents, createStudent } from "./students.service";

export async function getStudentsController() {
    try {
        const students = await listAllStudents();
        return {
            message: "List of students",
            body: students
        };
    } catch (error: any) {
        return {
            status: 500,
            message: "Failed to fetch students",
            error: error.message
        };
    }
}

export async function createStudentController({ body }: any) {
    try {
        const newStudent = await createStudent(body);
        return {
            message: `Student has been created with ID: ${newStudent.id}`,
            body: newStudent
        };
    } catch (error: any) {
        return {
            status: 500,
            message: "Error creating student",
            error: error.message
        };
    }
}
