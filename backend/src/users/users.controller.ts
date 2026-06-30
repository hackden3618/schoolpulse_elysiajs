import { listAllUsers, postNewUser } from "./users.service";

export async function getUsersController({ set }: any) {
    try {
        const users = await listAllUsers();
        return {
            message: "List of users",
            body: users
        };
    } catch (error: any) {
        console.error("Failed to fetch users:", error);
        set.status = 500;
        return {
            message: "Failed to fetch users"
        };
    }
}

export async function createUserController({ body, set }: any) {
    try {
        const newUser = await postNewUser(body);
        return {
            message: `User has been created with ID: ${newUser.id}`,
            body: newUser
        };
    } catch (error: any) {
        console.error("Error creating user:", error);

        // Check for Prisma unique constraint violation
        if (error.code === 'P2002') {
            set.status = 409;
            return {
                message: "User with this email or phone already exists"
            };
        }

        set.status = 500;
        return {
            message: "Error creating user"
        };
    }
}
