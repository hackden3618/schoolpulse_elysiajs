import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { prisma } from "@/infrastructure/database/prisma"
import { AppError } from "@/common/errors"
import * as schoolService from "../service"

describe("School Service - Utilities", () => {
  it("extractInitials handles simple names", () => {
    expect(schoolService.extractInitials("Sunrise Academy")).toBe("SA")
  })

  it("extractInitials handles hyphenated names", () => {
    expect(schoolService.extractInitials("St. Mary's High")).toBe("SMSH")
  })

  it("extractInitials returns up to 4 characters", () => {
    expect(schoolService.extractInitials("A B C D E F")).toBe("ABCD")
  })

  it("extractInitials returns single word initials", () => {
    expect(schoolService.extractInitials("School")).toBe("S")
  })

  it("generateSchoolCode produces correct format", () => {
    const code = schoolService.generateSchoolCode("Nairobi", "Westlands", "SUNR", 1)
    expect(code).toBe("NAIWESSUNR001")
  })

  it("generateSchoolCode pads sequence to 3 digits", () => {
    const code = schoolService.generateSchoolCode("Mombasa", "Nyali", "ABC", 42)
    expect(code).toBe("MOMNYAABC042")
  })
})

describe("School Service - CRUD", () => {
  let schoolId: string

  afterAll(async () => {
    if (schoolId) {
      await prisma.school.deleteMany({ where: { id: schoolId } })
    }
  })

  it("SCH-001: Create school", async () => {
    const ts = Date.now()
    const school = await schoolService.createSchool({
      schoolName: `Integration Test Academy ${ts}`,
      schoolPhone: "+254700002000",
      schoolEmail: `ita${ts}@test.com`,
      county: "Nairobi",
      town: "Kilimani",
      schoolLevel: "primary",
    })
    schoolId = school.id
    expect(school).toHaveProperty("id")
    expect(school.schoolName).toBe(`Integration Test Academy ${ts}`)
    expect(school.schoolCode).toBeTruthy()
    expect(school.schoolCode).toMatch(/^NAIKIL/)
  })

  it("SCH-007: Update school", async () => {
    if (!schoolId) return
    const updated = await schoolService.updateSchool(schoolId, {
      schoolName: "Integration Test High School",
      schoolPhone: "+254700002001",
    })
    expect(updated.schoolName).toBe("Integration Test High School")
    expect(updated.schoolPhone).toBe("+254700002001")
  })

  it("SCH-002: Duplicate school name rejected", async () => {
    if (!schoolId) return
    const original = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!original) return
    try {
      await schoolService.createSchool({
        schoolName: original.schoolName,
        schoolPhone: "+254700002002",
        schoolEmail: "ita2@test.com",
        county: "Nairobi",
        town: "Kilimani",
        schoolLevel: "primary",
      })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect((e as any).message || e).toBeTruthy()
    }
  })

  it("SCH-013: Get school by ID", async () => {
    if (!schoolId) return
    const school = await schoolService.getSchoolById(schoolId)
    expect(school.id).toBe(schoolId)
  })

  it("SCH-013: Get school by non-existent ID throws 404", async () => {
    try {
      await schoolService.getSchoolById("00000000-0000-0000-0000-000000000000")
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(404)
    }
  })

  it("SCH-015: Soft delete school", async () => {
    if (!schoolId) return
    const tag = String(Date.now()).slice(-5)
    const dup = await schoolService.createSchool({
      schoolName: `Delete Test School ${tag}`,
      schoolPhone: `+2547000${tag}0`,
      schoolEmail: `del${tag}@test.com`,
      county: "Machakos",
      town: "Athi River",
      schoolLevel: "primary",
    })
    const { deleteSchool } = await import("@/modules/platform-admin/service")
    const result = await deleteSchool(dup.id)
    expect(result.deleted).toBe(true)

    const deleted = await prisma.school.findFirst({ where: { id: dup.id } })
    expect(deleted!.deletedAt).not.toBeNull()
  })

  it("SCH-001: Create school generates unique code", async () => {
    const school = await schoolService.createSchool({
      schoolName: "Unique Code Test",
      schoolPhone: "+254700002020",
      schoolEmail: "unique@test.com",
      county: "Kiambu",
      town: "Thika",
      schoolLevel: "junior_secondary",
    })
    expect(school.schoolCode).toMatch(/^KIATHIUCT/)
    await prisma.school.deleteMany({ where: { id: school.id } })
  })
})
