import { useState } from "react"
import { useAuth } from "../lib/auth-context"
import { useToast } from "../components/ui/Toast"
import { PageHeader } from "../components/shell/PageHeader"
import { Card, CardContent } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { RoleSwitcherModal } from "../components/shell/RoleSwitcherModal"

export function ProfilePage() {
  const { user, activeRole, roles, logout } = useAuth()
  const toast = useToast()
  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Frontend-only: simulate a short delay, then confirm locally.
    setTimeout(() => {
      setSaving(false)
      toast.success("Profile updated (sample)")
    }, 400)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your account details (sample data)" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary-900">Details</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowRoleModal(true)}>
                  Switch role
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-primary-900">Session</h3>
            <p className="text-sm text-surface-600">
              Signed in as <span className="font-medium text-primary-800">{user?.firstName} {user?.lastName}</span>
            </p>
            <p className="text-sm text-surface-600">
              Active role: <span className="font-medium text-primary-800">{activeRole?.name}</span>
            </p>
            <p className="text-sm text-surface-600">
              Roles: {roles.map((r) => r.name).join(", ")}
            </p>
            <Button variant="secondary" onClick={logout}>Log out</Button>
          </CardContent>
        </Card>
      </div>

      {showRoleModal && <RoleSwitcherModal onClose={() => setShowRoleModal(false)} />}
    </div>
  )
}
