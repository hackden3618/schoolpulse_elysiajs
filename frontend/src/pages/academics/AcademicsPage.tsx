import { useState, useEffect, type FormEvent } from "react"
import { Plus, Check, X, BookOpen, CalendarDays, Layers, GraduationCap } from "lucide-react"
import { academicApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { TableSkeleton } from "../../components/ui/Skeleton"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import { EmptyState } from "../../components/ui/EmptyState"
import type { AcademicYear, Term, Class, ClassInstance, Subject } from "../../types"

type Tab = "years" | "terms" | "classes" | "subjects"

interface ModalState<T> {
  open: boolean
  data: T | null
}

const MIN_LOAD_MS = 500

/* ───────────────────────────────────────────────
   Academic Years Tab
   ─────────────────────────────────────────────── */
function AcademicYearsSection({ schoolId, activeYearId: _ }: { schoolId: string; activeYearId?: string }) {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const start = Date.now()
    setLoading(true)
    setError("")
    try {
      const res = await academicApi.years.list(schoolId)
      setYears(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load academic years")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !startDate || !endDate) return
    const start = Date.now()
    setSaving(true)
    try {
      await academicApi.years.create(schoolId, { name, startDate, endDate })
      setShowForm(false)
      setName(""); setStartDate(""); setEndDate("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    const start = Date.now()
    setLoading(true)
    try {
      await academicApi.years.activate(schoolId, id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to activate")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  if (loading) return <TableSkeleton rows={3} cols={4} />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-700">All Academic Years</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> New Year
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <Input label="Year Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026" className="flex-1" />
              <Input label="Start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="End" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <div className="flex gap-2 pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {years.length === 0 ? (
        <EmptyState title="No academic years" description="Create your first academic year to get started." />
      ) : (
        <div className="space-y-2">
          {years.map((y) => (
            <div key={y.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <CalendarDays size={16} className="text-primary-400" />
                <div>
                  <p className="text-sm font-semibold text-primary-900">{y.name}</p>
                  <p className="text-xs text-primary-400">{new Date(y.startDate).toLocaleDateString()} — {new Date(y.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {y.active ? (
                  <Badge variant="success">
                    <Check size={10} className="mr-1" /> Active
                  </Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => handleActivate(y.id)}>
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────
   Terms Tab
   ─────────────────────────────────────────────── */
function TermsSection({ schoolId }: { schoolId: string }) {
  const [terms, setTerms] = useState<Term[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [academicYearId, setAcademicYearId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const start = Date.now()
    setLoading(true)
    setError("")
    try {
      const [termsRes, yearsRes] = await Promise.all([
        academicApi.terms.list(schoolId),
        academicApi.years.list(schoolId),
      ])
      setTerms(termsRes.data)
      setYears(yearsRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load terms")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !academicYearId || !startDate || !endDate) return
    const start = Date.now()
    setSaving(true)
    try {
      await academicApi.terms.create(schoolId, { name, academicYearId, startDate, endDate })
      setShowForm(false)
      setName(""); setAcademicYearId(""); setStartDate(""); setEndDate("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    const start = Date.now()
    setLoading(true)
    try {
      await academicApi.terms.activate(schoolId, id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to activate")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  if (loading) return <TableSkeleton rows={3} cols={4} />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-700">All Terms</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> New Term
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Input label="Term Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Term 1" />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Academic Year</label>
                <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="">Select year...</option>
                  {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <Input label="Start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="End" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <div className="flex gap-2 pb-1 items-end">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {terms.length === 0 ? (
        <EmptyState title="No terms" description="Create terms linked to an academic year." />
      ) : (
        <div className="space-y-2">
          {terms.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="text-primary-400" />
                <div>
                  <p className="text-sm font-semibold text-primary-900">{t.name}</p>
                  <p className="text-xs text-primary-400">{new Date(t.startDate).toLocaleDateString()} — {new Date(t.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {t.active ? (
                  <Badge variant="success"><Check size={10} className="mr-1" /> Active</Badge>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => handleActivate(t.id)}>Activate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────
   Classes & Streams Tab
   ─────────────────────────────────────────────── */
function ClassesSection({ schoolId }: { schoolId: string }) {
  const [classes, setClasses] = useState<Class[]>([])
  const [instances, setInstances] = useState<ClassInstance[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showClassForm, setShowClassForm] = useState(false)
  const [showStreamForm, setShowStreamForm] = useState(false)
  const [className, setClassName] = useState("")
  const [classLevel, setClassLevel] = useState(1)
  const [streamClassId, setStreamClassId] = useState("")
  const [streamName, setStreamName] = useState("")
  const [streamYearId, setStreamYearId] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const start = Date.now()
    setLoading(true)
    setError("")
    try {
      const [classesRes, instancesRes, yearsRes] = await Promise.all([
        academicApi.classes.list(schoolId),
        academicApi.classInstances.list(schoolId),
        academicApi.years.list(schoolId),
      ])
      setClasses(classesRes.data)
      setInstances(instancesRes.data)
      setYears(yearsRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load classes")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId])

  const handleCreateClass = async (e: FormEvent) => {
    e.preventDefault()
    if (!className) return
    const start = Date.now()
    setSaving(true)
    try {
      await academicApi.classes.create(schoolId, { name: className, level: classLevel })
      setShowClassForm(false)
      setClassName(""); setClassLevel(1)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create class")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  const handleCreateStream = async (e: FormEvent) => {
    e.preventDefault()
    if (!streamClassId || !streamName || !streamYearId) return
    const start = Date.now()
    setSaving(true)
    try {
      await academicApi.classInstances.create(schoolId, { classId: streamClassId, streamName, academicYearId: streamYearId })
      setShowStreamForm(false)
      setStreamClassId(""); setStreamName(""); setStreamYearId("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create stream")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-6">
      {/* Classes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary-700">Classes</h3>
          <Button size="sm" onClick={() => setShowClassForm(!showClassForm)}><Plus size={14} /> New Class</Button>
        </div>

        {showClassForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleCreateClass} className="flex items-end gap-3">
                <Input label="Class Name" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Grade 8" />
                <Input label="Level" type="number" value={classLevel} onChange={(e) => setClassLevel(Number(e.target.value))} min={1} max={16} className="w-24" />
                <div className="flex gap-2 pb-1">
                  <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => setShowClassForm(false)}><X size={14} /></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {classes.length === 0 ? (
          <EmptyState title="No classes" description="Define classes for your school." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classes.map((c) => {
              const streamCount = instances.filter((i) => i.classId === c.id).length
              return (
                <div key={c.id} className="rounded-lg border border-surface-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primary-900">{c.name}</p>
                    <Badge variant="info">{streamCount} stream{streamCount !== 1 ? "s" : ""}</Badge>
                  </div>
                  <p className="text-xs text-primary-400 mt-1">Level {c.level}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Streams */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary-700">Streams (Class Instances)</h3>
          <Button size="sm" onClick={() => setShowStreamForm(!showStreamForm)}><Plus size={14} /> New Stream</Button>
        </div>

        {showStreamForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleCreateStream} className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-surface-700">Class</label>
                  <select value={streamClassId} onChange={(e) => setStreamClassId(e.target.value)}
                    className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select class...</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Input label="Stream Name" value={streamName} onChange={(e) => setStreamName(e.target.value)} placeholder="e.g. East" />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-surface-700">Academic Year</label>
                  <select value={streamYearId} onChange={(e) => setStreamYearId(e.target.value)}
                    className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select year...</option>
                    {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pb-1">
                  <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => setShowStreamForm(false)}><X size={14} /></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {instances.length === 0 ? (
          <EmptyState title="No streams" description="Create streams for each class and academic year." />
        ) : (
          <div className="space-y-2">
            {instances.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-primary-400" />
                  <div>
                    <p className="text-sm font-semibold text-primary-900">{inst.class?.name} — {inst.streamName}</p>
                    <p className="text-xs text-primary-400">{inst.academicYear?.name || "N/A"}</p>
                  </div>
                </div>
                {inst.isCurrent && <Badge variant="success">Current</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────
   Subjects Tab
   ─────────────────────────────────────────────── */
function SubjectsSection({ schoolId }: { schoolId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [compulsory, setCompulsory] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const start = Date.now()
    setLoading(true)
    setError("")
    try {
      const res = await academicApi.subjects.list(schoolId)
      setSubjects(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subjects")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !code) return
    const start = Date.now()
    setSaving(true)
    try {
      await academicApi.subjects.create(schoolId, { name, code, isCompulsory: compulsory })
      setShowForm(false)
      setName(""); setCode(""); setCompulsory(true)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create")
    } finally {
      const elapsed = Date.now() - start
      const remaining = MIN_LOAD_MS - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
      setSaving(false)
    }
  }

  if (loading) return <TableSkeleton rows={4} cols={3} />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-700">All Subjects</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> New Subject</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <Input label="Subject Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
              <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MAT" className="w-24" />
              <div className="flex items-center gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm text-surface-700">
                  <input type="checkbox" checked={compulsory} onChange={(e) => setCompulsory(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-accent focus:ring-accent" />
                  Compulsory
                </label>
              </div>
              <div className="flex gap-2 pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 ? (
        <EmptyState title="No subjects" description="Add subjects offered at your school." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-lg border border-surface-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-primary-900">{s.name}</p>
                {s.isCompulsory && <Badge variant="info">Required</Badge>}
              </div>
              <p className="font-mono text-xs text-primary-400 mt-1">{s.code}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────
   Main Academics Page
   ─────────────────────────────────────────────── */
export function AcademicsPage() {
  const { school } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("years")

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "years", label: "Academic Years", icon: <CalendarDays size={14} /> },
    { key: "terms", label: "Terms", icon: <BookOpen size={14} /> },
    { key: "classes", label: "Classes & Streams", icon: <Layers size={14} /> },
    { key: "subjects", label: "Subjects", icon: <GraduationCap size={14} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        description="Manage academic years, terms, classes, streams, and subjects."
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-primary-50 p-1 border border-primary-100 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-primary-900 shadow-sm"
                : "text-primary-500 hover:text-primary-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          {activeTab === "years" && <AcademicYearsSection schoolId={school!.id} />}
          {activeTab === "terms" && <TermsSection schoolId={school!.id} />}
          {activeTab === "classes" && <ClassesSection schoolId={school!.id} />}
          {activeTab === "subjects" && <SubjectsSection schoolId={school!.id} />}
        </CardContent>
      </Card>
    </div>
  )
}
