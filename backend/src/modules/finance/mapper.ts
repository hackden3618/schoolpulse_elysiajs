export class FinanceMapper {
  static toFeeStructureDTO(entity: any) {
    return {
      id: entity.id,
      academicYear: entity.academicYear?.name,
      term: entity.term?.name,
      isGlobal: entity.isGlobal,
      items: entity.feeItems?.map((i: any) => ({
        name: i.name,
        amount: Number(i.amount),
        optional: i.optional,
      })),
      createdAt: entity.createdAt,
    }
  }

  static toInvoiceDTO(entity: any) {
    return {
      id: entity.id,
      studentName: `${entity.student?.firstName} ${entity.student?.lastName}`,
      admissionNumber: entity.student?.admissionNumber,
      totalAmount: Number(entity.totalAmount),
      paidAmount: Number(entity.paidAmount),
      balance: Number(entity.balance),
      status: entity.status,
      createdAt: entity.createdAt,
    }
  }

  static toPaymentDTO(entity: any) {
    return {
      id: entity.id,
      amount: Number(entity.amount),
      method: entity.method,
      status: entity.status,
      transactionRef: entity.transactionRef,
      receivedAt: entity.receivedAt,
      studentName: `${entity.student?.firstName} ${entity.student?.lastName}`,
    }
  }
}
