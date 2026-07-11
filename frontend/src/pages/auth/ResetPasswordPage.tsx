import { useState, type FormEvent } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { AlertCircle, CheckCircle } from "lucide-react"
import { authApi } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Invalid or missing reset token.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      setSuccess(true)
      setTimeout(() => navigate("/auth/login", { replace: true }), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500 mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-primary-900">Password reset successful</h2>
          <p className="mt-2 text-sm text-primary-500">
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white shadow-inner">
            <Logo size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-900">SchoolPulse</h1>
            <p className="text-xs text-primary-500 font-medium">by AstraTech</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Reset password</h2>
        <p className="mt-1 text-sm text-primary-500">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/auth/login" className="text-sm font-semibold text-accent hover:text-accent-600">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
