import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { userRoute } from "@/modules/users/router";
import { schoolRoute } from "@/modules/schools/router";
import { studentRoute } from "@/modules/students/router";
import { streamsRoute } from "@/modules/streams/router";
import { communicationRoute } from "@/modules/communication/router";

export const app = new Elysia();

app.use(openapi());

app.use(userRoute);
app.use(schoolRoute);
app.use(studentRoute);
app.use(streamsRoute);
app.use(communicationRoute);

app.get("/", "Hello, you have reached your elysia server Dennis");
