import { prisma } from "../src/infrastructure/database/prisma"
import { hashPassword } from "../src/common/auth"

async function main() {
  console.log("Seeding database...")

  // Roles
  const roleNames = [
    "Platform Admin",
    "Super Admin",
    "Principal",
    "Deputy Principal",
    "Academic Master",
    "Bursar",
    "Teacher",
    "Admissions",
    "Reception",
    "Parent",
  ] as const

  const roles = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({
        where: { name },
        create: { name, description: `${name} role`, permissions: [] },
        update: {},
      })
    )
  )

  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]))

  // Admin user
  const adminPhone = "+254700000000"
  const adminPassword = await hashPassword("admin123")
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    create: {
      firstName: "Super",
      lastName: "Admin",
      phone: adminPhone,
      email: "admin@schoolpulse.com",
      hashedPassword: adminPassword,
      status: "active",
    },
    update: { hashedPassword: adminPassword },
  })

  // Demo school
  const school = await prisma.school.upsert({
    where: { schoolCode: "SCH001" },
    create: {
      schoolCode: "SCH001",
      schoolName: "Demo International School",
      schoolPhone: "+254711111111",
      schoolEmail: "info@demo.sch.ke",
      county: "Nairobi",
      town: "Nairobi",
      country: "Kenya",
      schoolLevel: "mixed",
      schoolTier: "medium",
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      currency: "KES",
      timezone: "Africa/Nairobi",
    },
    update: {},
  })

  // Membership + Super Admin role
  const membership = await prisma.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: admin.id } },
    create: { schoolId: school.id, userId: admin.id, status: "active" },
    update: {},
  })

  await prisma.schoolMembershipRole.upsert({
    where: { membershipId_roleId: { membershipId: membership.id, roleId: roleMap["Super Admin"]! } },
    create: { membershipId: membership.id, roleId: roleMap["Super Admin"]! },
    update: {},
  })

  // Academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2026" } },
    create: {
      schoolId: school.id,
      name: "2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      active: true,
    },
    update: {},
  })

  // Term 1
  await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: "Term 1" } },
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "Term 1",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-04-15"),
      active: true,
    },
    update: {},
  })

  // Classes
  const class1 = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Grade 1" } },
    create: { schoolId: school.id, name: "Grade 1", level: 1 },
    update: {},
  })

  const class2 = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Grade 2" } },
    create: { schoolId: school.id, name: "Grade 2", level: 2 },
    update: {},
  })

  // Class instances (streams)
  const stream1A = await prisma.classInstance.upsert({
    where: { classId_academicYearId_streamName: { classId: class1.id, academicYearId: academicYear.id, streamName: "A" } },
    create: {
      schoolId: school.id,
      classId: class1.id,
      academicYearId: academicYear.id,
      streamName: "A",
      isCurrent: true,
    },
    update: {},
  })

  const stream2A = await prisma.classInstance.upsert({
    where: { classId_academicYearId_streamName: { classId: class2.id, academicYearId: academicYear.id, streamName: "A" } },
    create: {
      schoolId: school.id,
      classId: class2.id,
      academicYearId: academicYear.id,
      streamName: "A",
      isCurrent: true,
    },
    update: {},
  })

  // Subjects
  const subjects = [
    { name: "Mathematics", code: "MATH" },
    { name: "English", code: "ENG" },
    { name: "Kiswahili", code: "KISW" },
    { name: "Science", code: "SCI" },
    { name: "Social Studies", code: "SST" },
    { name: "Religious Education", code: "RE" },
  ]

  for (const subj of subjects) {
    await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: subj.code } },
      create: { schoolId: school.id, ...subj },
      update: {},
    })
  }

  // Demo students
  const studentData = [
    { admissionNumber: "SCH001/001", firstName: "John", lastName: "Kamau", gender: "male" as const },
    { admissionNumber: "SCH001/002", firstName: "Mary", lastName: "Wanjiku", gender: "female" as const },
    { admissionNumber: "SCH001/003", firstName: "Peter", lastName: "Otieno", gender: "male" as const },
    { admissionNumber: "SCH001/004", firstName: "Grace", lastName: "Akinyi", gender: "female" as const },
    { admissionNumber: "SCH001/005", firstName: "David", lastName: "Mwangi", gender: "male" as const },
    { admissionNumber: "SCH001/006", firstName: "Sarah", lastName: "Chebet", gender: "female" as const },
  ]

  for (const s of studentData) {
    const student = await prisma.student.upsert({
      where: { schoolId_admissionNumber: { schoolId: school.id, admissionNumber: s.admissionNumber } },
      create: {
        schoolId: school.id,
        ...s,
        dateOfBirth: new Date("2016-01-01"),
        admissionDate: new Date("2026-01-15"),
        status: "active",
      },
      update: {},
    })

    // Enroll in stream 1A
    await prisma.enrollment.upsert({
      where: { studentId_classInstanceId_academicYearId: { studentId: student.id, classInstanceId: stream1A.id, academicYearId: academicYear.id } },
      create: {
        schoolId: school.id,
        studentId: student.id,
        classInstanceId: stream1A.id,
        academicYearId: academicYear.id,
        status: "active",
      },
      update: {},
    })
  }

  console.log("Seed completed successfully!")
  console.log(`  Admin: ${adminPhone} / admin123`)
  console.log(`  School: ${school.schoolName} (${school.schoolCode})`)
  console.log(`  Students: ${studentData.length} enrolled in Grade 1-A`)
  console.log(`  Subjects: ${subjects.length} created`)
  console.log(`  Roles: ${roles.length} created`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
