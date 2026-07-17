export type ImportStatus =
  | "created"
  | "parsing"
  | "validating"
  | "resolving_guardians"
  | "resolving_enrollments"
  | "preview"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled"

export type ImportStrategy = "skip" | "replace" | "update"
export type FileType = "csv" | "xls" | "xlsx"
export type RowStatus = "valid" | "warning" | "error" | "skipped"

export interface ImportProgress {
  stage: ImportStatus
  progress: number
  current: number
  total: number
  message: string
  estimatedTimeRemaining?: number
}

export interface ParsedRow {
  rowNumber: number
  raw: Record<string, string | undefined>
  normalized: NormalizedRow
}

export interface NormalizedRow {
  admissionNumber?: string
  firstName?: string
  middleName?: string
  lastName?: string
  gender?: string
  dateOfBirth?: string
  stream?: string
  className?: string
  academicYearName?: string
  termName?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  relationship?: string
  isPrimaryGuardian?: string
  medicalInfo?: string
  transport?: string
  dormitory?: string
  remarks?: string
  previousBalance?: string
  scholarship?: string
  status?: string
  [key: string]: string | undefined
}

export interface ValidatedRow {
  rowNumber: number
  data: NormalizedRow
  status: RowStatus
  errors: ValidationError[]
  warnings: ValidationError[]
  guardianInfo?: ResolvedGuardianInfo
  enrollmentInfo?: ResolvedEnrollmentInfo
}

export interface ValidationError {
  field: string
  message: string
  suggestedFix?: string
}

export interface ResolvedGuardianInfo {
  guardianId?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  relationship: string
  isPrimary: boolean
  isExisting: boolean
}

export interface ResolvedEnrollmentInfo {
  classInstanceId?: string
  classInstanceName?: string
  academicYearId?: string
  academicYearName?: string
  termId?: string
  termName?: string
}

export interface ColumnMapping {
  source: string
  target: string
  confidence: number
  manual: boolean
}

export interface PreviewSummary {
  totalRows: number
  validStudents: number
  warnings: number
  errors: number
  duplicateGuardians: number
  newGuardians: number
  existingGuardians: number
  studentsToImport: number
  studentsSkipped: number
}

export interface PreviewData {
  summary: PreviewSummary
  rows: ValidatedRow[]
}

export interface ImportBatchResult {
  imported: number
  skipped: number
  failed: number
  errors: ValidationError[]
}

export interface ImportSessionData {
  id: string
  schoolId: string
  createdByUserId: string
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
  columnMapping: ColumnMapping[] | null
  previewData: ValidatedRow[] | null
  summary: PreviewSummary | null
  errorReport: ValidationError[] | null
  checksum: string | null
  uploadedFilePath: string | null
  originalFileName: string | null
  progress: number
  stage: string
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
