import { AppError } from "@/common/errors"
import type { AcademicYear, Term, Student } from "@root/generated/prisma-client/client"

/**
 * Business rules for student lifecycle operations.
 * Rules live here (AGENTS.md §7) so they are enforced in one place
 * rather than scattered across services and forms.
 */
export class StudentPolicy {
  /**
   * Enrollment rules:
   *  - cannot enroll an inactive/archived student
   *  - cannot enroll into an inactive academic year
   *  - cannot enroll into an inactive term
   */
  static canEnroll(
    student: Student,
    academicYear: AcademicYear | null,
    term: Term | null | undefined,
  ) {
    if (!student) throw AppError.notFound("Student not found")
    if (student.status !== "active") {
      throw AppError.validation("Cannot enroll an inactive or archived student")
    }
    if (!academicYear) throw AppError.notFound("Academic year not found")
    if (!academicYear.active) {
      throw AppError.validation("Cannot enroll into an inactive academic year")
    }
    if (term && !term.active) {
      throw AppError.validation("Cannot enroll into an inactive term")
    }
  }

  static assertNotDuplicateEnrollment(existing: { deletedAt: Date | null } | null) {
    if (!existing) return
    if (existing.deletedAt !== null) return // soft-deleted → safe to restore
    throw AppError.conflict("Student is already enrolled in this class for this academic year")
  }

  static canArchive(student: Student, hasActiveEnrollment: boolean) {
    if (!student) throw AppError.notFound("Student not found")
    if (hasActiveEnrollment) {
      throw AppError.validation("Cannot archive a student with an active enrollment")
    }
  }
}
