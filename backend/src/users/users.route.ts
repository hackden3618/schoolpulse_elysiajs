import { Elysia } from "elysia";
import { getUsersController, createUserController } from "./users.controller";

export const userRoute = new Elysia()
    .get("/users", getUsersController)
    .post("/users", createUserController);
