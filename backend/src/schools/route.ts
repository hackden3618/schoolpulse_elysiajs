import { Elysia, t } from "elysia";
import { getSchoolsController, createSchoolController } from "./controller";

export const schoolRoute = new Elysia()
    .get("/schools", getSchoolsController)
    .post("/schools", createSchoolController, {
        body: t.Object({
            schoolCode: t.String(),
            schoolName: t.String(),
            schoolPhone: t.String(),
            country: t.String(),
            county: t.String(),
            town: t.String(),
            schoolAddress: t.Optional(t.String()),
            schoolLogo: t.Optional(t.String()) || t.Null(),
            schoolEmail: t.Optional(t.String()),
            schoolWebsite: t.Optional(t.String()),
            postOffice: t.Optional(t.String())
        })
    });
