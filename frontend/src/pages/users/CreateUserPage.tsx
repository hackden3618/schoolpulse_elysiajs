import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, AlertCircle, Shield, Plus, X, Check } from "lucide-react"
import { usersApi, membershipsApi, rolesApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Skeleton } from "../../components/ui/Skeleton"
import { ErrorBanner } from "../../components/ui/ErrorBanner"
import type { Role } from "../../types"

const MIN_LOAD_MS = 500

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function CreateUserPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState("")
  const [secondName, setSecondName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState("")

  const { school } = useAuth()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setRolesLoading(true)
      setRolesError("")
      try {
        const res = await rolesApi.list()
        if (!cancelled) setRoles(res.data)
      } catch (e) {
        if (!cancelled) setRolesError(e instanceof Error ? e.message : "Failed to load roles")
      } finally {
        if (!cancelled) setRolesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName || !lastName || !phone) {
      setError("First name, last name, and phone are required.")
      return
    }
    if (selectedRoleIds.length === 0) {
      setError("Please assign at least one role.")
      return
    }

    setLoading(true)
    try {
      const [userRes] = await Promise.all([
        usersApi.create(school!.id, {
          firstName,
          secondName: secondName || undefined,
          lastName,
          phone,
          email: email || undefined,
          password: password || undefined,
        }),
        delay(MIN_LOAD_MS),
      ])

      await membershipsApi.create(school!.id, {
        userId: userRes.data.id,
        roleIds: selectedRoleIds,
      })

      setSuccess(true)
      setTimeout(() => navigate("/users"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500 mb-4">
            <Check size={32} />
          </div>
          <h2 className="text-xl font-bold text-primary-900">Staff user created</h2>
          <p className="text-sm text-primary-500 mt-1">Redirecting to staff list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Staff User"
        description="Create a new staff account and assign roles."
        actions={
          <Button variant="secondary" onClick={() => navigate("/users")}>
            <ArrowLeft size={16} />
            Back to Staff
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary-900">Personal Information</h3>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="First Name *" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <Input label="Second Name" placeholder="(optional)" value={secondName} onChange={(e) => setSecondName(e.target.value)} />
                  <Input label="Last Name *" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Phone Number *" type="tel" placeholder="+254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input label="Email" type="email" placeholder="john.doe@school.sch.ke" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <Input
                  label="Password (optional)"
                  type="password"
                  placeholder="Leave blank to send invite"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-primary-900">Role Assignment</h3>
                  <span className="text-xs text-primary-400">{selectedRoleIds.length} selected</span>
                </div>
                <p className="text-xs text-primary-500 mb-4">
                  Assign one or more roles to define what this staff member can access.
                </p>

                {rolesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-200 bg-white p-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : rolesError ? (
                  <ErrorBanner message={rolesError} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roles.map((role) => {
                      const selected = selectedRoleIds.includes(role.id)
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                            selected
                              ? "border-accent bg-accent-50 ring-1 ring-accent"
                              : "border-surface-200 bg-white hover:border-surface-300"
                          }`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            selected ? "bg-accent text-white" : "bg-surface-100 text-surface-500"
                          }`}>
                            <Shield size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${selected ? "text-accent-700" : "text-primary-900"}`}>
                              {role.name}
                            </p>
                            <p className="text-xs text-primary-400 truncate">{role.description}</p>
                          </div>
                          {selected ? <X size={14} className="text-accent shrink-0" /> : <Plus size={14} className="text-surface-300 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-primary-900 mb-3">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-primary-400 text-xs">Full Name</span>
                    <p className="text-primary-900 font-medium">{firstName || "—"} {lastName || ""}</p>
                  </div>
                  <div>
                    <span className="text-primary-400 text-xs">Phone</span>
                    <p className="text-primary-900 font-medium">{phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-primary-400 text-xs">Roles</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRoleIds.length === 0 ? (
                        <span className="text-primary-400">None selected</span>
                      ) : (
                        selectedRoleIds.map((id) => {
                          const role = roles.find((r) => r.id === id)
                          return role ? (
                            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-accent-50 text-accent-700 px-2 py-0.5 text-[11px] font-semibold">
                              {role.name}
                            </span>
                          ) : null
                        })
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Staff User"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
