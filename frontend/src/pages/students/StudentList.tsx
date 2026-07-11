import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../lib/auth-context"
import { Plus, Search, AlertCircle, Loader2 } from "lucide-react"
import { studentsApi } from "../../lib/api"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Table } from "../../components/ui/Table"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { EmptyState } from "../../components/ui/EmptyState"
import { Skeleton } from "../../components/ui/Skeleton"
import type { Student } from "../../types"

const statusVariant: Record<string, BadgeVariant> = {
  active: "success",
  archived: "default",
  graduated: "info",
  transferred: "warning",
  inactive: "default",
}

export function StudentList() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const { school } = useAuth()

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await studentsApi.list(school!.id)
      setStudents(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = search
    ? students.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.admissionNumber}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : students

  const isEmpty = !loading && !error && students.length === 0
  const hasNoResults = !loading && !error && students.length > 0 && filtered.length === 0

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Students"
          description="Manage admissions, enrollment and student records."
          actions={
            <Button>
              <Plus size={16} />
              Admit Student
            </Button>
          }
        />
        <Card>
          <CardContent>
            <EmptyState
              title="No students yet"
              description="Start by admitting your first learner."
              action={{ label: "Admit First Student", onClick: () => {} }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage admissions, enrollment and student records."
        actions={
          <Button>
            <Plus size={16} />
            Admit Student
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b border-surface-100">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-2 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle size={24} className="mx-auto text-danger-500 mb-2" />
              <p className="text-sm text-danger-700">{error}</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={load}>Retry</Button>
            </div>
          ) : hasNoResults ? (
            <div className="p-6 text-center">
              <p className="text-sm text-primary-400">No students match your search.</p>
            </div>
          ) : (
            <Table
              columns={[
                { key: "admission", header: "Admission No.", render: (s) => <span className="font-mono text-xs font-medium">{s.admissionNumber}</span> },
                { key: "name", header: "Full Name", render: (s) => `${s.firstName} ${s.lastName}` },
                { key: "gender", header: "Gender", render: (s) => s.gender ? (s.gender === "male" ? "Male" : "Female") : "—" },
                { key: "class", header: "Class", render: (s) => s.currentEnrollment?.classInstance?.class?.name || s.enrollments?.[0]?.classInstance?.class?.name || "—" },
                { key: "status", header: "Status", render: (s) => <Badge variant={statusVariant[s.status] || "default"}>{s.status}</Badge> },
              ]}
              data={filtered}
              onRowClick={(s) => navigate(`/students/${s.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
