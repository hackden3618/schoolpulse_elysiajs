import crypto from "node:crypto"
import { prisma } from "@/infrastructure/database/prisma"
import { normalizePhone } from "@/common/validation"
import { hashPassword } from "@/common/auth"
import { writeEventOutboxInTx } from "@/infrastructure/events/eventOutbox"
import type { ValidatedRow, ImportBatchResult, ValidationError } from "../../types"

export class TransactionImporter {
  private schoolId: string
  private userId: string
  private strategy: string

  constructor(schoolId: string, userId: string, strategy: string = "skip") {
    this.schoolId = schoolId
    this.userId = userId
    this.strategy = strategy
  }

  async importBatch(rows: ValidatedRow[]): Promise<ImportBatchResult> {
    const result: ImportBatchResult = { imported: 0, skipped: 0, failed: 0, errors: [] }

    try {
      await prisma.$transaction(async (tx: any) => {
        const school = await tx.school.findUnique({
          where: { id: this.schoolId },
          select: { id: true, schoolName: true, schoolCode: true },
        })

        if (!school) {
          throw new Error("School not found")
        }

        const guardianRole = await tx.role.findFirst({ where: { name: "Guardian" } })
        const processedGuardians = new Map<string, string>()

        for (const row of rows) {
          if (row.status === "error") {
            result.skipped++
            continue
          }

          try {
            const data = row.data
            const existingStudent = data.admissionNumber
              ? await tx.student.findFirst({
                  where: {
                    schoolId: this.schoolId,
                    admissionNumber: data.admissionNumber,
                    deletedAt: null,
                  },
                })
              : null

            let studentId: string

            if (existingStudent) {
              if (this.strategy === "skip") {
                result.skipped++
                continue
              } else if (this.strategy === "replace") {
                // Immutability: do NOT hard-delete history. Soft-archive the
                // existing student (and its guardian links / enrollments) and
                // create a fresh record. The old history remains queryable for
                // audits and rollbacks.
                await tx.studentGuardian.updateMany({
                  where: { studentId: existingStudent.id, deletedAt: null },
                  data: { deletedAt: new Date() },
                })
                await tx.enrollment.updateMany({
                  where: { studentId: existingStudent.id, deletedAt: null },
                  data: { deletedAt: new Date() },
                })
                await tx.student.update({
                  where: { id: existingStudent.id },
                  data: { deletedAt: new Date() },
                })

                const created = await tx.student.create({
                  data: {
                    schoolId: this.schoolId,
                    admissionNumber: data.admissionNumber!,
                    firstName: data.firstName!,
                    secondName: data.middleName || null,
                    lastName: data.lastName!,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
                    gender: data.gender?.toLowerCase() === "male" || data.gender?.toLowerCase() === "female"
                      ? data.gender.toLowerCase()
                      : undefined,
                    admissionDate: new Date(),
                  },
                })
                studentId = created.id
              } else {
                const updated = await tx.student.update({
                  where: { id: existingStudent.id },
                  data: {
                    firstName: data.firstName ?? existingStudent.firstName,
                    secondName: data.middleName ?? existingStudent.secondName,
                    lastName: data.lastName ?? existingStudent.lastName,
                    ...(data.dateOfBirth ? { dateOfBirth: new Date(data.dateOfBirth) } : {}),
                    ...(data.gender ? { gender: data.gender.toLowerCase() as any } : {}),
                  },
                })
                studentId = updated.id
              }
            } else {
              const created = await tx.student.create({
                data: {
                  schoolId: this.schoolId,
                  admissionNumber: data.admissionNumber ?? `TEMP-${Date.now()}-${row.rowNumber}`,
                  firstName: data.firstName!,
                  secondName: data.middleName || null,
                  lastName: data.lastName!,
                  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
                  gender: data.gender?.toLowerCase() === "male" || data.gender?.toLowerCase() === "female"
                    ? data.gender.toLowerCase()
                    : undefined,
                  admissionDate: new Date(),
                },
              })
              studentId = created.id
            }

            if (data.guardianPhone?.trim()) {
              const phone = normalizePhone(data.guardianPhone!)
              let guardianUserId = processedGuardians.get(phone)

              if (!guardianUserId) {
                const guardianUser = await tx.user.findFirst({
                  where: { phone, deletedAt: null },
                })

                if (guardianUser) {
                  guardianUserId = guardianUser.id
                } else {
                  const otp = crypto.randomInt(100000, 999999).toString()
                  const hashedOtp = await hashPassword(otp)
                  const nameParts = (data.guardianName ?? "").trim().split(/\s+/)
                  const newUser = await tx.user.create({
                    data: {
                      firstName: nameParts[0] ?? "Guardian",
                      lastName: nameParts.slice(1).join(" ") || "User",
                      phone,
                      email: data.guardianEmail?.trim() || null,
                      hashedPassword: hashedOtp,
                    },
                  })
                  guardianUserId = newUser.id
                }

                processedGuardians.set(phone, guardianUserId!)
              }

              const existingLink = await tx.studentGuardian.findFirst({
                where: { studentId, guardianId: guardianUserId!, deletedAt: null },
              })

              if (!existingLink) {
                await tx.studentGuardian.create({
                  data: {
                    schoolId: this.schoolId,
                    studentId,
                    guardianId: guardianUserId,
                    relationship: (data.relationship?.replace(/ /g, "_") ?? "legal_guardian") as any,
                    isPrimary: data.isPrimaryGuardian?.toLowerCase() === "yes" || data.isPrimaryGuardian === "true",
                    canPay: true,
                    receivesSms: true,
                    receivesEmail: false,
                  },
                })

                  const existingMembership = await tx.schoolMembership.findFirst({
                    where: { schoolId: this.schoolId, userId: guardianUserId, deletedAt: null },
                    include: { roles: { include: { role: true } } },
                  })

                  if (!existingMembership) {
                    const membership = await tx.schoolMembership.create({
                      data: { schoolId: this.schoolId, userId: guardianUserId, status: "active" },
                    })
                    if (guardianRole) {
                      await tx.schoolMembershipRole.create({
                        data: { membershipId: membership.id, roleId: guardianRole.id },
                      })
                    }
                  } else if (guardianRole) {
                    const hasGuardianRole = existingMembership.roles.some((r: any) => r.role.name === "Guardian")
                    if (!hasGuardianRole) {
                      await tx.schoolMembershipRole.create({
                        data: { membershipId: existingMembership.id, roleId: guardianRole.id },
                      })
                    }
                  }
              }
            }

            if (row.enrollmentInfo?.classInstanceId && row.enrollmentInfo?.academicYearId) {
              const existingEnrollment = await tx.enrollment.findFirst({
                where: {
                  studentId,
                  classInstanceId: row.enrollmentInfo.classInstanceId,
                  academicYearId: row.enrollmentInfo.academicYearId,
                  deletedAt: null,
                },
              })

              if (!existingEnrollment) {
                await tx.enrollment.create({
                  data: {
                    schoolId: this.schoolId,
                    studentId,
                    classInstanceId: row.enrollmentInfo.classInstanceId,
                    academicYearId: row.enrollmentInfo.academicYearId,
                    termId: row.enrollmentInfo.termId ?? null,
                    status: "active",
                  },
                })
              }
            }

            await writeEventOutboxInTx(tx, {
              schoolId: this.schoolId,
              aggregateId: studentId,
              aggregateType: "student",
              eventType: "StudentAdmitted",
              payload: {
                admissionNumber: data.admissionNumber,
                firstName: data.firstName,
                lastName: data.lastName,
                importBatch: true,
              },
            })

            result.imported++
          } catch (err) {
            result.failed++
            result.errors.push({
              field: "row",
              message: err instanceof Error ? err.message : "Unknown error",
              suggestedFix: "Review this row's data and try again.",
            })
          }
        }
      })
    } catch (err) {
      throw new Error(`Import transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }

    return result
  }
}
