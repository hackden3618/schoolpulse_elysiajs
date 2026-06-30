import { listAllStudents, createStudent } from "./students.service";

export async function getStudentsController({ set }: any) {
    try {
        const students = await listAllStudents();
        return {
            message: "List of students",
            body: students
        };
    } catch (error: any) {
        console.error("Failed to fetch students:", error);
        set.status = 500;
        return {
            message: "Failed to fetch students"
        };
    }
}

export async function createStudentController({ body, set }: any) {
    try {
        const newStudent = await createStudent(body);
        return {
            message: `Student has been created with ID: ${newStudent.id}`,
            body: newStudent
        };
    } catch (error: any) {
        console.error("Error creating student:", error);
        set.status = 500;
        return {
            message: "Error creating student"
        };
    }
}
