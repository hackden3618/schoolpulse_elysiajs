import { prisma } from "@/infrastructure/database/prisma"

const sessionInclude = {
  classInstance: { include: { class: true } },
  marker: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
  records: {
    include: {
      student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } },
    },
    orderBy: { student: { firstName: "asc" as const } },
  },
} as const

export async function findSessionById(schoolId: string, sessionId: string) {
  return prisma.attendanceSession.findFirst({
    where: { id: sessionId, schoolId, deletedAt: null },
    include: sessionInclude,
  })
}

export async function findSessions(schoolId: string, query: { classInstanceId?: string; sessionDate?: string }) {
  const where: any = { schoolId, deletedAt: null }
  if (query.classInstanceId) where.classInstanceId = query.classInstanceId
  if (query.sessionDate) where.sessionDate = new Date(query.sessionDate)
  return prisma.attendanceSession.findMany({
    where,
    include: { ...sessionInclude, records: false },
    orderBy: { sessionDate: "desc" },
  })
}

export async function findDuplicateSession(schoolId: string, classInstanceId: string, sessionDate: Date, sessionType: string) {
  return prisma.attendanceSession.findFirst({
    where: { schoolId, classInstanceId, sessionDate, sessionType, deletedAt: null },
  })
}

export async function createSession(data: {
  schoolId: string
  classInstanceId: string
  markerMembershipId: string
  sessionDate: Date
  sessionType: string
}) {
  return prisma.attendanceSession.create({ data, include: sessionInclude })
}

export async function createRecordsBulk(sessionId: string, records: { schoolId: string; studentId: string; status: string }[]) {
  return prisma.attendanceRecord.createMany({
    data: records.map((r) => ({ sessionId, ...r })),
  })
}

export async function getEnrolledStudents(classInstanceId: string) {
  return prisma.enrollment.findMany({
    where: { classInstanceId, status: "active", deletedAt: null },
    select: { studentId: true, student: { select: { id: true, schoolId: true } } },
  })
}

export async function findRecord(sessionId: string, recordId: string) {
  return prisma.attendanceRecord.findFirst({
    where: { id: recordId, sessionId, deletedAt: null },
    include: { session: true },
  })
}

export async function updateRecord(recordId: string, data: { status: string; editReason?: string; editedByMembershipId?: string; editedAt?: Date }) {
  return prisma.attendanceRecord.update({
    where: { id: recordId },
    data: { ...data, editedAt: data.editedAt ?? new Date() },
  })
}

export async function lockSession(sessionId: string) {
  return prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: "locked", lockedAt: new Date() },
  })
}
