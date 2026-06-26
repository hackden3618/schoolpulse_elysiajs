import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi"
import { dbRoute } from "./src/database/database.route.ts"
import { userRoute } from "./src/users/users.route.ts";
import { db } from "./src/database/database.init.ts"
import dotenv from "dotenv"

dotenv.config();

new Elysia()
    .state("db", db)
    .use(openapi())
    .use(dbRoute)
    .use(userRoute)
    .get("/", () => ("Hello, you have reached your elysia server Dennis"))
    .get("/json", () => ({
        status: 200,
        message: "Hello, you have done your first route and are in /json now",
        body: { name: "Dennis", password: "password", amount: "$4,000" }
    }))
    .get("/hello/:name", (request: any) => ("Hello, " + request.params.name))
    .post("/post", (request: any) => ("successfully posted data: " + (request.body.name)))
    .listen(3000);

console.log("Your app is currently running in http://localhost:3000");

