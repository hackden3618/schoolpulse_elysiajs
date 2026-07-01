import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { userRoute } from "@/users/route";
import { schoolRoute } from "@/schools/route";
import { studentRoute } from "@/students/route";
import dotenv from "dotenv";

dotenv.config();

const app = new Elysia();
const PORT = process.env.SERVERPORT || 3000;
app.use(openapi());
app.use(userRoute);
app.use(schoolRoute);
app.use(studentRoute);
app.get("/", "Hello, you have reached your elysia server Dennis");
app.listen(PORT);

console.log("The app is currently running in http://localhost:" + PORT);
