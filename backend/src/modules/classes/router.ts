// TODO: Implement Classes routes
import { Elysia } from "elysia";
import { getClassesController, createClassController } from "./controller";

export const classRoute = new Elysia()
    .get("/classes", getClassesController)
    .post("/classes", createClassController);
