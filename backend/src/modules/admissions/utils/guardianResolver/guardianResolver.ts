import { prisma } from "@/infrastructure/database/prisma"
import { normalizePhone } from "@/common/validation"
import type { ValidatedRow, ResolvedGuardianInfo } from "../../types"

export class GuardianResolver {
  private schoolId: string

  constructor(schoolId: string) {
    this.schoolId = schoolId
  }

  async resolveGuardians(rows: ValidatedRow[]): Promise<ValidatedRow[]> {
    const guardianPhoneSet = new Set<string>()
    const guardianMap = new Map<string, { userId: string; firstName: string; lastName: string; phone: string; email?: string }>()

    const phonesWithGuardians = rows
      .filter((r) => r.data.guardianPhone?.trim())
      .map((r) => normalizePhone(r.data.guardianPhone!))

    const uniquePhones = [...new Set(phonesWithGuardians)]

    const existingUsers = await prisma.user.findMany({
      where: { phone: { in: uniquePhones }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    })

    for (const user of existingUsers) {
      guardianMap.set(user.phone, {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName ?? "",
        phone: user.phone,
        email: user.email ?? undefined,
      })
    }

    return rows.map((row) => {
      if (!row.data.guardianPhone?.trim()) return row

      const phone = normalizePhone(row.data.guardianPhone!)
      const existing = guardianMap.get(phone)

      const relationship = row.data.relationship ?? "legal_guardian"

      let guardianInfo: ResolvedGuardianInfo

      if (existing && guardianPhoneSet.has(phone)) {
        guardianInfo = {
          guardianId: existing.userId,
          firstName: existing.firstName,
          lastName: existing.lastName,
          phone: existing.phone,
          email: existing.email,
          relationship: relationship.replace(/ /g, "_"),
          isPrimary: row.data.isPrimaryGuardian?.toLowerCase() === "yes" || row.data.isPrimaryGuardian === "true",
          isExisting: true,
        }
      } else if (existing) {
        guardianPhoneSet.add(phone)
        guardianInfo = {
          guardianId: existing.userId,
          firstName: existing.firstName,
          lastName: existing.lastName,
          phone: existing.phone,
          email: existing.email,
          relationship: relationship.replace(/ /g, "_"),
          isPrimary: row.data.isPrimaryGuardian?.toLowerCase() === "yes" || row.data.isPrimaryGuardian === "true",
          isExisting: true,
        }
      } else {
        guardianPhoneSet.add(phone)
        const nameParts = (row.data.guardianName ?? "").trim().split(/\s+/)
        guardianInfo = {
          firstName: nameParts[0] ?? row.data.guardianName ?? "Unknown",
          lastName: nameParts.slice(1).join(" ") ?? "",
          phone,
          email: row.data.guardianEmail?.trim() || undefined,
          relationship: relationship.replace(/ /g, "_"),
          isPrimary: row.data.isPrimaryGuardian?.toLowerCase() === "yes" || row.data.isPrimaryGuardian === "true",
          isExisting: false,
        }
      }

      return { ...row, guardianInfo }
    })
  }
}
