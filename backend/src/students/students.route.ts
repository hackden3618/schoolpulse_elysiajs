import { Elysia } from "elysia";
import { getStudentsController, createStudentController } from "./students.controller";

export const studentRoute = new Elysia()
    .get("/students", getStudentsController)
    .post("/students", createStudentController);
