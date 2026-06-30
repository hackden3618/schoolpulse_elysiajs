import { listAllSchools, createSchool } from "./schools.service";

export async function getSchoolsController() {
    try {
        const schools = await listAllSchools();
        return {
            message: "List of schools",
            body: schools
        };
    } catch (error: any) {
        return {
            status: 500,
            message: "Failed to fetch schools",
            error: error.message
        };
    }
}

export async function createSchoolController({ body }: any) {
    try {
        const newSchool = await createSchool(body);
        return {
            message: `School has been created with ID: ${newSchool.id}`,
            body: newSchool
        };
    } catch (error: any) {
        return {
            status: 500,
            message: "Error creating school",
            error: error.message
        };
    }
}
