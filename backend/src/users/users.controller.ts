import { listAllUsers, postNewUser } from "./users.service";

export async function getUsersController() {
    try {
        const users = await listAllUsers();
        return {
            message: "List of users",
            body: users
        };
    } catch (error: any) {
        return {
            status: 500,
            message: "Failed to fetch users",
            error: error.message
        };
    }
}

export async function createUserController({ body }: any) {
    try {
        const newUser = await postNewUser(body);
        return {
            message: `User has been created with ID: ${newUser.id}`,
            body: newUser
        };
    } catch (error: any) {
        return {
            status: 500,
            message: "Error creating user",
            error: error.message
        };
    }
}
