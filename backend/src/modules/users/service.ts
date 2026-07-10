import bcrypt from 'bcrypt';
import { findAllUsers, createUser } from "./repository";

const hash = async (password: string) => {
    const saltrounds = 10;
    return await bcrypt.hash(password, saltrounds);
};

export const verify = async (password: string, hashString: string) => {
    return await bcrypt.compare(password, hashString);
};

export async function listAllUsers() {
    return await findAllUsers();
}

export async function postNewUser(data: any) {
    const { first_name, second_name, last_name, phone, password, email } = data;
    const hashedPassword = await hash(password);

    return await createUser({
        firstName: first_name,
        secondName: second_name,
        lastName: last_name,
        phone,
        hashedPassword,
        email,
    });
}
