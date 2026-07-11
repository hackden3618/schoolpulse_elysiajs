import { useState, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [loginStr, setLoginStr] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    if (!loginStr || !password) {
      setError("Please enter both email/phone and password.")
      return
    }
    setLoading(true)
    try {
      await login(loginStr, password)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white shadow-inner">
              <Logo size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900">SchoolPulse</h1>
              <p className="text-xs text-primary-500 font-medium">by AstraTech</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-primary-500">Enter your credentials to access the system.</p>

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
              value={loginStr}
              onChange={(e) => setLoginStr(e.target.value)}
              autoComplete="username"
              autoFocus
            />

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-surface-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="block w-full rounded-lg border border-surface-300 bg-white px-3 py-2 pr-10 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-surface-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-primary-600">Remember me</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm font-semibold text-accent hover:text-accent-600"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={16} />
                  Sign in
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-primary-400">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-semibold text-accent hover:text-accent-600">
              Register your school
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/20 border border-accent/30">
              <Logo size={40} className="text-accent" />
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              School Management,{" "}
              <span className="text-accent">Simplified</span>
            </h3>
            <p className="mt-4 text-primary-300 leading-relaxed">
              Manage students, staff, attendance, fees, and academics — all from one unified platform.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-2xl font-bold text-accent">98+</p>
                <p className="text-xs text-primary-400 mt-1">Schools Active</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-2xl font-bold text-accent">15k+</p>
                <p className="text-xs text-primary-400 mt-1">Students Managed</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-2xl font-bold text-accent">99.9%</p>
                <p className="text-xs text-primary-400 mt-1">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
