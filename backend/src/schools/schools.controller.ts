import { listAllSchools, createSchool } from "./schools.service";

export async function getSchoolsController({ set }: any) {
    try {
        const schools = await listAllSchools();
        return {
            message: "List of schools",
            body: schools
        };
    } catch (error: any) {
        console.error("Failed to fetch schools:", error);
        set.status = 500;
        return {
            message: "Failed to fetch schools"
        };
    }
}

export async function createSchoolController({ body, set }: any) {
    try {
        const newSchool = await createSchool(body);
        return {
            message: `School has been created with ID: ${newSchool.id}`,
            body: newSchool
        };
    } catch (error: any) {
        console.error("Error creating school:", error);
        set.status = 500;
        return {
            message: "Error creating school"
        };
    }
}
