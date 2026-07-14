import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, AlertCircle, Shield, Trash2, X } from "lucide-react"
import { membershipsApi, usersApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Table } from "../../components/ui/Table"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { EmptyState } from "../../components/ui/EmptyState"
import { Skeleton } from "../../components/ui/Skeleton"
import { ConfirmModal } from "../../components/ui/Modal"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"
import type { Membership } from "../../types"

const membershipStatusVariant: Record<string, BadgeVariant> = {
  active: "success",
  on_leave: "warning",
  suspended: "danger",
  resigned: "default",
  terminated: "danger",
}

const userStatusVariant: Record<string, BadgeVariant> = {
  active: "success",
  inactive: "warning",
  archived: "default",
}

export function UserListPage() {
  const navigate = useNavigate()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; name: string } | null>(null)
  const [actionError, setActionError] = useState("")
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError("")
    try {
      await usersApi.delete(school!.id, deleteTarget.userId)
      setMemberships((prev) => prev.filter((m) => m.userId !== deleteTarget.userId))
      setDeleteTarget(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const isStaffMembership = (m: Membership) => {
    if (!m.roles || m.roles.length === 0) return true
    const roleNames = m.roles.map((r: any) => r.role?.name || r.name)
    return roleNames.length > 1 || !roleNames.includes("Guardian")
  }

  const filtered = (search
    ? memberships.filter((m) =>
        `${m.user?.firstName || ""} ${m.user?.lastName || ""} ${m.user?.phone || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : memberships
  ).filter(isStaffMembership)

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
            <>
              {actionError && (
                <div className="flex items-center gap-2 px-4 py-2 bg-danger-50 border-b border-danger-100">
                  <AlertCircle size={14} className="text-danger-500 shrink-0" />
                  <p className="text-xs text-danger-700 flex-1">{actionError}</p>
                  <button onClick={() => setActionError("")} className="text-danger-400 hover:text-danger-600">
                    <X size={14} />
                  </button>
                </div>
              )}
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
                  { key: "userStatus", header: "User Status", render: (m) => <Badge variant={userStatusVariant[m.user?.status] || "default"}>{m.user?.status || "—"}</Badge> },
                  { key: "memStatus", header: "Membership", render: (m) => <Badge variant={membershipStatusVariant[m.status] || "default"}>{m.status}</Badge> },
                  {
                    key: "actions", header: "",
                    render: (m) => (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget({ userId: m.userId, name: `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim() || "this user" })
                        }}
                        disabled={deleting}
                        className="text-surface-400 hover:text-danger-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    ),
                  },
                ]}
                data={filtered}
                onRowClick={(m) => navigate(`/users/${m.userId}`)}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        onConfirm={handleDeleteConfirm}
        title="Remove Staff User"
        description={`Remove ${deleteTarget?.name || "this user"} from the school? This action cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}
