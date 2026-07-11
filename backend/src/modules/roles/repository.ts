import { prisma } from "@/infrastructure/database/prisma"

export async function findAllRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } })
}
