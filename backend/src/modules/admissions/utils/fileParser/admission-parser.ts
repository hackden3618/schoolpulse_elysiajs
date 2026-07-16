import * as XLSX from "xlsx"
import type { FileType, ParsedRow, NormalizedRow, ColumnMapping } from "../../types"
import { normalizeHeaders } from "../mapper/headerMapper"

const SUPPORTED_MIME: Record<string, FileType> = {
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
}

const MAX_FILE_SIZE = 100 * 1024 * 1024

export class AdmissionParser {
  async parseFile(
    file: File | Blob | Buffer,
    mimeType?: string,
    columnMapping?: ColumnMapping[]
  ): Promise<{ rows: ParsedRow[]; headers: string[]; detectedMapping: ColumnMapping[] }> {
    const buffer = await this.toBuffer(file)
    const type = mimeType ? SUPPORTED_MIME[mimeType] : this.detectType(file)

    if (!type) {
      throw new Error("Unsupported file type. Only CSV, XLS, and XLSX files are supported.")
    }

    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      throw new Error("The uploaded file contains no sheets.")
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in the workbook.`)
    }
    const rawData: Record<string, string | undefined>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: undefined,
      raw: false,
    })

    if (rawData.length === 0) {
      throw new Error("The uploaded file contains no data rows.")
    }

    const rawHeaders = Object.keys(rawData[0]!)
    const detectedMapping = columnMapping ?? normalizeHeaders(rawHeaders)
    const mappedHeaders = this.applyMapping(rawHeaders, detectedMapping)

    const rows: ParsedRow[] = rawData.map((raw, index) => {
      const normalized = this.normalizeRow(raw, mappedHeaders)
      return {
        rowNumber: index + 2,
        raw,
        normalized,
      }
    })

    return { rows, headers: rawHeaders, detectedMapping }
  }

  private async toBuffer(file: File | Blob | Buffer): Promise<Buffer> {
    if (Buffer.isBuffer(file)) return file
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  private detectType(file: File | Blob | Buffer): FileType | null {
    if (file instanceof File) {
      const mime = SUPPORTED_MIME[file.type]
      if (mime) return mime
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "csv") return "csv"
      if (ext === "xls") return "xls"
      if (ext === "xlsx") return "xlsx"
    }
    return "xlsx"
  }

  private applyMapping(headers: string[], mapping: ColumnMapping[]): Record<string, string> {
    const map: Record<string, string> = {}
    for (const header of headers) {
      const match = mapping.find(
        (m) => m.source.toLowerCase() === header.toLowerCase()
      )
      map[header] = match ? match.target : this.slugify(header)
    }
    return map
  }

  private normalizeRow(
    raw: Record<string, string | undefined>,
    mapping: Record<string, string>
  ): NormalizedRow {
    const normalized: NormalizedRow = {}
    for (const [sourceHeader, value] of Object.entries(raw)) {
      const targetField = mapping[sourceHeader] ?? this.slugify(sourceHeader)
      ;(normalized as any)[targetField] = value ?? undefined
    }
    return normalized
  }

  private slugify(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .replace(/_(.)/g, (_, c) => c.toUpperCase())
  }

  validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
    }
  }
}
