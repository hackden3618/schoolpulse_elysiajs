import { prisma } from "@/infrastructure/database/prisma";

export interface OutboxEvent {
  schoolId?: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export async function writeEventOutbox(event: OutboxEvent): Promise<void> {
  await prisma.eventOutbox.create({
    data: {
      schoolId: event.schoolId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType as any,
      eventType: event.eventType as any,
      payload: event.payload as any,
    },
  });
}

export async function writeEventOutboxInTx(
  tx: any,
  event: OutboxEvent
): Promise<void> {
  await tx.eventOutbox.create({
    data: {
      schoolId: event.schoolId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType as any,
      eventType: event.eventType as any,
      payload: event.payload as any,
    },
  });
}
