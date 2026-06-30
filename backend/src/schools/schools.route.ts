import { Elysia } from "elysia";
import { getSchoolsController, createSchoolController } from "./schools.controller";

export const schoolRoute = new Elysia()
    .get("/schools", getSchoolsController)
    .post("/schools", createSchoolController);
