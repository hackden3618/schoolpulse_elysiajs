// TODO: Implement Classes controller
import { listAllClasses, createClass } from "./service";

export async function getClassesController({ set }: any) {
    try {
        const classes = await listAllClasses();
        return {
            message: "List of classes",
            body: classes
        };
    } catch (error: any) {
        console.error("Failed to fetch classes:", error);
        set.status = 500;
        return {
            message: "Failed to fetch classes"
        };
    }
}

export async function createClassController({ body, set }: any) {
    try {
        const newClass = await createClass(body);
        set.status = 201;
        return {
            message: `Class has been created with ID: ${newClass.id}`,
            body: newClass
        };
    } catch (error: any) {
        console.error("Error creating class:", error);
        set.status = 500;
        return {
            message: "Error creating class"
        };
    }
}
