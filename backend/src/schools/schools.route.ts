import { Elysia, t } from "elysia";
import { getSchoolsController, createSchoolController } from "./schools.controller";

export const schoolRoute = new Elysia()
    .get("/schools", getSchoolsController)
    .post("/schools", createSchoolController, {
        body: t.Object({
            schoolName: t.String(),
            schoolPhone: t.String(),
            schoolAddress: t.Optional(t.String()),
            schoolLogo: t.Optional(t.String()),
            schoolEmail: t.Optional(t.String()),
            schoolWebsite: t.Optional(t.String()),
            postOffice: t.Optional(t.String())
        })
    });
