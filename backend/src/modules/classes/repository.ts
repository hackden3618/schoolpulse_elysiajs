// TODO: Implement Class database queries
import { prisma } from "@/infrastructure/database/prisma";

export async function findAllClasses() {
    // TODO: Add proper Prisma query
    return await prisma.class.findMany();
}

export async function createClass(data: any) {
    // TODO: Add proper Prisma query
    return await prisma.class.create({ data });
}
