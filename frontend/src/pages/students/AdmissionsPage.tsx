import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Plus, Minus, RefreshCw, Clock, Users, Database, FileSpreadsheet, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { studentsApi, importApi } from "../../lib/api"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"

interface LocalPreviewData {
  summary: {
    totalRows: number
    validRows: number
    warningRows: number
    errorRows: number
    duplicateRows: number
  }
  rows: Array<{
    rowNumber: number
    status: string
    firstName: string
    lastName: string
    admissionNumber: string
    guardianName?: string
    className?: string
  }>
  errors: Array<{ rowNumber: number; message: string }>
}

export function AdmissionsPage() {
  const navigate = useNavigate()
  const { school } = useAuth()
  const [activeTab, setActiveTab] = useState("single")
  const [uploadStage, setUploadStage] = useState("idle")
  const [uploadProgress, setUploadProgress] = useState({
    stage: "idle",
    progress: 0,
    current: 0,
    total: 0,
    estimatedTimeRemaining: null,
    message: "",
  })
  const [error, setError] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<LocalPreviewData | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState({
    filename: "",
    size: 0,
    type: "",
    content: "",
  })
  const [strategy, setStrategy] = useState("skip")
  const [batchSize, setBatchSize] = useState(100)
  const [singleStudentForm, setSingleStudentForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    admissionNumber: "",
    dateOfBirth: "",
    gender: "",
    enrollmentRequired: true,
    classInstanceId: "",
    guardians: [{ firstName: "", lastName: "", phone: "", email: "", relationship: "legal_guardian" }],
    specialNeeds: [] as Array<{ category: string; details: string }>,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!school) {
      navigate("/auth/login")
      return
    }

    if (uploadStage === "uploading") {
      establishWebSocketConnection()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [uploadStage, school])

  const establishWebSocketConnection = () => {
    if (!school) return

    const ws = new WebSocket(`${window.location.origin.replace(/https:/, "ws:/")}/api/v1/ws/admissions/${school.id}`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "progress_update") {
          setUploadProgress(prev => ({
            ...prev,
            stage: data.stage,
            progress: data.progress,
            current: data.current,
            total: data.total,
            estimatedTimeRemaining: data.estimatedTimeRemaining,
            message: data.message,
          }))
        } else if (data.type === "upload_complete") {
          setUploadProgress(prev => ({ ...prev, stage: "preview" }))
          fetchPreview()
        } else if (data.type === "preview_complete") {
          setPreviewData(data.preview)
        } else if (data.type === "error") {
          setError(data.message)
          setUploadProgress(prev => ({ ...prev, stage: "error" }))
        }
      } catch (err) {
        setError("Failed to process WebSocket message")
      }
    }

    ws.onerror = () => {
      setError("WebSocket connection error")
      setUploadProgress(prev => ({ ...prev, stage: "error" }))
    }

    ws.onclose = () => {
      if (uploadProgress.stage !== "complete" && uploadProgress.stage !== "error") {
        setError("WebSocket disconnected")
      }
      wsRef.current = null
    }

    wsRef.current = ws
  }

  const createImportSession = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await withMinDelay(
        importApi.sessions.create(school!.id, {
          fileName: file?.name || "",
          fileSize: file?.size || 0,
          fileType: (file?.type.includes("csv") ? "csv" : file?.type.includes("excel") ? "xlsx" : "xls") as "csv" | "xls" | "xlsx",
          strategy,
          batchSize,
        })
      )

      setSessionId(res.data.sessionId)
      setUploadStage("uploading")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create import session")
    } finally {
      setLoading(false)
    }
  }

  const fetchPreview = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      const res = await withMinDelay(
        importApi.sessions.preview.get(school!.id, sessionId)
      )
      const raw: any = res.data
      setPreviewData({
        summary: {
          totalRows: raw.summary.totalRows ?? 0,
          validRows: raw.summary.validStudents ?? raw.summary.validRows ?? 0,
          warningRows: raw.summary.warnings ?? raw.summary.warningRows ?? 0,
          errorRows: raw.summary.errors ?? raw.summary.errorRows ?? 0,
          duplicateRows: raw.summary.duplicateGuardians ?? raw.summary.duplicateRows ?? 0,
        },
        rows: (raw.rows ?? []).map((r: any) => ({
          rowNumber: r.rowNumber,
          status: r.status,
          firstName: r.data?.firstName ?? "",
          lastName: r.data?.lastName ?? "",
          admissionNumber: r.data?.admissionNumber ?? "",
          guardianName: r.guardianInfo ? `${r.guardianInfo.firstName} ${r.guardianInfo.lastName}` : undefined,
          className: r.enrollmentInfo?.classInstanceName,
        })),
        errors: (raw.rows ?? []).flatMap((r: any) =>
          (r.errors ?? []).map((e: any) => ({ rowNumber: r.rowNumber, message: e.message }))
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch preview")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file || !sessionId) return

    setUploadStage("uploading")
    setLoading(true)
    setError("")

    try {
      await withMinDelay(
        importApi.sessions.upload.file(school!.id, sessionId, file)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file")
      setUploadStage("error")
    } finally {
      setLoading(false)
    }
  }

  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!singleStudentForm.firstName || !singleStudentForm.lastName || !singleStudentForm.admissionNumber) {
      setError("First name, last name, and admission number are required")
      return
    }

    const invalidGuardian = singleStudentForm.guardians.find(g => !g.firstName || !g.lastName || !g.phone)
    if (invalidGuardian) {
      setError("All guardians must have a first name, last name, and phone number")
      return
    }

    setLoading(true)

    try {
      const gender = singleStudentForm.gender as "male" | "female" | undefined

      if (singleStudentForm.enrollmentRequired && !singleStudentForm.classInstanceId) {
        throw new Error("Class is required when enrollment is enabled")
      }

      const specialNeeds = singleStudentForm.specialNeeds.length
        ? Object.fromEntries(singleStudentForm.specialNeeds.map(n => [n.category, n.details]))
        : undefined

      const studentData: Parameters<typeof studentsApi.create>[1] = {
        firstName: singleStudentForm.firstName,
        secondName: singleStudentForm.middleName || undefined,
        lastName: singleStudentForm.lastName,
        dateOfBirth: singleStudentForm.dateOfBirth,
        admissionNumber: singleStudentForm.admissionNumber,
        gender: gender || undefined,
        classInstanceId: singleStudentForm.enrollmentRequired ? singleStudentForm.classInstanceId : undefined,
        guardians: singleStudentForm.guardians.map(g => ({
          ...g,
          email: g.email || undefined,
        })),
        specialNeeds,
      }

      await withMinDelay(
        studentsApi.create(school!.id, studentData)
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        navigate("/students")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to admit student")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("File size must be less than 100MB")
        return
      }

      const fileType = selectedFile.type.toLowerCase()
      if (!["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(fileType)) {
        setError("Only CSV (.csv), Excel (.xls, .xlsx) files are supported")
        return
      }

      setFile(selectedFile)
      setFilePreview({
        filename: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        content: "",
      })
      setError("")
    }
  }

  const clearFile = () => {
    setFile(null)
    setFilePreview({
      filename: "",
      size: 0,
      type: "",
      content: "",
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const addGuardian = () => {
    setSingleStudentForm(prev => ({
      ...prev,
      guardians: [...prev.guardians, { firstName: "", lastName: "", phone: "", email: "", relationship: "legal_guardian" }],
    }))
  }

  const removeGuardian = (index: number) => {
    setSingleStudentForm(prev => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }))
  }

  const addSpecialNeed = () => {
    setSingleStudentForm(prev => ({
      ...prev,
      specialNeeds: [...prev.specialNeeds, { category: "Medical Condition", details: "" }],
    }))
  }

  const removeSpecialNeed = (index: number) => {
    setSingleStudentForm(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((_, i) => i !== index),
    }))
  }

  const updateGuardian = (index: number, field: string, value: string) => {
    setSingleStudentForm(prev => ({
      ...prev,
      guardians: prev.guardians.map((guardian, i) =>
        i === index ? { ...guardian, [field]: value } : guardian
      ),
    }))
  }

  const updateSpecialNeed = (index: number, field: string, value: string) => {
    setSingleStudentForm(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.map((need, i) =>
        i === index ? { ...need, [field]: value } : need
      ),
    }))
  }

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "valid": return "success"
      case "warning": return "warning"
      case "error": return "danger"
      case "skipped": return "default"
      default: return "default"
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        description="Admit individual students or process bulk admissions from Excel/CSV files."
        actions={
          <Button variant="secondary" onClick={() => navigate("/students")}>
            <X size={16} /> Back to Students
          </Button>
        }
      />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "single" ? "bg-accent text-white" : "bg-surface-100 text-surface-700 hover:bg-surface-200"}`}
        >
          <UserPlus size={16} className="inline mr-2" /> Admit Single Student
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "bulk" ? "bg-accent text-white" : "bg-surface-100 text-surface-700 hover:bg-surface-200"}`}
        >
          <FileSpreadsheet size={16} className="inline mr-2" /> Bulk Import
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-success-50 border border-success-100 text-success-700">
          <CheckCircle size={20} /> <span>Student admitted successfully!</span>
        </div>
      )}

      {activeTab === "single" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={20} /> Single Student Admission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleStudentSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="First Name *"
                    value={singleStudentForm.firstName}
                    onChange={e => setSingleStudentForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="e.g. Aisha"
                  />
                  <Input
                    label="Middle Name"
                    value={singleStudentForm.middleName}
                    onChange={e => setSingleStudentForm(prev => ({ ...prev, middleName: e.target.value }))}
                    placeholder="Optional"
                  />
                  <Input
                    label="Last Name *"
                    value={singleStudentForm.lastName}
                    onChange={e => setSingleStudentForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="e.g. Wanjiku"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Admission Number *"
                    value={singleStudentForm.admissionNumber}
                    onChange={e => setSingleStudentForm(prev => ({ ...prev, admissionNumber: e.target.value }))}
                    placeholder="e.g. ADM/2024/001"
                  />
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      value={singleStudentForm.dateOfBirth}
                      onChange={e => setSingleStudentForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Gender *</label>
                    <select
                      value={singleStudentForm.gender}
                      onChange={e => setSingleStudentForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-surface-900">Guardians</h3>
                    <Button type="button" size="sm" variant="secondary" onClick={addGuardian}>
                      <Plus size={14} /> Add Guardian
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {singleStudentForm.guardians.map((guardian, index) => (
                      <div key={index} className="p-4 rounded-lg border border-surface-200 bg-surface-50 relative">
                        {index === 0 && <span className="text-xs font-medium text-accent absolute top-2 right-2">Primary</span>}
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-surface-700">Guardian {index + 1}</h4>
                          {singleStudentForm.guardians.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGuardian(index)}
                              className="text-surface-400 hover:text-danger-500"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            label="First Name *"
                            value={guardian.firstName}
                            onChange={e => updateGuardian(index, "firstName", e.target.value)}
                          />
                          <Input
                            label="Last Name *"
                            value={guardian.lastName}
                            onChange={e => updateGuardian(index, "lastName", e.target.value)}
                          />
                          <Input
                            label="Phone Number *"
                            value={guardian.phone}
                            onChange={e => updateGuardian(index, "phone", e.target.value)}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={guardian.email}
                            onChange={e => updateGuardian(index, "email", e.target.value)}
                          />
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-surface-600 mb-1">Relationship *</label>
                            <select
                              value={guardian.relationship}
                              onChange={e => updateGuardian(index, "relationship", e.target.value)}
                              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                              <option value="legal_guardian">Legal Guardian</option>
                              <option value="father">Father</option>
                              <option value="mother">Mother</option>
                              <option value="relative">Relative</option>
                              <option value="sponsor">Sponsor</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-surface-900">Special Needs</h3>
                    <Button type="button" size="sm" variant="secondary" onClick={addSpecialNeed}>
                      <Plus size={14} /> Add Special Need
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {singleStudentForm.specialNeeds.map((need, index) => (
                      <div key={index} className="flex gap-3 p-3 rounded-lg bg-surface-50 border border-surface-100">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-surface-600 mb-1">Category</label>
                          <select
                            value={need.category}
                            onChange={e => updateSpecialNeed(index, "category", e.target.value)}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          >
                            <option value="Medical Condition">Medical Condition</option>
                            <option value="Dietary Restriction">Dietary Restriction</option>
                            <option value="Physical Disability">Physical Disability</option>
                            <option value="Learning Support">Learning Support</option>
                            <option value="Allergy">Allergy</option>
                            <option value="Medication">Medication</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-surface-600 mb-1">Details</label>
                          <textarea
                            value={need.details}
                            onChange={e => updateSpecialNeed(index, "details", e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder-surface-400 resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="Describe the condition or requirement..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSpecialNeed(index)}
                          className="text-surface-400 hover:text-danger-500 mt-8"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-surface-200">
                  <Button type="button" variant="secondary" onClick={() => navigate("/students")} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading}>
                    <UserPlus size={16} className="inline mr-2" /> Admit Student
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {uploadStage === "idle" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload size={20} /> Upload Student Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">File Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        onClick={() => setFilePreview({ ...filePreview, type: "text/csv" })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filePreview.type === "text/csv" ? "border-accent bg-accent/5" : "border-surface-200 hover:border-surface-300"}`}
                      >
                        <FileText size={24} className="text-success-500 mb-2" />
                        <h3 className="font-medium text-surface-900">CSV File</h3>
                        <p className="text-xs text-surface-500 mt-1">Excel exported as .csv</p>
                        <p className="text-xs text-surface-500 mt-1">Max 100,000 rows</p>
                      </div>
                      <div
                        onClick={() => setFilePreview({ ...filePreview, type: "application/vnd.ms-excel" })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filePreview.type === "application/vnd.ms-excel" ? "border-accent bg-accent/5" : "border-surface-200 hover:border-surface-300"}`}
                      >
                        <FileSpreadsheet size={24} className="text-success-500 mb-2" />
                        <h3 className="font-medium text-surface-900">Excel (.xls)</h3>
                        <p className="text-xs text-surface-500 mt-1">Legacy Excel format</p>
                        <p className="text-xs text-surface-500 mt-1">Max 50,000 rows</p>
                      </div>
                      <div
                        onClick={() => setFilePreview({ ...filePreview, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filePreview.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ? "border-accent bg-accent/5" : "border-surface-200 hover:border-surface-300"}`}
                      >
                        <FileSpreadsheet size={24} className="text-success-500 mb-2" />
                        <h3 className="font-medium text-surface-900">Excel (.xlsx)</h3>
                        <p className="text-xs text-surface-500 mt-1">Modern Excel format</p>
                        <p className="text-xs text-surface-500 mt-1">Max 50,000 rows</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="File Name"
                      value={filePreview.filename}
                      readOnly
                      placeholder="No file selected"
                    />
                    <Input
                      label="File Size"
                      value={filePreview.size ? `${(filePreview.size / 1024 / 1024).toFixed(2)} MB` : "0 MB"}
                      readOnly
                    />
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Strategy</label>
                      <select
                        value={strategy}
                        onChange={e => setStrategy(e.target.value)}
                        className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="skip">Skip Duplicates</option>
                        <option value="replace">Replace All</option>
                        <option value="update">Update Existing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-surface-600 mb-1">Batch Size</label>
                      <select
                        value={batchSize}
                        onChange={e => setBatchSize(Number(e.target.value))}
                        className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value={100}>100 students</option>
                        <option value={500}>500 students</option>
                        <option value={1000}>1,000 students</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                      disabled={!!file}
                    >
                      <Upload size={16} /> Select File
                    </Button>
                    {file && (
                      <Button
                        variant="secondary"
                        onClick={clearFile}
                        className="flex items-center gap-2 ml-2"
                      >
                        <X size={16} /> Clear
                      </Button>
                    )}
                  </div>

                  {file && (
                    <Card className="bg-surface-50 border-surface-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet size={20} className="text-success-500" />
                            <div>
                              <h4 className="font-medium text-surface-900">{file.name}</h4>
                              <p className="text-xs text-surface-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <Badge variant="success">Ready</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database size={20} /> Import Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-surface-600">
                    The bulk import will process your student data with real-time progress tracking. 
                    The system will validate each row, check for duplicates, resolve guardians, and create enrollments.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-success-500" />
                      <span className="text-sm">Validation & Deduplication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-success-500" />
                      <span className="text-sm">Guardian Resolution</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-success-500" />
                      <span className="text-sm">Enrollment Creation</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={createImportSession}
                      disabled={!file || loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Database size={16} />
                      )} Create Import Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : uploadStage === "uploading" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload size={20} /> Importing Students
                    <Badge variant="warning">Processing...</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database size={16} className="text-surface-500" />
                        <span className="text-sm text-surface-600">Upload Stage</span>
                      </div>
                      <span className="text-sm font-medium text-surface-900">{uploadProgress.stage}</span>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-accent">
                            {uploadProgress.progress ? `${uploadProgress.progress}%` : "0%"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-surface-600">
                            {uploadProgress.current ? `/ ${uploadProgress.total}` : "0 / 0"}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-surface-100">
                        <div
                          style={{ width: `${uploadProgress.progress || 0}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent transition-all duration-300"
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-surface-50 border border-surface-200">
                      <div className="flex items-start gap-3">
                        <Clock size={16} className="text-surface-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-surface-700">
                            {uploadProgress.message || "Processing file and validating data..."}
                          </p>
                          {uploadProgress.estimatedTimeRemaining && (
                            <p className="text-xs text-surface-500 mt-1">
                              Estimated time remaining: ~{uploadProgress.estimatedTimeRemaining} minutes
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 text-surface-500">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        <span>Processing data with real-time updates...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : uploadStage === "preview" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye size={20} /> Preview Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {previewData ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-surface-50 border border-surface-100">
                          <h4 className="text-xs font-medium text-surface-600 mb-1">Total Rows</h4>
                          <p className="text-lg font-semibold text-surface-900">{previewData.summary.totalRows}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-success-50 border border-success-100">
                          <h4 className="text-xs font-medium text-success-600 mb-1">Valid Rows</h4>
                          <p className="text-lg font-semibold text-success-700">{previewData.summary.validRows}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-warning-50 border border-warning-100">
                          <h4 className="text-xs font-medium text-warning-600 mb-1">Warnings</h4>
                          <p className="text-lg font-semibold text-warning-700">{previewData.summary.warningRows}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-danger-50 border border-danger-100">
                          <h4 className="text-xs font-medium text-danger-600 mb-1">Errors</h4>
                          <p className="text-lg font-semibold text-danger-700">{previewData.summary.errorRows}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-surface-50 border border-surface-100">
                          <h4 className="text-xs font-medium text-surface-600 mb-1">Duplicates</h4>
                          <p className="text-lg font-semibold text-surface-600">{previewData.summary.duplicateRows}</p>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-surface-50 px-4 py-3 border-b border-surface-100">
                          <h4 className="font-medium text-surface-900">Sample Records</h4>
                        </div>
                        <div className="max-h-96 overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-surface-50 border-b border-surface-100 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-surface-700">Row</th>
                                <th className="px-4 py-3 text-left font-medium text-surface-700">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-surface-700">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-surface-700">Admission No.</th>
                                <th className="px-4 py-3 text-left font-medium text-surface-700">Guardian</th>
                                <th className="px-4 py-3 text-left font-medium text-surface-700">Class</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.rows.map((record, index) => (
                                <tr key={index} className="border-b border-surface-100 hover:bg-surface-50">
                                  <td className="px-4 py-3 text-surface-600">{record.rowNumber}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                                  </td>
                                  <td className="px-4 py-3 font-medium text-surface-900">
                                    {record.firstName} {record.lastName}
                                  </td>
                                  <td className="px-4 py-3 text-surface-600">{record.admissionNumber}</td>
                                  <td className="px-4 py-3 text-surface-600">{record.guardianName || "-"}</td>
                                  <td className="px-4 py-3 text-surface-600">{record.className || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {previewData.errors.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-surface-900">Errors Found</h4>
                          {previewData.errors.map((error, index) => (
                            <div key={index} className="p-3 rounded-lg bg-danger-50 border border-danger-100">
                              <p className="text-sm text-danger-700">
                                <span className="font-medium">Row {error.rowNumber}:</span> {error.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-6">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setUploadStage("idle")
                            clearFile()
                            setSessionId(null)
                            setPreviewData(null)
                          }}
                        >
                          <X size={16} className="mr-2" /> Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            setUploadStage("confirm")
                          }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> Confirm Import
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2 text-surface-500">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        <span>Loading preview...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : uploadStage === "confirm" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle size={20} /> Confirm Import
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-surface-600">
                    Review the import details before starting the actual data import process. This action cannot be undone.
                  </p>

                  <div className="p-4 rounded-lg bg-surface-50 border border-surface-100">
                    <h4 className="font-medium text-surface-900 mb-3">Import Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-surface-600">Strategy:</span>
                        <span className="ml-2 font-medium text-surface-900 capitalize">{strategy}</span>
                      </div>
                      <div>
                        <span className="text-surface-600">Batch Size:</span>
                        <span className="ml-2 font-medium text-surface-900">{batchSize} students</span>
                      </div>
                      <div>
                        <span className="text-surface-600">WebSocket:</span>
                        <span className="ml-2 font-medium text-success-600">Active</span>
                      </div>
                      <div>
                        <span className="text-surface-600">Real-time:</span>
                        <span className="ml-2 font-medium text-success-600">Enabled</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setUploadStage("preview")
                      }}
                    >
                      <Eye size={16} className="mr-2" /> Back to Preview
                    </Button>
                    <Button
                      onClick={() => {
                        setLoading(true)
                        setUploadStage("uploading")
                      }}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Database size={16} />
                      )} Start Import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : uploadStage === "complete" || uploadStage === "error" ? (
            <div className="space-y-6">
              <Card className={`${uploadStage === "complete" ? "bg-success-50 border-success-100" : "bg-danger-50 border-danger-100"}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${uploadStage === "complete" ? "text-success-700" : "text-danger-700"}`}>
                    {uploadStage === "complete" ? (
                      <><CheckCircle size={20} /> Import Complete</>
                    ) : (
                      <><AlertCircle size={20} /> Import Failed</>
                    )}
                    <Badge variant={uploadStage === "complete" ? "success" : "danger"}>{uploadStage}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {uploadStage === "complete" ? (
                    <div className="text-center py-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600 mx-auto mb-4">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-success-700 mb-2">Import Successful!</h3>
                      <p className="text-sm text-success-600 mb-6">
                        All {uploadProgress.total} student records have been imported successfully.
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setUploadStage("idle")
                            clearFile()
                            setSessionId(null)
                            setPreviewData(null)
                            setUploadProgress(prev => ({ ...prev, stage: "idle" }))
                          }}
                        >
                          Upload Another File
                        </Button>
                        <Button onClick={() => navigate("/students")}>
                          View Students
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 text-danger-600 mx-auto mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-danger-700 mb-2">Import Failed</h3>
                      <p className="text-sm text-danger-600 mb-2">{error}</p>
                      <p className="text-xs text-danger-500 mb-6">
                        {uploadProgress.current > 0 ? `Processed ${uploadProgress.current} rows before failure` : "No records were processed"}
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setUploadStage("idle")
                            clearFile()
                            setSessionId(null)
                            setPreviewData(null)
                            setUploadProgress(prev => ({ ...prev, stage: "idle" }))
                          }}
                        >
                          Try Again
                        </Button>
                        <Button variant="secondary" onClick={() => navigate("/students")}>
                          View Students
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
