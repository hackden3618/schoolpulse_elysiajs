import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Upload, FileText, CheckCircle, AlertCircle, X, Eye, RefreshCw,
  Clock, Users, Database, FileSpreadsheet, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, Info, Download, ArrowLeft,
} from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { importApi } from "../../lib/api"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { Table } from "../../components/ui/Table"
import { EmptyState } from "../../components/ui/EmptyState"
import { Skeleton } from "../../components/ui/Skeleton"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"
import type { ImportSession, ImportProgress, PreviewSummary, ValidatedRow, ImportStatus } from "../../types"

const stageLabels: Record<string, string> = {
  created: "Session Created",
  parsing: "Parsing File...",
  validating: "Validating Data...",
  resolving_guardians: "Resolving Guardians...",
  resolving_enrollments: "Resolving Enrollments...",
  preview: "Ready for Review",
  importing: "Importing Records...",
  completed: "Import Complete",
  failed: "Import Failed",
  cancelled: "Import Cancelled",
}

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "valid": return "success"
    case "warning": return "warning"
    case "error": return "danger"
    case "skipped": return "default"
    default: return "default"
  }
}

export function BulkImportPage() {
  const navigate = useNavigate()
  const { school } = useAuth()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [strategy, setStrategy] = useState("skip")
  const [batchSize, setBatchSize] = useState(100)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [stage, setStage] = useState<string>("idle")
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [currentItem, setCurrentItem] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null)
  const [previewRows, setPreviewRows] = useState<ValidatedRow[]>([])
  const [columnMapping, setColumnMapping] = useState<any[]>([])

  const [importHistory, setImportHistory] = useState<ImportSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)

  const loadHistory = useCallback(async () => {
    if (!school) return
    try {
      const res = await importApi.sessions.list(school.id, { pageSize: 10 })
      setImportHistory(res.data.sessions)
    } catch { }
  }, [school])

  useEffect(() => {
    if (!school) { navigate("/auth/login"); return }
    loadHistory()
  }, [school])

  useEffect(() => {
    if (stage === "parsing" || stage === "importing") {
      connectWs()
    }
    return () => { wsRef.current?.close() }
  }, [stage, sessionId])

  const connectWs = () => {
    if (!school) return
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = import.meta.env.DEV ? "localhost:3000" : window.location.host
    const token = localStorage.getItem("schoolpulse:auth")
    const parsed = token ? JSON.parse(token) : null
    const accessToken = parsed?.accessToken
    if (!accessToken) return

    const ws = new WebSocket(`${protocol}//${host}/ws?token=${accessToken}`)

    ws.onmessage = (event) => {
      try {
        const { event: evt, data } = JSON.parse(event.data)
        if (evt === "import:progress") {
          setStage(data.stage)
          setProgress(data.progress)
          setProgressMessage(data.message)
          setCurrentItem(data.current || 0)
          setTotalItems(data.total || 0)
        }
      } catch { }
    }

    ws.onerror = () => { }
    ws.onclose = () => { }
    wsRef.current = ws
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    validateAndSetFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) validateAndSetFile(f)
  }

  const validateAndSetFile = (f: File) => {
    if (f.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB")
      return
    }
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (!validTypes.includes(f.type) && !["csv", "xls", "xlsx"].includes(ext || "")) {
      setError("Only CSV (.csv), Excel (.xls, .xlsx) files are supported")
      return
    }
    setFile(f)
    setError("")
  }

  const getFileType = (): "csv" | "xls" | "xlsx" => {
    if (!file) return "csv"
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext === "csv") return "csv"
    if (ext === "xls") return "xls"
    return "xlsx"
  }

  const startImport = async () => {
    if (!file || !school) return
    setLoading(true)
    setError("")
    setPreviewSummary(null)
    setPreviewRows([])

    try {
      const createRes = await withMinDelay(
        importApi.sessions.create(school.id, {
          fileName: file.name,
          fileSize: file.size,
          fileType: getFileType(),
          strategy,
          batchSize,
        })
      )

      const sid = createRes.data.sessionId
      setSessionId(sid)
      setStage("parsing")
      setProgress(5)

      const uploadRes = await withMinDelay(
        importApi.sessions.upload.file(school.id, sid, file)
      )

      setPreviewSummary(uploadRes.data.summary)
      setColumnMapping(uploadRes.data.mapping)

      const previewRes = await withMinDelay(
        importApi.sessions.preview.get(school.id, sid)
      )

      setPreviewRows(previewRes.data.rows)
      setPreviewSummary(previewRes.data.summary)
      setStage("preview")
      setProgress(100)
      setProgressMessage("Ready for Review")

      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
      setStage("failed")
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    if (!sessionId || !school) return
    setLoading(true)
    setError("")

    try {
      setStage("importing")
      setProgress(0)

      const res = await importApi.sessions.confirm(school.id, sessionId, strategy)

      setStage("completed")
      setProgress(100)
      setSuccess(true)

      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import confirmation failed")
      setStage("failed")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setSessionId(null)
    setStage("idle")
    setProgress(0)
    setPreviewSummary(null)
    setPreviewRows([])
    setError("")
    setSuccess(false)
    setProgressMessage("")
  }

  const guardianLabel = (row: ValidatedRow) => {
    const g = row.guardianInfo
    if (!g) return "—"
    return `${g.firstName} ${g.lastName}`
  }

  const guardianPhone = (row: ValidatedRow) => {
    return row.guardianInfo?.phone || "—"
  }

  const createErrorReport = async () => {
    if (!sessionId || !school) return
    try {
      const res = await importApi.sessions.errorReport(school.id, sessionId)
      const blob = new Blob(
        [JSON.stringify(res.data.errors, null, 2)],
        { type: "application/json" }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `import-errors-${sessionId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch { }
  }

  const renderProgressBar = () => {
    const color =
      stage === "completed" ? "bg-success-500" :
      stage === "failed" ? "bg-danger-500" :
      "bg-accent"

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-surface-700">
            {stageLabels[stage] || stage}
          </span>
          <span className="text-surface-500">{progress}%</span>
        </div>
        <div className="overflow-hidden h-3 rounded-full bg-surface-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {stage === "importing" && totalItems > 0 && (
          <p className="text-xs text-surface-500">
            {currentItem} of {totalItems} records processed
          </p>
        )}
        {progressMessage && stage !== "preview" && (
          <p className="text-xs text-surface-500">{progressMessage}</p>
        )}
      </div>
    )
  }

  if (!school) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import Students"
        description="Import hundreds or thousands of students from an Excel or CSV file."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
              <Clock size={16} /> {showHistory ? "Hide" : "Import History"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/students")}>
              <ArrowLeft size={16} /> Back to Students
            </Button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-success-50 border border-success-100 text-success-700">
          <CheckCircle size={20} />
          <span>Import completed successfully!</span>
        </div>
      )}

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={18} /> Import History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {importHistory.length === 0 ? (
              <div className="p-6 text-center text-sm text-surface-500">No previous imports</div>
            ) : (
              <Table
                columns={[
                  { key: "file", header: "File", render: (s: ImportSession) => (
                    <span className="text-sm font-medium">{s.fileName}</span>
                  )},
                  { key: "status", header: "Status", render: (s: ImportSession) => (
                    <Badge variant={
                      s.status === "completed" ? "success" :
                      s.status === "failed" ? "danger" :
                      s.status === "cancelled" ? "default" : "warning"
                    }>{s.status}</Badge>
                  )},
                  { key: "rows", header: "Rows", render: (s: ImportSession) => (
                    <span className="text-sm">{s.totalRows}</span>
                  )},
                  { key: "imported", header: "Imported", render: (s: ImportSession) => (
                    <span className="text-sm">{s.importedRows}</span>
                  )},
                  { key: "date", header: "Date", render: (s: ImportSession) => (
                    <span className="text-sm text-surface-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  )},
                ]}
                data={importHistory}
              />
            )}
          </CardContent>
        </Card>
      )}

      {(stage === "idle" || stage === "failed" || stage === "completed") && !previewSummary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={20} /> Upload Student Data File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
                  ${dragOver ? "border-accent bg-accent/5" : "border-surface-300 hover:border-surface-400"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload size={40} className="mx-auto text-surface-400 mb-4" />
                <p className="text-surface-700 font-medium mb-1">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-surface-500">
                  Supports CSV, XLS, and XLSX files up to 100MB
                </p>
              </div>

              {file && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={24} className="text-success-500" />
                    <div>
                      <p className="font-medium text-surface-900">{file.name}</p>
                      <p className="text-xs text-surface-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                    <X size={14} /> Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database size={18} /> Import Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">Duplicate Strategy</label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="skip">Skip Duplicates</option>
                    <option value="replace">Replace Existing</option>
                    <option value="update">Update Existing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">Batch Size</label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value={100}>100 records</option>
                    <option value={250}>250 records</option>
                    <option value={500}>500 records</option>
                    <option value={1000}>1,000 records</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={startImport} disabled={!file || loading} loading={loading}>
                  <Upload size={16} className="mr-2" /> Start Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {stage === "parsing" && renderProgressBar()}

      {previewSummary && stage === "preview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <SummaryCard label="Total Rows" value={previewSummary.totalRows} icon={<FileText size={16} />} />
            <SummaryCard label="Valid" value={previewSummary.validStudents} icon={<CheckCircle size={16} />} color="text-success-600" />
            <SummaryCard label="Warnings" value={previewSummary.warnings} icon={<AlertTriangle size={16} />} color="text-warning-600" />
            <SummaryCard label="Errors" value={previewSummary.errors} icon={<AlertCircle size={16} />} color="text-danger-600" />
            <SummaryCard label="New Guardians" value={previewSummary.newGuardians} icon={<Users size={16} />} />
            <SummaryCard label="Existing Guardians" value={previewSummary.existingGuardians} icon={<Users size={16} />} />
            <SummaryCard label="To Import" value={previewSummary.studentsToImport} icon={<CheckCircle size={16} />} color="text-success-600" />
            <SummaryCard label="Skipped" value={previewSummary.studentsSkipped} icon={<X size={16} />} color="text-surface-500" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye size={18} /> Preview ({previewRows.length} rows)
                <span className="text-xs text-surface-400 font-normal ml-2">
                  Expand rows to see guardian details
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {previewRows.length === 0 ? (
                <div className="p-6 text-center text-surface-500">No rows to display</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">Admission</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">Student Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">Class</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">Guardian</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">Phone</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {previewRows.slice(0, 200).map((row, idx) => (
                        <>
                          <tr
                            key={idx}
                            className="hover:bg-surface-50 cursor-pointer"
                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          >
                            <td className="px-3 py-2 text-xs text-surface-500">{row.rowNumber}</td>
                            <td className="px-3 py-2 font-mono text-xs">{row.data.admissionNumber || "—"}</td>
                            <td className="px-3 py-2">{`${row.data.firstName || ""} ${row.data.lastName || ""}`}</td>
                            <td className="px-3 py-2 text-xs">
                              {row.enrollmentInfo?.classInstanceName || row.data.className || "—"}
                            </td>
                            <td className="px-3 py-2 text-xs">{guardianLabel(row)}</td>
                            <td className="px-3 py-2 text-xs">{guardianPhone(row)}</td>
                            <td className="px-3 py-2">
                              <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
                            </td>
                            <td className="px-3 py-2">
                              {row.errors?.length > 0 || row.warnings?.length > 0 ? (
                                expandedRow === idx ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                              ) : null}
                            </td>
                          </tr>
                          {expandedRow === idx && (row.errors?.length > 0 || row.warnings?.length > 0 || row.guardianInfo) && (
                            <tr key={`exp-${idx}`}>
                              <td colSpan={8} className="px-6 py-3 bg-surface-50">
                                <div className="space-y-2 text-xs">
                                  {row.guardianInfo && (
                                    <div className="flex gap-4">
                                      <span className="font-medium text-surface-700">Guardian:</span>
                                      <span>{row.guardianInfo.firstName} {row.guardianInfo.lastName}</span>
                                      <span className="text-surface-500">|</span>
                                      <span>{row.guardianInfo.phone}</span>
                                      {row.guardianInfo.email && (
                                        <><span className="text-surface-500">|</span><span>{row.guardianInfo.email}</span></>
                                      )}
                                      <Badge variant={row.guardianInfo.isExisting ? "info" : "warning"}>
                                        {row.guardianInfo.isExisting ? "Existing" : "New"}
                                      </Badge>
                                    </div>
                                  )}
                                  {row.errors?.map((e, i) => (
                                    <div key={i} className="flex items-center gap-2 text-danger-600">
                                      <AlertCircle size={12} /> {e.message}
                                      {e.suggestedFix && <span className="text-surface-500">— {e.suggestedFix}</span>}
                                    </div>
                                  ))}
                                  {row.warnings?.map((w, i) => (
                                    <div key={i} className="flex items-center gap-2 text-warning-600">
                                      <AlertTriangle size={12} /> {w.message}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                  {previewRows.length > 200 && (
                    <div className="p-4 text-center text-sm text-surface-500">
                      Showing 200 of {previewRows.length} rows
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={reset}>
              <X size={16} className="mr-2" /> Cancel
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={createErrorReport}>
                <Download size={16} className="mr-2" /> Error Report
              </Button>
              <Button onClick={confirmImport} loading={loading} disabled={previewSummary.validStudents === 0}>
                <Database size={16} className="mr-2" /> Confirm Import ({previewSummary.studentsToImport} students)
              </Button>
            </div>
          </div>
        </>
      )}

      {stage === "importing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} /> Importing Records
              <Badge variant="warning">Processing...</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderProgressBar()}
          </CardContent>
        </Card>
      )}

      {stage === "completed" && success && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600 mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-semibold text-success-700 mb-2">Import Complete!</h3>
            <p className="text-sm text-surface-600 mb-6">
              All records have been imported successfully.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={reset}>
                Import Another File
              </Button>
              <Button onClick={() => navigate("/students")}>
                View Students
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon, color }: {
  label: string
  value: number
  icon: React.ReactNode
  color?: string
}) {
  return (
    <div className="p-3 rounded-lg border border-surface-200 bg-white">
      <div className={`flex items-center gap-1.5 mb-1 ${color || "text-surface-600"}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-semibold text-surface-900">{value}</p>
    </div>
  )
}
