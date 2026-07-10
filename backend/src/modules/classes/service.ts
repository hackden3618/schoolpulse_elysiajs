// TODO: Implement Classes service
import { findAllClasses, createClass as createClassInRepo } from "./repository";

export async function listAllClasses() {
    return await findAllClasses();
}

export async function createClass(data: any) {
    // TODO: Add business logic / validation
    return await createClassInRepo(data);
}
