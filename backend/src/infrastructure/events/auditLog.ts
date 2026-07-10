import { prisma } from "@/infrastructure/database/prisma";

export interface AuditEntry {
  schoolId?: string;
  actorUserId?: string;
  actorMembershipId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      schoolId: entry.schoolId,
      actorUserId: entry.actorUserId,
      actorMembershipId: entry.actorMembershipId,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId,
      oldValue: entry.oldValue as any ?? undefined,
      newValue: entry.newValue as any ?? undefined,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    },
  });
}
