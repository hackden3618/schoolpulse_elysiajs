import { findAllSchools, createSchool as createSchoolInRepo } from "./repository";

export async function listAllSchools() {
    return await findAllSchools();
}

export async function createSchool(data: any) {
    const { schoolCode, schoolName, country, county, town, schoolPhone, schoolAddress, schoolEmail } = data;
    return await createSchoolInRepo({
        schoolCode,
        schoolName,
        country,
        schoolPhone,
        county,
        town,
        schoolAddress,
        schoolEmail,
    });
}
