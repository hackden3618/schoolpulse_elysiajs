import { AppError } from "@/common/errors"
import { prisma } from "@/infrastructure/database/prisma"
import { writeEventOutbox } from "@/infrastructure/events"
import * as repo from "./repository"
import type { CreateSessionInput, UpdateRecordInput } from "./schema"

export async function listSessions(schoolId: string, query: { classInstanceId?: string; sessionDate?: string }) {
  return repo.findSessions(schoolId, query)
}

export async function getSession(schoolId: string, sessionId: string) {
  const session = await repo.findSessionById(schoolId, sessionId)
  if (!session) throw AppError.notFound("Attendance session not found")
  return session
}

export async function createSession(schoolId: string, authUser: { userId: string; membershipId?: string }, data: CreateSessionInput) {
  const dup = await repo.findDuplicateSession(schoolId, data.classInstanceId, new Date(data.sessionDate), data.sessionType)
  if (dup) throw AppError.conflict("Session already exists for this class, date, and type")

  const sessionId = await prisma.$transaction(async (tx: any) => {
    const session = await tx.attendanceSession.create({
      data: {
        schoolId,
        classInstanceId: data.classInstanceId,
        markerMembershipId: authUser.membershipId ?? null,
        sessionDate: new Date(data.sessionDate),
        sessionType: data.sessionType,
      },
    })

    const enrolled = await tx.enrollment.findMany({
      where: { classInstanceId: data.classInstanceId, status: "active", deletedAt: null },
      select: { studentId: true },
    })

    if (enrolled.length > 0) {
      await tx.attendanceRecord.createMany({
        data: enrolled.map((e: any) => ({
          schoolId,
          sessionId: session.id,
          studentId: e.studentId,
          status: "present" as const,
        })),
      })
    }

    return session.id
  })

  const result = await repo.findSessionById(schoolId, sessionId)

  await writeEventOutbox({
    schoolId,
    aggregateId: sessionId,
    aggregateType: "attendance_session",
    eventType: "AttendanceMarked",
    payload: { classInstanceId: data.classInstanceId },
  })

  return result
}

export async function editRecord(schoolId: string, sessionId: string, recordId: string, authUser: { membershipId?: string }, data: UpdateRecordInput) {
  const record = await repo.findRecord(sessionId, recordId)
  if (!record) throw AppError.notFound("Attendance record not found")
  if (record.session.status === "locked") throw AppError.forbidden("Session is locked")

  const updated = await repo.updateRecord(recordId, {
    status: data.status,
    editReason: data.editReason,
    editedByMembershipId: authUser.membershipId,
  })

  await writeEventOutbox({
    schoolId,
    aggregateId: sessionId,
    aggregateType: "attendance_session",
    eventType: "AttendanceEdited",
    payload: { recordId, status: data.status },
  })

  return updated
}

export async function lockSession(schoolId: string, sessionId: string) {
  const session = await repo.findSessionById(schoolId, sessionId)
  if (!session) throw AppError.notFound("Attendance session not found")
  if (session.status === "locked") throw AppError.conflict("Session is already locked")
  return repo.lockSession(sessionId)
}
