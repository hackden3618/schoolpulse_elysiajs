import { t } from "elysia"

export const CreateSessionSchema = t.Object({
  fileName: t.String({}),
  fileSize: t.Number({}),
  fileType: t.Enum({ csv: "csv", xls: "xls", xlsx: "xlsx" }),
  strategy: t.Optional(t.Enum({ skip: "skip", replace: "replace", update: "update" })),
  batchSize: t.Optional(t.Number({})),
})

export const UploadFileSchema = t.Object({
  file: t.Any({}),
})

export const ConfirmImportSchema = t.Object({
  strategy: t.Optional(t.Enum({ skip: "skip", replace: "replace", update: "update" })),
})