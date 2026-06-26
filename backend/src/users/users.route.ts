import { Elysia } from "elysia"
import { usersController } from "./users.controller"

export const userRoute = new Elysia()
    .get("/users", async ({ store }: any) => {
        return ({
            message: "hello from user route",
            body: await usersController(store)
        })
    })
