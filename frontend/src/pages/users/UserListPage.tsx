import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, AlertCircle, Shield } from "lucide-react"
import { membershipsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Table } from "../../components/ui/Table"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { EmptyState } from "../../components/ui/EmptyState"
import { Skeleton } from "../../components/ui/Skeleton"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"
import type { Membership } from "../../types"

const statusVariant: Record<string, BadgeVariant> = {
  active: "success",
  on_leave: "warning",
  suspended: "danger",
  resigned: "default",
  terminated: "danger",
}

export function UserListPage() {
  const navigate = useNavigate()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const { school } = useAuth()

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await withMinDelay(membershipsApi.list(school!.id))
      setMemberships(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff members")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = search
    ? memberships.filter((m) =>
        `${m.user?.firstName || ""} ${m.user?.lastName || ""} ${m.user?.phone || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : memberships

  const isEmpty = !loading && !error && memberships.length === 0

  if (isEmpty) {
    return (
      <div>
        <PageHeader
          title="Staff Users"
          description="Manage staff accounts and role assignments."
          actions={
            <Button onClick={() => navigate("/users/create")}>
              <Plus size={16} />
              Add Staff
            </Button>
          }
        />
        <Card>
          <CardContent>
            <EmptyState
              title="No staff users yet"
              description="Start by adding staff members to your school."
              action={{ label: "Add First Staff", onClick: () => navigate("/users/create") }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Users"
        description="Manage staff accounts and role assignments."
        actions={
          <Button onClick={() => navigate("/users/create")}>
            <Plus size={16} />
            Add Staff
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
                placeholder="Search by name or phone..."
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
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
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
          ) : (
            <Table
              columns={[
                { key: "name", header: "Name", render: (m) => `${m.user?.firstName || ""} ${m.user?.lastName || ""}` },
                { key: "phone", header: "Phone", render: (m) => m.user?.phone || "—" },
                { key: "email", header: "Email", render: (m) => m.user?.email || "—" },
                {
                  key: "roles", header: "Roles",
                  render: (m) => (
                    <div className="flex gap-1 flex-wrap">
                      {m.roles?.map((r) => (
                        <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-accent-50 text-accent-700 px-2.5 py-0.5 text-[11px] font-semibold">
                          <Shield size={10} />
                          {r.role?.name || "Unknown"}
                        </span>
                      )) || <span className="text-primary-400 text-xs">No roles</span>}
                    </div>
                  ),
                },
                { key: "status", header: "Status", render: (m) => <Badge variant={statusVariant[m.status] || "default"}>{m.status}</Badge> },
              ]}
              data={filtered}
              onRowClick={(m) => navigate(`/users/${m.userId}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
