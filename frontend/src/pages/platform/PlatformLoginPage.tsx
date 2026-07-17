import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import { platformAdminApi, setPlatformToken } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { BrandedHero } from "../../components/ui/BrandedHero"

export function PlatformLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Email and password are required.")
      return
    }
    setLoading(true)
    try {
      const res = await platformAdminApi.login({ email, password })
      setPlatformToken(res.data.accessToken)
      // Store platform admin session
      localStorage.setItem("schoolpulse:platform", JSON.stringify({
        accessToken: res.data.accessToken,
        admin: res.data.admin,
      }))
      navigate("/platform/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:flex-none lg:min-h-screen lg:justify-center lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-900 text-white shadow-inner">
              <Logo size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900">SchoolPulse</h1>
              <p className="text-xs text-primary-500 font-medium">Internal Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-900 text-white">
              <Logo size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Platform Admin</h2>
              <p className="mt-1 text-sm text-primary-500">Sign in to manage schools and requests</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="admin@schoolpulse.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-primary-400">
            SchoolPulse Internal Platform &mdash; Authorized personnel only
          </p>
        </div>
      </div>

      <BrandedHero
        title={<>SchoolPulse <span className="text-accent">Platform</span></>}
        subtitle="Internal administration panel for managing school registrations, monitoring system health, and overseeing the SchoolPulse ecosystem."
        features={[
          "Review and approve school join requests",
          "Manage platform administrators",
          "Monitor school onboarding flow",
          "View system-wide analytics",
        ]}
      />
    </div>
  )
}