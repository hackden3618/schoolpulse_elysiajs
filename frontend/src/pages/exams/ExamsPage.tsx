import { useState, useEffect, type FormEvent } from "react"
import { Plus, Search, Loader2, RefreshCw, X, Check, Eye, EyeOff, BookOpen, GraduationCap, FileSpreadsheet } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent, CardHeader } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { Table } from "../../components/ui/Table"
import { EmptyState } from "../../components/ui/EmptyState"
import { examsApi, assessmentsApi, academicApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { Exam, Assessment, AssessmentResult, Term, ClassInstance, Subject } from "../../types"

type View = "list" | "detail" | "results"

const MIN_LOAD_MS = 500

export function ExamsPage() {
  const { school } = useAuth()
  const schoolId = school!.id
  const [view, setView] = useState<View>("list")
  const [exams, setExams] = useState<Exam[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [classInstances, setClassInstances] = useState<ClassInstance[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [termFilter, setTermFilter] = useState("")

  /* create exam form */
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("cat")
  const [formTermId, setFormTermId] = useState("")
  const [formStartDate, setFormStartDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [saving, setSaving] = useState(false)

  /* create assessment form */
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [assessClassId, setAssessClassId] = useState("")
  const [assessSubjectId, setAssessSubjectId] = useState("")
  const [assessTotalMarks, setAssessTotalMarks] = useState("100")

  /* results entry */
  const [results, setResults] = useState<Record<string, string>>({})
  const [publishing, setPublishing] = useState(false)

  const load = async () => {
    const start = Date.now()
    setLoading(true)
    setError("")
    try {
      const filter = termFilter ? { termId: termFilter } : undefined
      const [examsRes, termsRes, clsRes, subRes] = await Promise.all([
        examsApi.list(schoolId, filter?.termId),
        academicApi.terms.list(schoolId),
        academicApi.classInstances.list(schoolId),
        academicApi.subjects.list(schoolId),
      ])
      setExams(examsRes.data)
      setTerms(termsRes.data)
      setClassInstances(clsRes.data)
      setSubjects(subRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exams")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId, termFilter])

  const handleCreateExam = async (e: FormEvent) => {
    e.preventDefault()
    if (!formName || !formTermId || !formStartDate || !formEndDate) return
    const start = Date.now()
    setSaving(true)
    try {
      await examsApi.create(schoolId, {
        name: formName,
        type: formType as any,
        termId: formTermId,
        startDate: formStartDate,
        endDate: formEndDate,
      })
      setShowForm(false)
      setFormName(""); setFormType("cat"); setFormTermId(""); setFormStartDate(""); setFormEndDate("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create exam")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  const openExam = async (exam: Exam) => {
    const start = Date.now()
    setLoading(true)
    try {
      const res = await examsApi.get(schoolId, exam.id)
      setSelectedExam(res.data)
      setView("detail")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exam")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  const handleCreateAssessment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedExam || !assessClassId || !assessSubjectId) return
    const start = Date.now()
    setSaving(true)
    try {
      await assessmentsApi.create(schoolId, {
        examId: selectedExam.id,
        classInstanceId: assessClassId,
        subjectId: assessSubjectId,
        totalMarks: Number(assessTotalMarks),
      })
      setShowAssessmentForm(false)
      setAssessClassId(""); setAssessSubjectId(""); setAssessTotalMarks("100")
      const res = await examsApi.get(schoolId, selectedExam.id)
      setSelectedExam(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create assessment")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  const openResults = async (assessment: Assessment) => {
    const start = Date.now()
    setLoading(true)
    try {
      const res = await assessmentsApi.get(schoolId, assessment.id)
      setSelectedAssessment(res.data)
      const initial: Record<string, string> = {}
      res.data.results.forEach((r) => { initial[r.studentId] = r.attainedMarks.toString() })
      setResults(initial)
      setView("results")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assessment")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  const handleSaveResults = async () => {
    if (!selectedAssessment) return
    const start = Date.now()
    setSaving(true)
    try {
      const data = Object.entries(results).map(([studentId, attainedMarks]) => ({
        studentId,
        attainedMarks: Number(attainedMarks) || 0,
      }))
      await assessmentsApi.saveResults(schoolId, selectedAssessment.id, data)
      const res = await assessmentsApi.get(schoolId, selectedAssessment.id)
      setSelectedAssessment(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save results")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!selectedExam) return
    const start = Date.now()
    setPublishing(true)
    try {
      await examsApi.publish(schoolId, selectedExam.id)
      const res = await examsApi.get(schoolId, selectedExam.id)
      setSelectedExam(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish exam")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setPublishing(false)
    }
  }

  const handlePublishAssessment = async (assessmentId: string) => {
    const start = Date.now()
    try {
      await assessmentsApi.publish(schoolId, assessmentId)
      if (selectedExam) {
        const res = await examsApi.get(schoolId, selectedExam.id)
        setSelectedExam(res.data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
    }
  }

  const resetView = () => {
    setView("list")
    setSelectedExam(null)
    setSelectedAssessment(null)
    setResults({})
    setShowAssessmentForm(false)
  }

  const filtered = exams.filter((e) => {
    if (!search) return true
    return e.name.toLowerCase().includes(search.toLowerCase())
  })

  /* ── Results Entry View ── */
  if (view === "results" && selectedAssessment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${selectedAssessment.subject?.name || "Subject"} Results`}
          description={`${selectedAssessment.exam?.name || "Exam"} · ${selectedAssessment.totalMarks} marks`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSaveResults} disabled={saving}>
                {saving ? "Saving..." : "Save Results"}
              </Button>
              <Button variant="secondary" onClick={() => { setView("detail"); setSelectedAssessment(null) }}>
                <X size={14} /> Back
              </Button>
            </div>
          }
        />

        {error && <ErrorBanner message={error} onRetry={() => openResults(selectedAssessment)} />}

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border-b border-surface-100 bg-surface-50/30">
              {selectedAssessment.results.map((r) => (
                <div key={r.studentId} className="flex items-center gap-3 rounded-lg bg-white border border-surface-200 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">
                      {r.student?.firstName} {r.student?.lastName}
                    </p>
                    <p className="text-[10px] text-surface-400">{r.student?.admissionNumber}</p>
                  </div>
                  <Input
                    type="number"
                    value={results[r.studentId] || ""}
                    onChange={(e) => setResults({ ...results, [r.studentId]: e.target.value })}
                    className="w-20 text-center font-bold"
                    min={0}
                    max={selectedAssessment.totalMarks}
                  />
                  <span className="text-xs text-surface-400">/{selectedAssessment.totalMarks}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ── Exam Detail View ── */
  if (view === "detail" && selectedExam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={selectedExam.name}
          description={`${selectedExam.type.replace("_", " ")} · ${selectedExam.term?.name || ""} · ${new Date(selectedExam.startDate).toLocaleDateString()} — ${new Date(selectedExam.endDate).toLocaleDateString()}`}
          actions={
            <div className="flex gap-2">
              {!selectedExam.published && (
                <Button onClick={handlePublish} disabled={publishing}>
                  {publishing ? "Publishing..." : <><Eye size={14} /> Publish</>}
                </Button>
              )}
              {selectedExam.published && <Badge variant="success">Published</Badge>}
              <Button variant="secondary" onClick={() => setShowAssessmentForm(!showAssessmentForm)}>
                <Plus size={14} /> Add Assessment
              </Button>
              <Button variant="secondary" onClick={resetView}>
                <X size={14} /> Back
              </Button>
            </div>
          }
        />

        {error && <ErrorBanner message={error} onRetry={() => openExam(selectedExam)} />}

        {showAssessmentForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleCreateAssessment} className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-surface-700">Class</label>
                  <select value={assessClassId} onChange={(e) => setAssessClassId(e.target.value)}
                    className="block rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select class...</option>
                    {classInstances.map((ci) => (
                      <option key={ci.id} value={ci.id}>{ci.class?.name} — {ci.streamName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-surface-700">Subject</label>
                  <select value={assessSubjectId} onChange={(e) => setAssessSubjectId(e.target.value)}
                    className="block rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select subject...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <Input label="Total Marks" type="number" value={assessTotalMarks} onChange={(e) => setAssessTotalMarks(e.target.value)} className="w-24" />
                <div className="flex gap-2 pb-1">
                  <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => setShowAssessmentForm(false)}><X size={14} /></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-surface-900">Assessments</h3>
          </CardHeader>
          <CardContent className="p-0">
            {(!selectedExam.assessments || selectedExam.assessments.length === 0) ? (
              <EmptyState title="No assessments" description="Add assessments to this exam." />
            ) : (
              <Table
                columns={[
                  { key: "subject", header: "Subject", render: (a: Assessment) => (
                    <span className="font-medium">{a.subject?.name || "—"}</span>
                  )},
                  { key: "class", header: "Class", render: (a: Assessment) => (
                    <span>{a.classInstance?.class?.name} {a.classInstance?.streamName || ""}</span>
                  )},
                  { key: "marks", header: "Total Marks", render: (a: Assessment) => a.totalMarks },
                  { key: "results", header: "Results", render: (a: Assessment) => `${a.results?.length || 0} students` },
                  { key: "status", header: "Status", render: (a: Assessment) => (
                    a.results?.some((r) => r.published) ? <Badge variant="success">Published</Badge> : <Badge variant="warning">Draft</Badge>
                  )},
                  { key: "actions", header: "", render: (a: Assessment) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openResults(a)}>
                        <FileSpreadsheet size={12} /> Marks
                      </Button>
                      {!a.results?.some((r) => r.published) && a.results?.length > 0 && (
                        <Button size="sm" variant="secondary" onClick={() => handlePublishAssessment(a.id)}>
                          <Eye size={12} /> Publish
                        </Button>
                      )}
                    </div>
                  )},
                ]}
                data={selectedExam.assessments || []}
              />
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ── Exam List View ── */
  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Create and manage exams, assessments, and results."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Exam
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreateExam} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input label="Exam Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. End Term Exam" />
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="cat">CAT</option>
                  <option value="midterm">Midterm</option>
                  <option value="endterm">End Term</option>
                  <option value="mock">Mock</option>
                  <option value="opener">Opener</option>
                  <option value="continuous_assessment">Continuous Assessment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-surface-700">Term</label>
                <select value={formTermId} onChange={(e) => setFormTermId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select term...</option>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <Input label="Start Date" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              <div className="flex gap-2 items-end pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Creating..." : "Save"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b border-surface-100">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="text" placeholder="Search exams..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-2 text-sm" />
            </div>
            <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm">
              <option value="">All terms</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary-400" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No exams found" description="Create your first examination to get started."
              action={search ? undefined : { label: "New Exam", onClick: () => setShowForm(true) }} />
          ) : (
            <Table
              columns={[
                { key: "name", header: "Exam", render: (e: Exam) => (
                  <button onClick={() => openExam(e)} className="font-medium text-accent hover:underline text-left">
                    {e.name}
                  </button>
                )},
                { key: "type", header: "Type", render: (e: Exam) => (
                  <span className="capitalize">{e.type.replace(/_/g, " ")}</span>
                )},
                { key: "term", header: "Term", render: (e: Exam) => e.term?.name || "—" },
                { key: "assessments", header: "Assessments", render: (e: Exam) => e.assessments?.length || 0 },
                { key: "dates", header: "Dates", render: (e: Exam) => (
                  <span className="text-xs">{new Date(e.startDate).toLocaleDateString()} — {new Date(e.endDate).toLocaleDateString()}</span>
                )},
                { key: "status", header: "Status", render: (e: Exam) => (
                  e.published ? <Badge variant="success">Published</Badge> : e.completed ? <Badge variant="info">Completed</Badge> : <Badge variant="warning">Draft</Badge>
                )},
              ]}
              data={filtered}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
