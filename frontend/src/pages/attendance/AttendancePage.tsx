import { useState, useEffect, type FormEvent } from "react"
import { Plus, Search, Loader2, AlertCircle, RefreshCw, Lock, Check, X } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Table } from "../../components/ui/Table"
import { EmptyState } from "../../components/ui/EmptyState"
import { Input } from "../../components/ui/Input"
import { attendanceApi, academicApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { AttendanceSession, AttendanceRecord, ClassInstance } from "../../types"

const MIN_LOAD_MS = 500

type View = "list" | "detail"

export function AttendancePage() {
  const { school } = useAuth()
  const [view, setView] = useState<View>("list")
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null)
  const [classInstances, setClassInstances] = useState<ClassInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  /* create session form */
  const [showForm, setShowForm] = useState(false)
  const [formClass, setFormClass] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formType, setFormType] = useState<"morning" | "afternoon" | "lesson">("morning")
  const [saving, setSaving] = useState(false)

  /* edit record */
  const [editingRecord, setEditingRecord] = useState<{ recordId: string; status: string; editReason: string } | null>(null)
  const [locking, setLocking] = useState(false)

  const schoolId = school!.id

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const start = Date.now()
      const [sessRes, clsRes] = await Promise.all([
        attendanceApi.listSessions(schoolId),
        academicApi.classInstances.list(schoolId),
        new Promise(r => setTimeout(r, Math.max(0, MIN_LOAD_MS - (Date.now() - start)))),
      ])
      setSessions(sessRes.data)
      setClassInstances(clsRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!formClass || !formDate) return
    setSaving(true)
    try {
      const start = Date.now()
      await Promise.all([
        attendanceApi.createSession(schoolId, {
          classInstanceId: formClass,
          sessionDate: formDate,
          sessionType: formType,
        }),
        new Promise(r => setTimeout(r, Math.max(0, MIN_LOAD_MS - (Date.now() - start)))),
      ])
      setShowForm(false)
      setFormClass("")
      setFormDate(new Date().toISOString().split("T")[0])
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session")
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (session: AttendanceSession) => {
    setLoading(true)
    try {
      const res = await attendanceApi.getSession(schoolId, session.id)
      setSelectedSession(res.data)
      setView("detail")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session")
    } finally {
      setLoading(false)
    }
  }

  const handleEditRecord = async (recordId: string) => {
    if (!editingRecord || !selectedSession) return
    try {
      await attendanceApi.editRecord(schoolId, selectedSession.id, recordId, {
        status: editingRecord.status,
        editReason: editingRecord.editReason,
      })
      setEditingRecord(null)
      const res = await attendanceApi.getSession(schoolId, selectedSession.id)
      setSelectedSession(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update record")
    }
  }

  const handleLock = async () => {
    if (!selectedSession) return
    setLocking(true)
    try {
      const start = Date.now()
      await Promise.all([
        attendanceApi.lockSession(schoolId, selectedSession.id),
        new Promise(r => setTimeout(r, Math.max(0, MIN_LOAD_MS - (Date.now() - start)))),
      ])
      const start2 = Date.now()
      const [res] = await Promise.all([
        attendanceApi.getSession(schoolId, selectedSession.id),
        new Promise(r => setTimeout(r, Math.max(0, MIN_LOAD_MS - (Date.now() - start2)))),
      ])
      setSelectedSession(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to lock session")
    } finally {
      setLocking(false)
    }
  }

  const filtered = sessions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.classInstance?.class?.name?.toLowerCase().includes(q) ||
      s.classInstance?.streamName?.toLowerCase().includes(q) ||
      s.sessionDate.includes(q)
    )
  })

  if (view === "detail" && selectedSession) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${selectedSession.classInstance?.class?.name || "Class"} — ${selectedSession.classInstance?.streamName || ""}`}
          description={`${new Date(selectedSession.sessionDate).toLocaleDateString()} · ${selectedSession.sessionType.replace("_", " ")}`}
          actions={
            <div className="flex gap-2">
              {selectedSession.status === "open" && (
                <>
                  <Button variant="secondary" onClick={handleLock} disabled={locking}>
                    <Lock size={14} /> {locking ? "Locking..." : "Lock Session"}
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => { setView("list"); setSelectedSession(null) }}>
                <X size={14} /> Back
              </Button>
            </div>
          }
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
            <AlertCircle size={14} /> {error}
            <button onClick={() => setError("")}><X size={14} /></button>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table
              columns={[
                { key: "student", header: "Student", render: (r: AttendanceRecord) => (
                  <span className="font-medium">{r.student?.firstName} {r.student?.lastName}</span>
                )},
                { key: "status", header: "Status", render: (r: AttendanceRecord) => (
                  <Badge variant={r.status === "present" ? "success" : r.status === "late" ? "warning" : r.status === "excused" ? "info" : "danger"}>
                    {r.status}
                  </Badge>
                )},
                { key: "edit", header: "", render: (r: AttendanceRecord) => (
                  selectedSession.status === "open" ? (
                    editingRecord?.recordId === r.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingRecord.status}
                          onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })}
                          className="rounded-lg border border-surface-300 bg-white px-2 py-1 text-xs text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                        <button onClick={() => handleEditRecord(r.id)} className="text-success-600 hover:text-success-700">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingRecord(null)} className="text-danger-600 hover:text-danger-700">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingRecord({ recordId: r.id, status: r.status, editReason: "" })}
                        className="text-xs text-accent hover:underline"
                      >
                        Edit
                      </button>
                    )
                  ) : null
                )},
              ]}
              data={selectedSession.records || []}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and manage daily attendance records."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Session
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="flex items-end gap-3 flex-wrap">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Class</label>
                <select value={formClass} onChange={(e) => setFormClass(e.target.value)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                  <option value="">Select class...</option>
                  {classInstances.map((ci) => (
                    <option key={ci.id} value={ci.id}>{ci.class?.name} — {ci.streamName}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-auto">
                <Input label="Date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Session</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as any)}
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="lesson">Lesson</option>
                </select>
              </div>
              <div className="flex gap-2 pb-1">
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
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
              <Input type="text" placeholder="Search by class or date..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9" />
            </div>
            <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary-400" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No sessions found" description={search ? "Try a different search term." : "Create your first attendance session."} />
          ) : (
            <Table
              columns={[
                { key: "class", header: "Class", render: (s: AttendanceSession) => (
                  <button onClick={() => openDetail(s)} className="font-medium text-accent hover:underline text-left">
                    {s.classInstance?.class?.name || "—"} {s.classInstance?.streamName || ""}
                  </button>
                )},
                { key: "date", header: "Date", render: (s: AttendanceSession) => new Date(s.sessionDate).toLocaleDateString() },
                { key: "type", header: "Session", render: (s: AttendanceSession) => (
                  <span className="capitalize">{s.sessionType.replace("_", " ")}</span>
                )},
                { key: "records", header: "Records", render: (s: AttendanceSession) => `${s.records?.length || 0}` },
                { key: "status", header: "Status", render: (s: AttendanceSession) => (
                  <Badge variant={s.status === "open" ? "warning" : "success"}>{s.status}</Badge>
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