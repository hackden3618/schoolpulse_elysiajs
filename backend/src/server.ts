import dotenv from "dotenv";
import { app } from "./app";

dotenv.config();

const PORT = process.env.SERVERPORT || 3000;

app.listen(PORT);

console.log("The app is currently running in http://localhost:" + PORT);
