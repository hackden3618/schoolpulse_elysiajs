import { Elysia } from "elysia"
import { alterUsersTable, createUsersTable, dropUsersTable } from "./database.service";

export const dbRoute = new Elysia()
    .onStart(async ({ store }) => {
        await createUsersTable(store)
        await alterUsersTable(store)
    })
    .get("/health", async ({ store }: any) => {
        try {
            const result = await store.db.query("SELECT NOW()")
            console.log("Your database connection is currently running");
            return ({ status: 200, message: "Database is connected", body: result.rows[0].now })
        } catch (error: any) {
            return ({ status: 500, message: "Database is not connected", body: error.message })
        }
    })
