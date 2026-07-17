import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../lib/auth-context"
import { usersApi } from "../lib/api"
import { communicationApi } from "../lib/api/communication"
import { useToast } from "../components/ui/Toast"
import {
  UserCircle,
  Shield,
  Lock,
  Check,
  Building2,
  Users,
  AlertCircle,
  Globe,
  Sparkles,
} from "lucide-react"
import { PageHeader } from "../components/shell/PageHeader"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Skeleton } from "../components/ui/Skeleton"
import { ErrorBanner } from "../components/ui/ErrorBanner"
import { UX_MIN_DELAY, withMinDelay } from "../lib/ux"
import { ChangePasswordModal } from "./users/ChangePasswordModal"
import { RoleSwitcherModal } from "../components/shell/RoleSwitcherModal"
import type { Membership, NotificationPreference, Role } from "../types"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
]

const CHANNELS: { key: string; label: string }[] = [
  { key: "in_app", label: "In-App" },
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
]

export function ProfilePage() {
  const { user, school, membership, roles, activeRole, allMemberships, switchSchool, switchRole } = useAuth()
  const toast = useToast()
  const schoolId = school?.id
  const userId = user?.id

  const [firstName, setFirstName] = useState("")
  const [secondName, setSecondName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [profilePic, setProfilePic] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState("en")
  const [reduceMotion, setReduceMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSaving, setPrefsSaving] = useState(false)

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  const load = useCallback(async () => {
    if (!schoolId || !userId) return
    setLoading(true)
    setError("")
    try {
      const [userRes, prefsRes] = await withMinDelay(Promise.all([
        usersApi.me.get(schoolId),
        communicationApi.preferences.get(schoolId).catch(() => ({ data: [] as NotificationPreference[] })),
      ]))
      const u = userRes.data
      setFirstName(u.firstName || "")
      setSecondName(u.secondName || "")
      setLastName(u.lastName || "")
      setPhone(u.phone || "")
      setEmail(u.email || "")
      setProfilePic(u.profilePic || "")
      setPreferences(prefsRes.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile")
    } finally {
      setLoading(false)
      setPrefsLoading(false)
    }
  }, [schoolId, userId])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId || !userId) return
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("First name, last name, and phone are required.")
      return
    }
    setSaving(true)
    try {
      await usersApi.me.update(schoolId, {
        firstName,
        secondName: secondName || undefined,
        lastName,
        phone,
        email: email || undefined,
        profilePic: profilePic || undefined,
      })
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handlePrefToggle = async (channel: string, enabled: boolean) => {
    setPrefsSaving(true)
    const next = preferences.map((p) => (p.channel === channel ? { ...p, enabled } : p))
    setPreferences(next)
    try {
      await communicationApi.preferences.update(schoolId!, next.map((p) => ({
        channel: p.channel,
        enabled: p.enabled,
        quietHoursStart: p.quietHoursStart ?? null,
        quietHoursEnd: p.quietHoursEnd ?? null,
      })))
      toast.success("Notification preferences saved")
    } catch {
      toast.error("Failed to save notification preferences")
      load()
    } finally {
      setPrefsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card><CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-3 gap-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            </CardContent></Card>
          </div>
          <div><Card><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card></div>
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={load} />
  }

  const displayName = [firstName, secondName, lastName].filter(Boolean).join(" ")
  const memberships: Membership[] = allMemberships?.length ? allMemberships : (membership ? [membership] : [])
  const multipleRoles = roles.length > 1
  const createdDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your identity across every school. Changes apply globally."
      />

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: editable personal info */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-surface-900">Personal Information</h3>
                <p className="text-xs text-surface-500 -mt-2">
                  Editable fields apply to your global identity across all schools.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    {profilePic ? (
                      <img src={profilePic} alt="" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <UserCircle size={36} />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input label="Profile Photo URL" value={profilePic} onChange={(e) => setProfilePic(e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <Input label="Second Name" value={secondName} onChange={(e) => setSecondName(e.target.value)} />
                  <Input label="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Phone Number *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700">Preferred Language</label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-surface-700">Accessibility</span>
                    <label className="flex items-center gap-2 text-sm text-surface-700">
                      <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
                      Reduce motion
                    </label>
                    <label className="flex items-center gap-2 text-sm text-surface-700">
                      <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
                      High contrast
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" loading={saving}>Save Changes</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowChangePassword(true)}>
                    <Lock size={16} /> Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary-500" />
                  <h3 className="text-sm font-semibold text-surface-900">Notification Preferences</h3>
                </div>
                {prefsLoading ? (
                  <div className="space-y-2">
                    {CHANNELS.map((c) => <Skeleton key={c.key} className="h-10" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-surface-100">
                    {CHANNELS.map((c) => {
                      const pref = preferences.find((p) => p.channel === c.key)
                      const enabled = pref?.enabled ?? true
                      return (
                        <label key={c.key} className="flex items-center justify-between py-3">
                          <span className="text-sm text-surface-700">{c.label}</span>
                          <button
                            type="button"
                            disabled={prefsSaving}
                            onClick={() => handlePrefToggle(c.key, !enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-primary-500" : "bg-surface-300"}`}
                            aria-pressed={enabled}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </label>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: locked info + memberships + role switching */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-surface-900 mb-3">Protected Identity</h3>
                <p className="text-xs text-surface-500 mb-4">These fields are managed by administrators and cannot be edited here.</p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-surface-400 text-xs">User ID</dt>
                    <dd className="text-surface-900 font-mono text-xs break-all">{userId}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400 text-xs">Account Status</dt>
                    <dd className="text-surface-900 font-medium capitalize">{user?.status || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400 text-xs">Member Since</dt>
                    <dd className="text-surface-900 font-medium">{createdDate}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={16} className="text-primary-500" />
                  <h3 className="text-sm font-semibold text-surface-900">Schools</h3>
                </div>
                <div className="space-y-3">
                  {memberships.map((m) => {
                    const isActive = m.id === membership?.id
                    const schoolName = m.schoolId === school?.id ? school.schoolName : "School"
                    const roleNames = (m.roles || []).map((r: any) => r.role?.name || r.name || r).filter(Boolean)
                    return (
                      <div key={m.id} className={`rounded-lg border p-3 ${isActive ? "border-primary-300 bg-primary-50" : "border-surface-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-surface-900">{schoolName}</span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600">
                              <Check size={12} /> Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowRoleSwitcher(true)}
                              className="text-[11px] font-medium text-primary-600 hover:underline"
                            >
                              Switch
                            </button>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {roleNames.map((rn: string) => (
                            <span key={rn} className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-600">
                              {rn === "Guardian" ? "Parent / Guardian" : rn}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-surface-400 capitalize">
                          {m.status === "active" ? "Active membership" : m.status}
                          {m.joinedAt ? ` · joined ${new Date(m.joinedAt).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {multipleRoles && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary-500" />
                      <h3 className="text-sm font-semibold text-surface-900">Current Role</h3>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setShowRoleSwitcher(true)}>
                      <Shield size={14} /> Switch Role
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-surface-900">
                    {activeRole?.name === "Guardian" ? "Parent / Guardian" : (activeRole?.name || "—")}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">Available roles in this school:</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {roles.map((r: Role) => (
                      <span key={r.id} className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-600">
                        {r.name === "Guardian" ? "Parent / Guardian" : r.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} onSaved={() => setShowChangePassword(false)} />
      )}
      {showRoleSwitcher && (
        <RoleSwitcherModal onClose={() => setShowRoleSwitcher(false)} />
      )}
    </div>
  )
}
