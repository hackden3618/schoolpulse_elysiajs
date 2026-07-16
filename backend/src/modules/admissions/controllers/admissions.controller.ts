import { AppError } from "@/common/errors"
import { success } from "@/common/responses"
import { wsManager } from "@/infrastructure/websocket"
import { AdmissionParser } from "@/modules/admissions/utils/fileParser/admission-parser"
import { AdmissionPolicy } from "@/modules/admissions/utils/validators/AdmissionPolicy"
import { GuardianResolver } from "@/modules/admissions/utils/guardianResolver/guardianResolver"
import { EnrollmentResolver } from "@/modules/admissions/utils/enrollmentResolver/enrollmentResolver"
import { PreviewBuilder } from "@/modules/admissions/utils/previewBuilder/previewBuilder"
import { TransactionImporter } from "@/modules/admissions/utils/transactionImporter/transactionImporter"
import {
  createImportSession,
  getSession,
  updateSession,
  listImportSessions,
  deleteImportSession,
  getAdmissionStats,
} from "@/modules/admissions/services/importSessionService"
import { normalizeHeaders } from "@/modules/admissions/utils/mapper/headerMapper"
import type { ImportStatus, ValidatedRow } from "@/modules/admissions/types"

function broadcastProgress(userId: string, schoolId: string, stage: ImportStatus, progress: number, message: string, extra?: Record<string, any>) {
  wsManager.broadcastToUser(userId, "import:progress", {
    sessionId: null,
    stage,
    progress,
    current: extra?.current ?? 0,
    total: extra?.total ?? 0,
    message,
    ...extra,
  })
}

export async function createImportSessionHandler(context: {
  body: {
    fileName: string
    fileSize: number
    fileType: "csv" | "xls" | "xlsx"
    strategy?: "skip" | "replace" | "update"
    batchSize?: number
  }
  authUser: { userId: string; schoolId: string }
  set: any
}) {
  const { body, authUser, set } = context

  const sessionId = crypto.randomUUID()

  const session = await createImportSession(
    sessionId,
    authUser.userId,
    authUser.schoolId,
    body.fileName,
    body.fileSize,
    body.fileType,
    body.strategy || "skip",
    body.batchSize || 100
  )

  set.status = 201
  return success({ sessionId, session }, authUser.schoolId)
}

export async function uploadFileHandler(context: {
  params: { schoolId: string; sessionId: string }
  body: { file: any }
  authUser: { userId: string; schoolId: string }
  set: any
}) {
  const { params, authUser, set } = context

  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")

  const file = context.body.file as any
  const parser = new AdmissionParser()

  // Parse file
  broadcastProgress(authUser.userId, authUser.schoolId, "parsing", 10, "Parsing file...")
  const { rows, headers, detectedMapping } = await parser.parseFile(file)

  await updateSession(params.sessionId, {
    totalRows: rows.length,
    columns: headers,
    columnMapping: detectedMapping as any,
    originalFileName: session.fileName,
    status: "parsing",
  })

  // Validate
  broadcastProgress(authUser.userId, authUser.schoolId, "validating", 30, "Validating rows...")
  const policy = await AdmissionPolicy.create(authUser.schoolId)
  const validatedRows = await policy.validateRows(rows)
  const validCount = validatedRows.filter((r) => r.status === "valid").length
  const errorCount = validatedRows.filter((r) => r.status === "error").length
  const warningCount = validatedRows.filter((r) => r.status === "warning").length

  await updateSession(params.sessionId, {
    validRows: validCount,
    errorRows: errorCount,
    warningRows: warningCount,
    status: "validating",
  })

  // Resolve guardians
  broadcastProgress(authUser.userId, authUser.schoolId, "resolving_guardians", 50, "Resolving guardians...")
  const guardianResolver = new GuardianResolver(authUser.schoolId)
  const withGuardians = await guardianResolver.resolveGuardians(validatedRows)

  // Resolve enrollments
  broadcastProgress(authUser.userId, authUser.schoolId, "resolving_enrollments", 70, "Resolving enrollments...")
  const enrollmentResolver = new EnrollmentResolver(authUser.schoolId)
  const withEnrollments = await enrollmentResolver.resolveEnrollments(withGuardians)

  // Build preview
  broadcastProgress(authUser.userId, authUser.schoolId, "preview", 90, "Generating preview...")
  const previewBuilder = new PreviewBuilder()
  const preview = previewBuilder.buildPreview(withEnrollments)

  await updateSession(params.sessionId, {
    previewData: preview as any,
    summary: preview.summary as any,
    status: "preview",
    stage: "preview",
    progress: 100,
  })

  broadcastProgress(authUser.userId, authUser.schoolId, "preview", 100, "Ready for review")

  return success(
    {
      sessionId: params.sessionId,
      summary: preview.summary,
      mapping: detectedMapping,
    },
    authUser.schoolId
  )
}

export async function getProgressHandler(context: {
  params: { schoolId: string; sessionId: string }
  authUser: { userId: string; schoolId: string }
}) {
  const { params, authUser } = context
  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")

  return success(
    {
      stage: session.stage,
      progress: session.progress,
      total: session.totalRows,
      valid: session.validRows,
      errors: session.errorRows,
      warnings: session.warningRows,
      imported: session.importedRows,
      skipped: session.skippedRows,
    },
    authUser.schoolId
  )
}

export async function getPreviewHandler(context: {
  params: { schoolId: string; sessionId: string }
  authUser: { userId: string; schoolId: string }
}) {
  const { params, authUser } = context
  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")
  if (session.status !== "preview") {
    throw AppError.validation("Session must be in preview status")
  }

  return success(
    {
      summary: session.summary,
      rows: session.previewData,
      mapping: session.columnMapping,
    },
    authUser.schoolId
  )
}

export async function confirmImportHandler(context: {
  params: { schoolId: string; sessionId: string }
  body: { strategy?: "skip" | "replace" | "update" }
  authUser: { userId: string; schoolId: string; membershipId?: string | null }
  set: any
}) {
  const { params, body, authUser, set } = context

  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")
  if (session.status !== "preview") {
    throw AppError.validation("Session must be in preview status to confirm import")
  }

  const strategy = body.strategy || session.strategy || "skip"
  const rows: ValidatedRow[] = (session.previewData as any)?.rows ?? []
  const validRows = rows.filter((r) => r.status === "valid")

  await updateSession(params.sessionId, { status: "importing", stage: "importing", progress: 0, startedAt: new Date().toISOString() })

  const batchSize = session.batchSize || 100
  const totalBatches = Math.ceil(validRows.length / batchSize)
  let totalImported = 0
  let totalSkipped = 0
  let totalFailed = 0
  const allErrors: any[] = []

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize
    const end = Math.min(start + batchSize, validRows.length)
    const batch = validRows.slice(start, end)

    const importer = new TransactionImporter(authUser.schoolId, authUser.userId, strategy)
    const result = await importer.importBatch(batch)

    totalImported += result.imported
    totalSkipped += result.skipped
    totalFailed += result.failed
    allErrors.push(...result.errors)

    const progress = Math.round(((i + 1) / totalBatches) * 100)
    await updateSession(params.sessionId, {
      importedRows: totalImported,
      skippedRows: totalSkipped,
      errorRows: totalFailed,
      progress,
    })

    broadcastProgress(
      authUser.userId,
      authUser.schoolId,
      "importing",
      progress,
      `Imported batch ${i + 1} of ${totalBatches}`,
      { current: end, total: validRows.length }
    )
  }

  await updateSession(params.sessionId, {
    status: "completed",
    stage: "completed",
    progress: 100,
    completedAt: new Date().toISOString(),
    errorReport: allErrors.length > 0 ? allErrors : null,
  })

  broadcastProgress(authUser.userId, authUser.schoolId, "completed", 100, "Import completed")

  return success(
    {
      imported: totalImported,
      skipped: totalSkipped,
      failed: totalFailed,
      errors: allErrors.slice(0, 50),
      totalRows: session.totalRows,
    },
    authUser.schoolId
  )
}

export async function listSessionsHandler(context: {
  query: { status?: string; page?: string; pageSize?: string }
  authUser: { userId: string; schoolId: string }
}) {
  const { query, authUser } = context
  const page = parseInt(query.page || "1", 10)
  const pageSize = parseInt(query.pageSize || "20", 10)

  const result = await listImportSessions(authUser.schoolId, query.status, page, pageSize)
  return success(result, authUser.schoolId)
}

export async function cancelImportHandler(context: {
  params: { schoolId: string; sessionId: string }
  authUser: { userId: string; schoolId: string }
}) {
  const { params, authUser } = context

  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")

  await updateSession(params.sessionId, { status: "cancelled", stage: "cancelled" })

  return success({ cancelled: true }, authUser.schoolId)
}

export async function retryFailedRowsHandler(context: {
  params: { schoolId: string; sessionId: string }
  body: { rowNumbers: number[] }
  authUser: { userId: string; schoolId: string }
}) {
  const { params, body, authUser } = context

  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")

  const rows: ValidatedRow[] = (session.previewData as any)?.rows ?? []
  const failedRows = rows.filter(
    (r, i) => body.rowNumbers.includes(i + 1) && r.status === "error"
  )

  if (failedRows.length === 0) {
    throw AppError.validation("No matching failed rows found")
  }

  const importer = new TransactionImporter(authUser.schoolId, authUser.userId, session.strategy)
  const result = await importer.importBatch(failedRows)

  const newImported = (session.importedRows || 0) + result.imported
  const newErrors = Math.max(0, (session.errorRows || 0) - result.imported)

  await updateSession(params.sessionId, {
    importedRows: newImported,
    errorRows: newErrors,
    status: newImported >= session.totalRows ? "completed" : session.status,
  })

  return success(result, authUser.schoolId)
}

export async function getErrorReportHandler(context: {
  params: { schoolId: string; sessionId: string }
  authUser: { userId: string; schoolId: string }
}) {
  const { params, authUser } = context

  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")

  return success(
    {
      errors: session.errorReport ?? [],
      rows: session.previewData ?? [],
    },
    authUser.schoolId
  )
}

export async function getDownloadUrlHandler(context: {
  params: { schoolId: string; sessionId: string }
  authUser: { userId: string; schoolId: string }
}) {
  const { params, authUser } = context

  const session = await getSession(params.sessionId)
  if (!session) throw AppError.notFound("Import session not found")
  if (session.schoolId !== authUser.schoolId) throw AppError.forbidden("School context mismatch")

  return success(
    { downloadUrl: `/api/v1/schools/${params.schoolId}/admissions/sessions/${params.sessionId}/download` },
    authUser.schoolId
  )
}

export async function getStatsHandler() {
  const stats = await getAdmissionStats()
  return { success: true, data: stats }
}

export async function getConfigHandler() {
  return {
    success: true,
    data: {
      supportedFormats: [
        { type: "csv", maxRows: 100000, maxSizeMB: 100 },
        { type: "xls", maxRows: 50000, maxSizeMB: 100 },
        { type: "xlsx", maxRows: 50000, maxSizeMB: 100 },
      ],
      strategies: ["skip", "replace", "update"],
      defaultBatchSize: 100,
      maxFileSizeMB: 100,
      maxStudentsPerImport: 50000,
    },
  }
}
