import { prisma } from "../database/prisma";
import bcrypt from 'bcrypt';

const hash = async (password: string) => {
    const saltrounds = 10;
    return await bcrypt.hash(password, saltrounds);
};

export const verify = async (password: string, hashString: string) => {
    return await bcrypt.compare(password, hashString);
};

export async function listAllUsers() {
    return await prisma.user.findMany({
        select: {
            id: true,
            firstName: true,
            secondName: true,
            lastName: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });
}

export async function postNewUser(data: any) {
    const { first_name, second_name, last_name, phone, password, email } = data;
    const hashedPassword = await hash(password);

    return await prisma.user.create({
        data: {
            firstName: first_name,
            secondName: second_name,
            lastName: last_name,
            phone,
            hashedPassword,
            email,
        },
        select: {
            id: true,
            firstName: true,
            secondName: true,
            lastName: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });
}
