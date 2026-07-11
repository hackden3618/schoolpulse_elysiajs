import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { authApi } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

export function ForgotPasswordPage() {
  const [login, setLogin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ found: boolean; message: string } | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    if (!login) {
      setError("Please enter your email or phone number.")
      return
    }
    setLoading(true)
    try {
      const res = await authApi.forgotPassword({ login })
      setResult(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link.")
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          {result.found ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500 mb-6">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-primary-900">Check your phone</h2>
              <p className="mt-2 text-sm text-primary-500">{result.message}</p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-500 mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-primary-900">Account not found</h2>
              <p className="mt-2 text-sm text-primary-500">{result.message}</p>
            </>
          )}
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-600"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
          <button
            onClick={() => setResult(null)}
            className="mt-3 block w-full text-center text-sm text-primary-500 hover:text-primary-700 underline"
          >
            Try a different email or phone
          </button>
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

        <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Forgot password?</h2>
        <p className="mt-1 text-sm text-primary-500">
          Enter your email or phone and we'll send you reset instructions.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email or Phone Number"
            type="text"
            placeholder="you@school.sch.ke or +2547xx"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoFocus
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mail size={16} />
                Send Reset Instructions
              </span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-600">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
