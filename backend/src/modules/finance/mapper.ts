export class FinanceMapper {
  static toFeeStructureDTO(entity: any) {
    return {
      id: entity.id,
      schoolId: entity.schoolId,
      academicYearId: entity.academicYearId,
      termId: entity.termId,
      classId: entity.classId ?? null,
      isGlobal: entity.isGlobal,
      isLatest: entity.isLatest,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      academicYear: entity.academicYear,
      term: entity.term,
      class: entity.class ?? null,
      feeItems: (entity.feeItems ?? entity.items ?? []).map((i: any) => ({
        id: i.id,
        schoolId: i.schoolId,
        feeStructureId: i.feeStructureId ?? entity.id,
        name: i.name,
        amount: Number(i.amount),
        optional: i.optional ?? false,
        description: i.description ?? null,
        createdAt: i.createdAt ?? entity.createdAt,
        updatedAt: i.updatedAt ?? entity.updatedAt,
      })),
    }
  }

  static toInvoiceDTO(entity: any, ledgerFields?: { paidAmount: number; balance: number; status: string }) {
    const paidAmount = ledgerFields?.paidAmount ?? Number(entity.paidAmount ?? 0)
    const totalAmount = Number(entity.totalAmount ?? 0)
    const balance = ledgerFields?.balance ?? (ledgerFields ? totalAmount - paidAmount : Number(entity.balance ?? totalAmount))
    const status = ledgerFields?.status ?? entity.status

    return {
      id: entity.id,
      schoolId: entity.schoolId,
      studentId: entity.studentId,
      enrollmentId: entity.enrollmentId ?? null,
      termId: entity.termId,
      feeStructureId: entity.feeStructureId ?? null,
      totalAmount,
      paidAmount,
      balance: Math.max(0, balance),
      status,
      isCurrent: entity.isCurrent ?? false,
      dueDate: entity.dueDate ?? entity.createdAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      student: entity.student,
      term: entity.term,
      feeStructure: entity.feeStructure ?? null,
      payments: (entity.payments ?? []).map((p: any) => FinanceMapper.toPaymentDTO(p)),
    }
  }

  static toPaymentDTO(entity: any) {
    return {
      id: entity.id,
      schoolId: entity.schoolId,
      studentId: entity.studentId,
      payerId: entity.payerId ?? null,
      invoiceId: entity.invoiceId ?? null,
      reversedPaymentId: entity.reversedPaymentId ?? null,
      createdByMembershipId: entity.createdByMembershipId ?? null,
      method: entity.method,
      type: entity.type ?? "fee",
      status: entity.status,
      provider: entity.provider ?? null,
      transactionRef: entity.transactionRef,
      amount: Number(entity.amount),
      receivedAt: entity.receivedAt ?? entity.createdAt,
      createdAt: entity.createdAt,
      student: entity.student ?? null,
      invoice: entity.invoice ?? null,
    }
  }
}
