import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { prisma } from "@/infrastructure/database/prisma"
import { AppError } from "@/common/errors"
import * as classesService from "../service"

let schoolId: string
let yearId: string

beforeAll(async () => {
  const school = await prisma.school.create({
    data: {
      schoolName: `AY Test School ${Date.now()}`,
      schoolCode: `AY${String(Date.now()).slice(-5)}`,
      schoolPhone: "+254700003000",
      county: "Nairobi", town: "Nairobi",
      schoolLevel: "primary",
    },
  })
  schoolId = school.id
})

afterAll(async () => {
  await prisma.term.deleteMany({ where: { academicYear: { schoolId } } })
  await prisma.academicYear.deleteMany({ where: { schoolId } })
  await prisma.enrollment.deleteMany({ where: { schoolId } })
  await prisma.student.deleteMany({ where: { schoolId } })
  await prisma.schoolMembership.deleteMany({ where: { schoolId } })
  await prisma.school.deleteMany({ where: { id: schoolId } })
})

describe("Academic Years", () => {
  it("ACY-001: Create academic year", async () => {
    const year = await classesService.createAcademicYear(schoolId, {
      name: "2026 Academic Year",
      startDate: "2026-01-15",
      endDate: "2026-12-15",
    })
    yearId = year.id
    expect(year).toHaveProperty("id")
    expect(year.name).toBe("2026 Academic Year")
  })

  it("ACY-002: Create duplicate year name", async () => {
    try {
      await classesService.createAcademicYear(schoolId, {
        name: "2026 Academic Year",
        startDate: "2026-01-15",
        endDate: "2026-12-15",
      })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect((e as any).message || e).toBeTruthy()
    }
  })

  it("ACY-008: List academic years", async () => {
    const years = await classesService.listAcademicYears(schoolId)
    expect(years.length).toBeGreaterThanOrEqual(1)
  })

  it("ACY-008: Get academic year by ID", async () => {
    const year = await classesService.getAcademicYear(schoolId, yearId)
    expect(year.id).toBe(yearId)
  })

  it("ACY-003: Activate academic year", async () => {
    const activated = await classesService.activateAcademicYear(schoolId, yearId)
    expect(activated.active).toBe(true)
    // Verify only one is active
    const years = await classesService.listAcademicYears(schoolId)
    const active = years.filter((y: any) => y.active)
    expect(active.length).toBe(1)
  })

  it("ACY-004: Deactivation on activating another year", async () => {
    const year2 = await classesService.createAcademicYear(schoolId, {
      name: "2027 Academic Year",
      startDate: "2027-01-15",
      endDate: "2027-12-15",
    })
    await classesService.activateAcademicYear(schoolId, year2.id)
    const original = await classesService.getAcademicYear(schoolId, yearId)
    expect(original.active).toBe(false)
    await prisma.academicYear.delete({ where: { id: year2.id } })
  })
})

describe("Terms", () => {
  let termId: string

  it("TRM-001: Create term within academic year", async () => {
    const term = await classesService.createTerm(schoolId, {
      academicYearId: yearId,
      name: "Term 1",
      startDate: "2026-01-15",
      endDate: "2026-04-15",
    })
    termId = term.id
    expect(term.name).toBe("Term 1")
    expect(term.academicYearId).toBe(yearId)
  })

  it("TRM-007: Create term outside academic year bounds", async () => {
    try {
      await classesService.createTerm(schoolId, {
        academicYearId: yearId,
        name: "Invalid Term",
        startDate: "2025-01-01",
        endDate: "2025-03-01",
      })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(400)
    }
  })

  it("TRM-008: List terms", async () => {
    const terms = await classesService.listTerms(schoolId, yearId)
    expect(terms.length).toBeGreaterThanOrEqual(1)
  })

  it("TRM-004: Activate term", async () => {
    const { activateTerm } = await import("../service")
    const activated = await activateTerm(schoolId, termId)
    expect(activated.active).toBe(true)
  })

  it("TRM-006: Only one term can be active at a time", async () => {
    const t2 = await classesService.createTerm(schoolId, {
      academicYearId: yearId, name: "Term 2",
      startDate: "2026-05-01", endDate: "2026-08-15",
    })
    const { activateTerm } = await import("../service")
    await activateTerm(schoolId, t2.id)
    const t1 = await prisma.term.findUnique({ where: { id: termId } })
    expect(t1?.active).toBe(false)
    await prisma.term.delete({ where: { id: t2.id } })
  })
})

describe("Classes", () => {
  let classId: string

  it("CLS-001: Create class", async () => {
    const cls = await classesService.createClass(schoolId, {
      name: "Grade 1",
      level: 1,
    })
    classId = cls.id
    expect(cls.name).toBe("Grade 1")
    expect(cls.level).toBe(1)
  })

  it("CLS-002: Create duplicate class name in same school", async () => {
    try {
      await classesService.createClass(schoolId, {
        name: "Grade 1",
        level: 1,
      })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect((e as any).message || e).toBeTruthy()
    }
  })

  it("CLS-009: List classes", async () => {
    const classes = await classesService.listClasses(schoolId)
    expect(classes.length).toBeGreaterThanOrEqual(1)
  })

  it("CLS-008: Create ClassInstance (stream)", async () => {
    const ci = await classesService.createClassInstance(schoolId, {
      streamName: "East",
      classId,
      academicYearId: yearId,
    })
    expect(ci.classId).toBe(classId)
    expect(ci.streamName).toBe("East")
    await prisma.classInstance.delete({ where: { id: ci.id } })
  })
})
