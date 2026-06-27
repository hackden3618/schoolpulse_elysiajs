import { Elysia } from "elysia"
import { listAllUsers, postNewUser } from "./users.service"

export const userRoute = new Elysia()
    .get("/users", async ({ store }: any) => {
        return ({
            message: "hello from user route",
            body: await listAllUsers(store)
        })
    })
    .post("/users", async ({store, body})=>{
        return(
            await postNewUser(store, body)
        )
    }) 
