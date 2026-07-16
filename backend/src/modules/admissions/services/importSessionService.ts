import { prisma } from "@/infrastructure/database/prisma"
import type { ImportStatus } from "../types"

export async function createImportSession(
  id: string,
  createdByUserId: string,
  schoolId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  strategy: string = "skip",
  batchSize: number = 100
) {
  return prisma.importSession.create({
    data: {
      id,
      schoolId,
      createdByUserId,
      fileName,
      fileSize,
      fileType,
      strategy,
      batchSize,
      status: "created",
      stage: "created",
    },
  })
}

export async function getSession(sessionId: string) {
  return prisma.importSession.findUnique({ where: { id: sessionId } })
}

export async function updateSession(
  sessionId: string,
  data: Partial<{
    fileName: string
    fileSize: number
    fileType: string
    status: string
    strategy: string
    batchSize: number
    totalRows: number
    validRows: number
    errorRows: number
    warningRows: number
    importedRows: number
    skippedRows: number
    columns: string[]
    columnMapping: any
    previewData: any
    summary: any
    errorReport: any
    checksum: string
    uploadedFilePath: string
    originalFileName: string
    progress: number
    stage: string
    startedAt: string
    completedAt: string
  }>
) {
  return prisma.importSession.update({
    where: { id: sessionId },
    data: {
      ...data,
      ...(data.columns ? { columns: data.columns } : {}),
      ...(data.columnMapping ? { columnMapping: data.columnMapping } : {}),
      ...(data.previewData ? { previewData: data.previewData } : {}),
      ...(data.summary ? { summary: data.summary } : {}),
      ...(data.errorReport ? { errorReport: data.errorReport } : {}),
    },
  })
}

export async function listImportSessions(
  schoolId: string,
  status?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const where: any = { schoolId }
  if (status) where.status = status

  const [sessions, total] = await Promise.all([
    prisma.importSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        status: true,
        strategy: true,
        totalRows: true,
        validRows: true,
        errorRows: true,
        warningRows: true,
        importedRows: true,
        skippedRows: true,
        progress: true,
        stage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.importSession.count({ where }),
  ])

  return { sessions, total, page, pageSize }
}

export async function deleteImportSession(sessionId: string) {
  return prisma.importSession.delete({ where: { id: sessionId } })
}

export async function getAdmissionStats() {
  const sessions = await prisma.importSession.findMany({
    select: { status: true, totalRows: true, importedRows: true },
  })

  return {
    totalImports: sessions.length,
    totalStudentsImported: sessions.reduce((sum, s) => sum + s.importedRows, 0),
    completedImports: sessions.filter((s) => s.status === "completed").length,
    failedImports: sessions.filter((s) => s.status === "failed").length,
  }
}

export function updateSessionProgress(
  sessionId: string,
  stage: ImportStatus,
  progress: number,
): void {
  prisma.importSession
    .update({
      where: { id: sessionId },
      data: { stage, progress },
    })
    .catch(() => {})
}
