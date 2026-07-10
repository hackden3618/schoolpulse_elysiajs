import { prisma } from "@/infrastructure/database/prisma";

export async function findAllUsers() {
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

export async function createUser(data: {
    firstName: string;
    secondName?: string;
    lastName: string;
    phone: string;
    hashedPassword: string;
    email: string;
}) {
    return await prisma.user.create({
        data,
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
