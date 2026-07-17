import { prisma } from "@/infrastructure/database/prisma";
import type { Prisma } from "@root/generated/prisma-client/client";

const studentInclude = {
  guardians: {
    where: { deletedAt: null },
    include: {
      guardian: {
        select: {
          id: true, firstName: true, secondName: true,
          lastName: true, phone: true, email: true,
        },
      },
    },
  },
  enrollments: {
    where: { deletedAt: null },
    include: {
      classInstance: {
        include: {
          class: true,
        },
      },
      academicYear: true,
      term: true,
    },
    orderBy: { createdAt: "desc" },
  },
  _count: {
    select: {
      enrollments: true,
      invoices: true,
      attendanceRecords: true,
    },
  },
} satisfies Prisma.StudentInclude;

export async function findAllStudents(schoolId: string, includeArchived?: boolean) {
  const statusFilter = includeArchived ? {} : { status: { not: "archived" as const } }
  return prisma.student.findMany({
    where: { schoolId, deletedAt: null, ...statusFilter },
    include: studentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findStudentsByGuardian(schoolId: string, userId: string) {
  return prisma.student.findMany({
    where: {
      schoolId,
      deletedAt: null,
      status: { not: "archived" },
      guardians: { some: { guardianId: userId, deletedAt: null } },
    },
    include: studentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findStudentById(schoolId: string, id: string) {
  return prisma.student.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: studentInclude,
  });
}

export async function findStudentByAdmission(
  schoolId: string,
  admissionNumber: string
) {
  return prisma.student.findFirst({
    where: { schoolId, admissionNumber, deletedAt: null },
  })
}

/**
 * Cross-school lookup by admission number. The C2B paybill reference is the
 * admission number, but the confirmation webhook is not school-scoped, so we
 * search every school. Admission numbers are unique enough per school that a
 * global scan is safe and cheap.
 */
export async function findStudentByAdmissionAcrossSchools(admissionNumber: string) {
  return prisma.student.findFirst({
    where: { admissionNumber, deletedAt: null },
    orderBy: { createdAt: "desc" },
  })
}

export async function adjustStudentCredit(studentId: string, delta: number) {
  return prisma.student.update({
    where: { id: studentId },
    data: { creditBalance: { increment: delta } },
  })
}

export async function getStudentCreditBalance(studentId: string) {
  return calculateStudentCreditBalance(studentId)
}

/**
 * Computes a student's credit balance from the payment ledger.
 * Overpayment surplus credits (isOverpaymentCredit) increase the balance;
 * credit prepayments (isCreditPrePayment) decrease it.
 * This is the source of truth — the stored creditBalance field is only a cache.
 */
export async function calculateStudentCreditBalance(studentId: string): Promise<number> {
  const credits = await prisma.payment.findMany({
    where: {
      studentId,
      type: "credit",
      status: "confirmed",
    },
    select: { amount: true, metadata: true },
  })

  let balance = 0
  for (const c of credits) {
    const meta = c.metadata as any
    if (meta?.isOverpaymentCredit) {
      balance += Number(c.amount)
    } else if (meta?.isCreditPrePayment) {
      balance -= Number(c.amount)
    }
  }
  return Math.max(0, balance)
}

/**
 * Returns the active term for the school (joined to the active academic year).
 * Used to prefill forms with the current term.
 */
export async function findActiveTerm(schoolId: string) {
  return prisma.term.findFirst({
    where: { schoolId, active: true, deletedAt: null },
    include: { academicYear: true },
  })
}

/**
 * Generates the next sequential admission number for a school:
 *   ADM/<YYYY>/<seq>
 * `seq` is the count of (non-deleted) students + 1, zero-padded to 4.
 * The caller may override manual entry; this is a smart default.
 */
export async function generateAdmissionNumber(schoolId: string): Promise<string> {
  const count = await prisma.student.count({
    where: { schoolId, deletedAt: null },
  })
  const year = new Date().getFullYear()
  const seq = String(count + 1).padStart(4, "0")
  return `ADM/${year}/${seq}`
}

export async function updateStudent(
  id: string,
  data: Prisma.StudentUpdateInput
) {
  return prisma.student.update({
    where: { id },
    data,
    include: studentInclude,
  });
}

export async function linkGuardian(
  schoolId: string,
  studentId: string,
  guardianId: string,
  data: {
    relationship: string;
    isPrimary: boolean;
    canPay: boolean;
    receivesSms: boolean;
    receivesEmail: boolean;
  }
) {
  return prisma.studentGuardian.create({
    data: {
      school: { connect: { id: schoolId } },
      student: { connect: { id: studentId } },
      guardian: { connect: { id: guardianId } },
      relationship: data.relationship as any,
      isPrimary: data.isPrimary,
      canPay: data.canPay,
      receivesSms: data.receivesSms,
      receivesEmail: data.receivesEmail,
    },
    include: {
      guardian: {
        select: {
          id: true, firstName: true, secondName: true,
          lastName: true, phone: true, email: true,
        },
      },
    },
  });
}

export async function unlinkGuardian(
  studentId: string,
  guardianId: string
) {
  return prisma.studentGuardian.updateMany({
    where: { studentId, guardianId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
