import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { userRoute } from "@/users/users.route";
import { schoolRoute } from "@/schools/schools.route";
import { studentRoute } from "@/students/students.route";
import dotenv from "dotenv";

dotenv.config();

new Elysia()
    .use(openapi())
    .use(userRoute)
    .use(schoolRoute)
    .use(studentRoute)
    .get("/", "Hello, you have reached your elysia server Dennis")
    .listen(3000);

console.log("The app is currently running in http://localhost:3000");
