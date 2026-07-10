import { Elysia } from "elysia";
import { getStreamsController } from "./controller";

export const streamsRoute = new Elysia();
const app = streamsRoute;
app.get("/streams", getStreamsController);
