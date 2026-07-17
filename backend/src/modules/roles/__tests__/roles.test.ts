import { describe, it, expect, beforeAll } from "bun:test"
import { prisma } from "@/infrastructure/database/prisma"
import * as rolesService from "../service"

const roleNames = [
  "Principal", "Deputy Principal", "Academic Master", "Super Admin",
  "Bursar", "Teacher", "Admissions", "Reception", "Guardian",
]

beforeAll(async () => {
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      create: { name, description: `${name} role` },
      update: {},
    })
  }
})

describe("Roles Service", () => {
  it("ROL-001: Returns all seeded roles", async () => {
    const roles = await rolesService.getAllRoles()
    expect(roles.length).toBeGreaterThanOrEqual(9)
    const names = roles.map((r: any) => r.name)
    expect(names).toContain("Principal")
    expect(names).toContain("Teacher")
    expect(names).toContain("Bursar")
    expect(names).toContain("Guardian")
    expect(names).toContain("Super Admin")
  })

  it("ROL-002: Each role has id, name, description", async () => {
    const roles = await rolesService.getAllRoles()
    for (const role of roles) {
      expect(role).toHaveProperty("id")
      expect(role).toHaveProperty("name")
      expect(role).toHaveProperty("description")
    }
  })

  it("ROL-003: Role names are unique", async () => {
    const roles = await rolesService.getAllRoles()
    const names = roles.map((r: any) => r.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
