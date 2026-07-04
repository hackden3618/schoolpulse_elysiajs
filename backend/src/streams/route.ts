import { Elysia } from "elysia";
export const streamsRoute = new Elysia();
const app = streamsRoute;
app.get("/streams", "heyy from streams")
