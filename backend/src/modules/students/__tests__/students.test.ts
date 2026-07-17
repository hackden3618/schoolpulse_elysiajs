import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { prisma } from "@/infrastructure/database/prisma"
import { AppError } from "@/common/errors"
import * as studentService from "../service"
import * as classService from "../../classes/service"

let schoolId: string
let yearId: string
let classId: string
let classInstanceId: string
let guardianUserId: string

beforeAll(async () => {
  const school = await prisma.school.create({
    data: {
      schoolName: `Student Test School ${Date.now()}`,
      schoolCode: `ST${String(Date.now()).slice(-5)}`,
      schoolPhone: "+254700004000",
      county: "Nairobi", town: "Nairobi",
      schoolLevel: "primary",
    },
  })
  schoolId = school.id

  await prisma.role.upsert({
    where: { name: "Guardian" },
    create: { name: "Guardian", description: "Guardian role" },
    update: {},
  })

  const year = await classService.createAcademicYear(schoolId, {
    name: "ST Test Year",
    startDate: "2026-01-01", endDate: "2026-12-31",
  })
  yearId = year.id

  const cls = await classService.createClass(schoolId, {
    name: `Grade 1 ${Date.now()}`, level: 1,
  })
  classId = cls.id

  const ci = await classService.createClassInstance(schoolId, {
    streamName: `East ${Date.now()}`, classId, academicYearId: yearId,
  })
  classInstanceId = ci.id

  const { hashPassword } = await import("@/common/auth")
  const hashed = await hashPassword("guardpass")
  const gu = await prisma.user.create({
    data: {
      firstName: "Guardian", lastName: "Test",
      email: `guardian${Date.now()}@test.com`,
      phone: `+254700004${String(Date.now()).slice(-6)}`,
      hashedPassword: hashed,
    },
  })
  guardianUserId = gu.id
})

afterAll(async () => {
  await prisma.studentGuardian.deleteMany({ where: { student: { schoolId } } })
  await prisma.enrollment.deleteMany({ where: { schoolId } })
  await prisma.student.deleteMany({ where: { schoolId } })
  await prisma.classInstance.deleteMany({ where: { schoolId } })
  await prisma.class.deleteMany({ where: { schoolId } })
  await prisma.term.deleteMany({ where: { academicYear: { schoolId } } })
  await prisma.academicYear.deleteMany({ where: { schoolId } })
  await prisma.schoolMembership.deleteMany({ where: { schoolId } })
  await prisma.user.deleteMany({ where: { id: guardianUserId } })
  await prisma.school.deleteMany({ where: { id: schoolId } })
})

describe("Student CRUD - without guardians (no SMS)", () => {
  let studentId: string
  const adNo = `ADM${Date.now()}`

  it("STU-001: Register student without guardians", async () => {
    const student = await studentService.createStudent(schoolId, {
      firstName: "Alice",
      lastName: "Student",
      admissionNumber: adNo,
      dateOfBirth: "2015-06-01",
      gender: "female",
      classInstanceId,
      academicYearId: yearId,
    })
    studentId = student.id
    expect(student.firstName).toBe("Alice")
    expect(student.admissionNumber).toBe(adNo)
    expect(student.status).toBe("active")
  })

  it("STU-001: Enrollment created with student", async () => {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, schoolId },
    })
    expect(enrollments.length).toBeGreaterThanOrEqual(1)
  })

  it("STU-002: Duplicate admission number rejected", async () => {
    try {
      await studentService.createStudent(schoolId, {
        firstName: "Bob",
        lastName: "Student",
        admissionNumber: adNo,
        dateOfBirth: "2015-06-01",
        gender: "male",
      })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(409)
    }
  })

  it("STU-003: Edit student", async () => {
    const updated = await studentService.updateStudent(schoolId, studentId, {
      firstName: "Alicia",
      lastName: "Smith",
    })
    expect(updated.firstName).toBe("Alicia")
    expect(updated.lastName).toBe("Smith")
  })

  it("STU-004: Archive student", async () => {
    const archived = await studentService.archiveStudent(schoolId, studentId, {
      reason: "transferred",
      details: "Moved to another school",
    })
    expect(archived.status).toBe("archived")
    expect(archived.archiveReason).toBe("transferred")
  })

  it("STU-005: Restore (unarchive) student", async () => {
    const restored = await studentService.unarchiveStudent(schoolId, studentId)
    expect(restored.status).toBe("active")
    expect(restored.archiveReason).toBeNull()
  })

  it("STU-009: Search students", async () => {
    const students = await studentService.listAllStudents(schoolId)
    const found = students.find((s: any) => s.id === studentId)
    expect(found).toBeTruthy()
  })

  it("STU-019: Validation - missing date of birth", async () => {
    try {
      await studentService.createStudent(schoolId, {
        firstName: "NoDOB",
        lastName: "Test",
        admissionNumber: `ADM_NO_DOB_${Date.now()}`,
        dateOfBirth: "", gender: "male",
      } as any)
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeTruthy()
    }
  })

  it("STU-003: Edit non-existent student", async () => {
    try {
      await studentService.updateStudent(schoolId, "00000000-0000-0000-0000-000000000000", { firstName: "X" })
      expect.unreachable("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      expect((e as AppError).statusCode).toBe(404)
    }
  })
})

describe("Student Guardians", () => {
  let studentId: string
  const adNo = `ADM_G${Date.now()}`

  it("GRD-001: Create student with guardian", async () => {
    const student = await studentService.createStudent(schoolId, {
      firstName: "Chris",
      lastName: "GuardianLink",
      admissionNumber: adNo,
      dateOfBirth: "2016-03-15",
      gender: "male",
      guardians: [{
        firstName: "Parent", lastName: "One",
        phone: `+254700004${String(Date.now() + 1).slice(-6)}`,
        relationship: "father",
      }],
    })
    studentId = student.id
    expect(student).toHaveProperty("id")
  })

  it("GRD-001: Guardian user and membership created", async () => {
    const links = await prisma.studentGuardian.findMany({
      where: { studentId },
      include: { guardian: true },
    })
    expect(links.length).toBe(1)
    expect(links[0]!.guardian.firstName).toBe("Parent")

    const membership = await prisma.schoolMembership.findFirst({
      where: { schoolId, userId: links[0]!.guardianId },
    })
    expect(membership).not.toBeNull()
    expect(membership!.status).toBe("active")
  })

  it("GRD-004: Set primary guardian", async () => {
    // Create a second guardian first
    const g2 = await prisma.user.create({
      data: {
        firstName: "Parent2", lastName: "Test",
        email: `parent2${Date.now()}@test.com`,
        phone: `+254700004${String(Date.now() + 2).slice(-6)}`,
        hashedPassword: "x",
      },
    })
    const link = await studentService.linkGuardian(schoolId, studentId, {
      guardianId: g2.id, relationship: "mother", isPrimary: true,
    })
    expect(link.isPrimary).toBe(true)
    await prisma.user.delete({ where: { id: g2.id } })
  })

  it("GRD-006: Guardian views only linked students", async () => {
    const students = await studentService.listMyStudents(schoolId, guardianUserId)
    for (const s of students) {
      const link = await prisma.studentGuardian.findFirst({
        where: { studentId: s.id, guardianId: guardianUserId },
      })
      expect(link).not.toBeNull()
    }
  })

  it("GRD-005: Remove guardian", async () => {
    const links = await prisma.studentGuardian.findMany({ where: { studentId } })
    if (links.length > 0) {
      await prisma.studentGuardian.delete({ where: { id: links[0]!.id } })
      const remaining = await prisma.studentGuardian.findMany({ where: { studentId } })
      expect(remaining.length).toBe(links.length - 1)
    }
  })
})
