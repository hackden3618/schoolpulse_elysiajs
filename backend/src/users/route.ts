import { Elysia } from "elysia";
import { getUsersController, createUserController } from "./controller";

export const userRoute = new Elysia();
const app = userRoute;
app.get("/users", getUsersController)
app.post("/users", createUserController);
