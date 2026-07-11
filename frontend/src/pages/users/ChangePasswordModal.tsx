import { useState } from "react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { authApi } from "../../lib/api"
import { withMinDelay } from "../../lib/ux"

interface ChangePasswordModalProps {
  onClose: () => void
  onSaved: () => void
}

export function ChangePasswordModal({ onClose, onSaved }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setSaving(true)
    try {
      await withMinDelay(authApi.changePassword({ currentPassword, newPassword }))
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change password")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-surface-900">Change Password</h3>
        
        <div className="space-y-4">
          {error && <p className="text-sm font-medium text-danger-500">{error}</p>}
          
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
              {saving ? "Saving..." : "Change Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
