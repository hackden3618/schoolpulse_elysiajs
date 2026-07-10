import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { userRoute } from "@/modules/users/routes";
import { schoolRoute } from "@/modules/schools/routes";
import { studentRoute } from "@/modules/students/routes";
import { streamsRoute } from "@/modules/streams/routes";
import { communicationRoute } from "@/modules/communication/routes";

export const app = new Elysia();

app.use(openapi());

app.use(userRoute);
app.use(schoolRoute);
app.use(studentRoute);
app.use(streamsRoute);
app.use(communicationRoute);

app.get("/", "Hello, you have reached your elysia server Dennis");
