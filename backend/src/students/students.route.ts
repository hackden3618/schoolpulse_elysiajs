import { Elysia, t } from "elysia";
import { getStudentsController, createStudentController } from "./students.controller";

export const studentRoute = new Elysia()
    .get("/students", getStudentsController)
    .post("/students", createStudentController, {
        body: t.Object({
            firstName: t.String(),
            secondName: t.Optional(t.String()),
            lastName: t.String(),
            dateOfBirth: t.String(),
            admissionNumber: t.String(),
            classId: t.String(),
            schoolId: t.String()
        })
    });
