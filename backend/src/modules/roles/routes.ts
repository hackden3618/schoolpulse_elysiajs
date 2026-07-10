// TODO: Implement Roles routes
import { Elysia } from "elysia";

export const roleRoute = new Elysia()
    .get("/roles", () => "Roles endpoint");
