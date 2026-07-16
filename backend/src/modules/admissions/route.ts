import { Elysia, t } from "elysia"
import { API_PREFIX } from "@/shared/constants"
import { errorHandler, authGuard } from "@/common/middleware"
import { checkPermission } from "@/common/middleware/permissionGuard"
import * as controller from "./controllers/admissions.controller"

export const admissionsRoute = new Elysia({ prefix: `${API_PREFIX}/schools/:schoolId/admissions` })
  .use(errorHandler)
  .use(authGuard)
  .guard({ beforeHandle: [checkPermission("student:bulk-import")] }, (app) => app
    .post("/sessions", async ({ body, authUser, set }) => {
      const result = await controller.createImportSessionHandler({ body, authUser, set })
      return result
    }, {
      body: t.Object({
        fileName: t.String({}),
        fileSize: t.Number({}),
        fileType: t.Enum({ csv: "csv", xls: "xls", xlsx: "xlsx" }),
        strategy: t.Optional(t.Enum({ skip: "skip", replace: "replace", update: "update" })),
        batchSize: t.Optional(t.Number({})),
      }),
      detail: { summary: "Create import session", tags: ["Admissions"] },
    })
    .post("/sessions/:sessionId/upload", async ({ params, body, authUser, set }) => {
      const result = await controller.uploadFileHandler({ params, body, authUser, set })
      return result
    }, {
      body: t.Object({ file: t.Any({}) }),
      detail: { summary: "Upload and process file", tags: ["Admissions"] },
    })
    .get("/sessions/:sessionId/progress", async ({ params, authUser }) => {
      const result = await controller.getProgressHandler({ params, authUser })
      return result
    }, {
      detail: { summary: "Get import progress", tags: ["Admissions"] },
    })
    .get("/sessions/:sessionId/preview", async ({ params, authUser }) => {
      const result = await controller.getPreviewHandler({ params, authUser })
      return result
    }, {
      detail: { summary: "Get import preview", tags: ["Admissions"] },
    })
    .post("/sessions/:sessionId/confirm", async ({ params, body, authUser, set }) => {
      const result = await controller.confirmImportHandler({ params, body, authUser, set })
      return result
    }, {
      body: t.Object({
        strategy: t.Optional(t.Enum({ skip: "skip", replace: "replace", update: "update" })),
      }),
      detail: { summary: "Confirm and start import", tags: ["Admissions"] },
    })
    .get("/sessions", async ({ query, authUser }) => {
      const result = await controller.listSessionsHandler({ query, authUser })
      return result
    }, {
      detail: { summary: "List import sessions", tags: ["Admissions"] },
    })
    .delete("/sessions/:sessionId", async ({ params, authUser }) => {
      const result = await controller.cancelImportHandler({ params, authUser })
      return result
    }, {
      detail: { summary: "Cancel import session", tags: ["Admissions"] },
    })
    .post("/sessions/:sessionId/retry-failed", async ({ params, body, authUser }) => {
      const result = await controller.retryFailedRowsHandler({ params, body, authUser })
      return result
    }, {
      body: t.Object({ rowNumbers: t.Array(t.Number({})) }),
      detail: { summary: "Retry failed rows", tags: ["Admissions"] },
    })
    .get("/sessions/:sessionId/error-report", async ({ params, authUser }) => {
      const result = await controller.getErrorReportHandler({ params, authUser })
      return result
    }, {
      detail: { summary: "Download error report", tags: ["Admissions"] },
    })
    .get("/sessions/:sessionId/download", async ({ params, authUser }) => {
      const result = await controller.getDownloadUrlHandler({ params, authUser })
      return result
    }, {
      detail: { summary: "Download original file", tags: ["Admissions"] },
    })
  )
  .get("/health", () => ({
    success: true,
    data: { status: "healthy", timestamp: new Date().toISOString() },
  }))
  .get("/stats", async () => {
    const result = await controller.getStatsHandler()
    return result
  }, {
    detail: { summary: "Get admission stats", tags: ["Admissions"] },
  })
  .get("/config", async () => {
    const result = await controller.getConfigHandler()
    return result
  }, {
    detail: { summary: "Get import configuration", tags: ["Admissions"] },
  })
  .get("/supported-formats", () => ({
    success: true,
    data: {
      formats: [
        { type: "csv", mimeType: "text/csv", extension: ".csv", maxRows: 100000 },
        { type: "xls", mimeType: "application/vnd.ms-excel", extension: ".xls", maxRows: 50000 },
        { type: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: ".xlsx", maxRows: 50000 },
      ],
    },
  }))
