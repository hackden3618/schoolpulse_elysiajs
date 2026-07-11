import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    LogOut, RefreshCw, CheckCircle, XCircle, AlertCircle,
    Building2, Users, Loader2, Clock, Phone, Mail, MapPin,
    Search, Plus, X,
} from "lucide-react"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Table } from "../../components/ui/Table"
import { EmptyState } from "../../components/ui/EmptyState"
import { Logo } from "../../components/ui/Logo"
import { ConfirmModal } from "../../components/ui/Modal"
import { joinRequestsApi, platformAdminApi, setPlatformToken, getPlatformToken } from "../../lib/api"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"
import type { JoinRequest } from "../../types"

type Tab = "requests" | "admins" | "schools"
type RequestFilter = "all" | "pending" | "approved" | "rejected"

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
}

const schoolLevelLabels: Record<string, string> = {
    pre_primary: "Pre-Primary",
    primary: "Primary",
    hybrid_pri_jsecondary: "Hybrid (Primary & Junior Secondary)",
    junior_secondary: "Junior Secondary",
    senior_secondary: "Senior Secondary",
    tertiary: "Tertiary",
    mixed: "Mixed",
}

function schoolLevelLabel(level: string): string {
    return schoolLevelLabels[level] || level.replace(/_/g, " ")
}

export function PlatformDashboard() {
    const navigate = useNavigate()
    const [admin, setAdmin] = useState<any>(null)
    const [tab, setTab] = useState<Tab>("requests")
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
    const [platformAdmins, setPlatformAdmins] = useState<any[]>([])
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [search, setSearch] = useState("")
    const [approving, setApproving] = useState<string | null>(null)
    const [rejecting, setRejecting] = useState<string | null>(null)
    const [reviewing, setReviewing] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null)
    const [requestFilter, setRequestFilter] = useState<RequestFilter>("all")
    const [approvedId, setApprovedId] = useState<string | null>(null)
    const [newCode, setNewCode] = useState<string | null>(null)
    const [newSchoolCode, setNewSchoolCode] = useState<string | null>(null)

    /* create admin form */
    const [showForm, setShowForm] = useState(false)
    const [adminFirstName, setAdminFirstName] = useState("")
    const [adminLastName, setAdminLastName] = useState("")
    const [adminEmail, setAdminEmail] = useState("")
    const [adminPhone, setAdminPhone] = useState("")
    const [adminRole, setAdminRole] = useState("staff")
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem("schoolpulse:platform")
        if (!stored) {
            navigate("/platform/login")
            return
        }
        try {
            const parsed = JSON.parse(stored)
            setPlatformToken(parsed.accessToken)
            setAdmin(parsed.admin)
        } catch {
            navigate("/platform/login")
        }
    }, [])

    const load = async () => {
        if (!getPlatformToken()) return
        setLoading(true)
        setError("")
        try {
            const [reqRes, adminsRes, schoolsRes] = await withMinDelay(Promise.all([
                joinRequestsApi.list(),
                platformAdminApi.listAdmins(),
                platformAdminApi.listSchools(),
            ]))
            setJoinRequests(reqRes.data)
            setPlatformAdmins(adminsRes.data)
            setSchools(schoolsRes.data)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (getPlatformToken()) load() }, [])

    const handleApprove = async (id: string) => {
        setApproving(id)
        setError("")
        try {
            const res = await withMinDelay(joinRequestsApi.approve(id))
            setApprovedId(id)
            setNewCode(res.data.oneTimeCode)
            setNewSchoolCode(res.data.school.schoolCode)
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to approve")
        } finally {
            setApproving(null)
        }
    }

    const handleReject = async (id: string) => {
        setRejecting(id)
        setError("")
        try {
            await withMinDelay(joinRequestsApi.reject(id, rejectReason || undefined))
            setShowRejectInput(null)
            setRejectReason("")
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to reject")
        } finally {
            setRejecting(null)
        }
    }

    const handleMarkReview = async (id: string) => {
        setReviewing(id)
        setError("")
        try {
            await withMinDelay(joinRequestsApi.markReview(id))
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to mark as under review")
        } finally {
            setReviewing(null)
        }
    }

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!adminFirstName || !adminLastName || !adminEmail || !adminPhone) return
        setSaving(true)
        try {
            await withMinDelay(platformAdminApi.createAdmin({
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                phone: adminPhone,
                role: adminRole,
            }))
            setShowForm(false)
            setAdminFirstName(""); setAdminLastName(""); setAdminEmail(""); setAdminPhone(""); setAdminRole("staff")
            await load()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create admin")
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteSchool = async (id: string) => {
        setDeleting(id)
        setError("")
        try {
            await withMinDelay(platformAdminApi.deleteSchool(id))
            setSchools((prev) => prev.filter((s) => s.id !== id))
            setDeleteConfirmId(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete school")
        } finally {
            setDeleting(null)
        }
    }

    const handleLogout = () => {
        setPlatformToken(null)
        localStorage.removeItem("schoolpulse:platform")
        navigate("/platform/login")
    }

    const pendingRequests = joinRequests.filter((r) => r.status === "pending_review" || r.status === "submitted")
    const approvedRequests = joinRequests.filter((r) => r.status === "approved")
    const rejectedRequests = joinRequests.filter((r) => r.status === "rejected")

    const filteredByStatus = joinRequests.filter((r) => {
        if (requestFilter === "all") return true
        if (requestFilter === "pending") return r.status === "pending_review" || r.status === "submitted"
        if (requestFilter === "approved") return r.status === "approved"
        if (requestFilter === "rejected") return r.status === "rejected"
        return true
    })

    const filteredRequests = filteredByStatus.filter((r) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            r.schoolName.toLowerCase().includes(q) ||
            r.phone.includes(q) ||
            r.status.includes(q)
        )
    })

    const statusVariant: Record<string, "warning" | "success" | "danger" | "info" | "default"> = {
        submitted: "info",
        pending_review: "warning",
        approved: "success",
        rejected: "danger",
    }

    const statusLabel: Record<string, string> = {
        submitted: "New",
        pending_review: "Under Review",
        approved: "Approved",
        rejected: "Rejected",
    }

    if (!admin) return null

    return (
        <div className="min-h-screen bg-surface-50">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-surface-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-900 text-white">
                            <Logo size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-primary-900">SchoolPulse Platform</h1>
                            <p className="text-[10px] text-primary-400 font-medium">Internal Administration</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-primary-500">
                            {admin.firstName} {admin.lastName}
                            <Badge variant="info" className="ml-2 capitalize text-[9px]">{admin.role}</Badge>
                        </span>
                        <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition-colors">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-900">Dashboard</h2>
                        <p className="mt-1 text-sm text-primary-500">Manage school registrations and platform staff.</p>
                    </div>
                    <Button onClick={load} disabled={loading} variant="secondary">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                    </Button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 p-4 text-sm text-danger-700 mb-6">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg bg-primary-50 p-1 border border-primary-100 w-fit mb-6">
                    {(["requests", "schools", "admins"] as Tab[]).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all capitalize ${tab === t ? "bg-white text-primary-900 shadow-sm" : "text-primary-500 hover:text-primary-700"
                                }`}
                        >
                            {t === "requests" ? <Building2 size={14} /> : t === "schools" ? <Building2 size={14} /> : <Users size={14} />}
                            {t === "requests" ? "Join Requests" : t === "schools" ? "Schools" : "Platform Admins"}
                            {t === "requests" && pendingRequests.length > 0 && (
                                <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-primary-400" />
                    </div>
                ) : tab === "requests" ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button onClick={() => { setRequestFilter("pending"); setSearch("") }}
                                className={`rounded-xl border p-4 text-left transition-all text-left w-full ${requestFilter === "pending" ? "border-accent bg-accent-50 ring-1 ring-accent" : "border-surface-200 bg-white hover:border-surface-300"}`}>
                                <p className="text-xs text-surface-500 font-medium">Pending Review</p>
                                <p className="text-2xl font-bold text-primary-900 mt-1">{pendingRequests.length}</p>
                            </button>
                            <button onClick={() => { setRequestFilter("approved"); setSearch("") }}
                                className={`rounded-xl border p-4 text-left transition-all text-left w-full ${requestFilter === "approved" ? "border-accent bg-accent-50 ring-1 ring-accent" : "border-surface-200 bg-white hover:border-surface-300"}`}>
                                <p className="text-xs text-surface-500 font-medium">Approved</p>
                                <p className="text-2xl font-bold text-success-600 mt-1">{approvedRequests.length}</p>
                            </button>
                            <button onClick={() => { setRequestFilter("rejected"); setSearch("") }}
                                className={`rounded-xl border p-4 text-left transition-all text-left w-full ${requestFilter === "rejected" ? "border-accent bg-accent-50 ring-1 ring-accent" : "border-surface-200 bg-white hover:border-surface-300"}`}>
                                <p className="text-xs text-surface-500 font-medium">Rejected</p>
                                <p className="text-2xl font-bold text-danger-600 mt-1">{rejectedRequests.length}</p>
                            </button>
                            <button onClick={() => { setRequestFilter("all"); setSearch("") }}
                                className={`rounded-xl border p-4 text-left transition-all text-left w-full ${requestFilter === "all" ? "border-accent bg-accent-50 ring-1 ring-accent" : "border-surface-200 bg-white hover:border-surface-300"}`}>
                                <p className="text-xs text-surface-500 font-medium">Total Requests</p>
                                <p className="text-2xl font-bold text-primary-900 mt-1">{joinRequests.length}</p>
                            </button>
                        </div>

                        {/* Requests */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="flex items-center gap-3 p-4 border-b border-surface-100">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                                        <input type="text" placeholder="Search by school name, phone..." value={search} onChange={(e) => setSearch(e.target.value)}
                                            className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-2 text-sm" />
                                    </div>
                                </div>
                                {filteredRequests.length === 0 ? (
                                    <EmptyState title="No join requests" description={requestFilter !== "all" ? "No requests match this filter." : "Pending requests will appear here."} />
                                ) : (
                                    <div className="divide-y divide-surface-100">
                                        {filteredRequests.map((req) => (
                                            <div key={req.id} className="p-5 hover:bg-surface-50/40 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={16} className="text-primary-400 shrink-0" />
                                                            <h3 className="text-sm font-bold text-primary-900">{req.schoolName}</h3>
                                                            <Badge variant={statusVariant[req.status] || "default"}>
                                                                {statusLabel[req.status] || req.status.replace(/_/g, " ")}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-surface-500">
                                                            <span className="flex items-center gap-1"><Phone size={12} /> School: {req.phone}</span>
                                                            {req.email && <span className="flex items-center gap-1"><Mail size={12} /> School: {req.email}</span>}
                                                            {req.schoolLevel && <span className="flex items-center gap-1"><Building2 size={12} /> {schoolLevelLabel(req.schoolLevel)}</span>}
                                                            {req.county && <span className="flex items-center gap-1"><MapPin size={12} /> {req.county}{req.town ? `, ${req.town}` : ""}{req.country ? `, ${req.country}` : ""}</span>}
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(req.requestedAt)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {(req.status === "pending_review" || req.status === "submitted") && (
                                                            <>
                                                                {req.status === "submitted" && (
                                                                    <Button size="sm" variant="secondary" onClick={() => handleMarkReview(req.id)} disabled={reviewing === req.id}>
                                                                        {reviewing === req.id ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                                                                        {reviewing === req.id ? "Marking..." : "Under Review"}
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="danger" onClick={() => setShowRejectInput(showRejectInput === req.id ? null : req.id)}>
                                                                    <XCircle size={14} /> Reject
                                                                </Button>
                                                                <Button size="sm" onClick={() => handleApprove(req.id)} disabled={approving === req.id}>
                                                                    {approving === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                                    {approving === req.id ? "Approving..." : "Approve"}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {showRejectInput === req.id && (
                                                    <div className="mt-3 rounded-lg border border-danger-200 bg-danger-50 p-3 space-y-2">
                                                        <Input label="Reason (optional)" placeholder="e.g. Incomplete information" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="danger" onClick={() => handleReject(req.id)} disabled={rejecting === req.id}>
                                                                {rejecting === req.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                                {rejecting === req.id ? "Rejecting..." : "Confirm Reject"}
                                                            </Button>
                                                            <Button size="sm" variant="secondary" onClick={() => { setShowRejectInput(null); setRejectReason("") }}>Cancel</Button>
                                                        </div>
                                                    </div>
                                                )}
                                                {approvedId === req.id && newSchoolCode && (
                                                    <div className="mt-3 rounded-lg bg-success-50 border border-success-200 p-3 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle size={16} className="text-success-600 shrink-0" />
                                                            <p className="text-xs font-semibold text-success-800">Approved! School code and OTP sent via SMS.</p>
                                                        </div>
                                                        <p className="text-xs text-success-700 font-mono pl-6">
                                                            Code: <span className="font-bold">{newSchoolCode}</span> &middot; OTP: <span className="font-bold">{newCode}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : tab === "schools" ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-surface-500">{schools.length} school{schools.length !== 1 ? "s" : ""}</p>
                        </div>

                        {schools.length === 0 ? (
                            <EmptyState title="No schools" description="Approved join requests will appear here." />
                        ) : (
                            <Card>
                                <CardContent className="p-0">
                                    <Table
                                        columns={[
                                            {
                                                key: "name", header: "School Name", render: (s: any) => (
                                                    <span className="font-medium">{s.schoolName}</span>
                                                )
                                            },
                                            { key: "code", header: "Code", render: (s: any) => <span className="font-mono text-xs">{s.schoolCode}</span> },
                                            { key: "county", header: "Location", render: (s: any) => `${s.county}${s.town ? `, ${s.town}` : ""}` },
                                            {
                                                key: "students", header: "Students", render: (s: any) => s._count?.students ?? 0
                                            },
                                            {
                                                key: "staff", header: "Staff", render: (s: any) => s._count?.memberships ?? 0
                                            },
                                            {
                                                key: "created", header: "Created", render: (s: any) => new Date(s.createdAt).toLocaleDateString()
                                            },
                                            {
                                                key: "actions", header: "", render: (s: any) => (
                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => setDeleteConfirmId(s.id)}
                                                        disabled={deleting === s.id}
                                                    >
                                                        {deleting === s.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                                        {deleting === s.id ? "Deleting..." : "Delete"}
                                                    </Button>
                                                )
                                            },
                                        ]}
                                        data={schools}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    /* Platform Admins Tab */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-surface-500">{platformAdmins.length} admin{platformAdmins.length !== 1 ? "s" : ""}</p>
                            {admin.role === "super_admin" && (
                                <Button onClick={() => setShowForm(!showForm)}>
                                    <Plus size={16} /> Add Staff
                                </Button>
                            )}
                        </div>

                        {showForm && admin.role === "super_admin" && (
                            <Card>
                                <CardContent className="p-4">
                                    <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <Input label="First Name" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} placeholder="John" />
                                        <Input label="Last Name" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} placeholder="Doe" />
                                        <Input label="Email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="john@schoolpulse.co.ke" />
                                        <Input label="Phone" type="tel" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="+2547XXXXXXXX" />
                                        <div className="flex gap-2 items-end pb-1">
                                            <div className="space-y-1 flex-1">
                                                <label className="block text-xs font-medium text-surface-700">Role</label>
                                                <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)}
                                                    className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm">
                                                    <option value="staff">Staff</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="support">Support</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            </div>
                                            <Button size="sm" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                                            <Button size="sm" variant="secondary" type="button" onClick={() => setShowForm(false)}><X size={14} /></Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {platformAdmins.length === 0 ? (
                            <EmptyState title="No platform admins" description="Add staff to manage the platform." />
                        ) : (
                            <Card>
                                <CardContent className="p-0">
                                    <Table
                                        columns={[
                                            {
                                                key: "name", header: "Name", render: (a: any) => (
                                                    <span className="font-medium">{a.firstName} {a.lastName}</span>
                                                )
                                            },
                                            { key: "email", header: "Email", render: (a: any) => a.email },
                                            { key: "phone", header: "Phone", render: (a: any) => a.phone },
                                            {
                                                key: "role", header: "Role", render: (a: any) => (
                                                    <Badge variant={a.role === "super_admin" ? "success" : a.role === "admin" ? "info" : "default"}>
                                                        {a.role.replace("_", " ")}
                                                    </Badge>
                                                )
                                            },
                                            {
                                                key: "status", header: "Status", render: (a: any) => (
                                                    <Badge variant={a.status === "active" ? "success" : "warning"}>{a.status}</Badge>
                                                )
                                            },
                                            { key: "created", header: "Created", render: (a: any) => new Date(a.createdAt).toLocaleDateString() },
                                        ]}
                                        data={platformAdmins}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </main>

            <ConfirmModal
                open={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => handleDeleteSchool(deleteConfirmId!)}
                title="Delete school?"
                description="This action permanently removes the school and all associated data. This cannot be undone."
                confirmLabel="Delete School"
                variant="danger"
                loading={deleting !== null}
            />
        </div>
    )
}
