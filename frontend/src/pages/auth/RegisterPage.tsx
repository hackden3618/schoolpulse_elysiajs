import { useState, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { UserPlus, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { authApi, setAccessToken } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { BrandedHero } from "../../components/ui/BrandedHero"

type Mode = "new" | "existing"

type FieldErrors = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  password?: string
  schoolCode?: string
}

const validate = (mode: Mode, first: string, last: string, ph: string, pw: string, code: string, em: string): FieldErrors => {
  const e: FieldErrors = {}
  if (mode === "new") {
    if (!first.trim()) e.firstName = "First name is required."
    if (!last.trim()) e.lastName = "Last name is required."
  }
  if (!ph.trim()) e.phone = "Phone number is required."
  else if (ph.trim().length < 8) e.phone = "Enter a valid phone number."
  if (!pw) e.password = "Password is required."
  else if (pw.length < 6) e.password = "Password must be at least 6 characters."
  if (!code.trim()) e.schoolCode = "School code is required."
  if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.email = "Enter a valid email address."
  return e
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("new")
  const [firstName, setFirstName] = useState("")
  const [secondName, setSecondName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [schoolCode, setSchoolCode] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    const errs = validate(mode, firstName, lastName, phone, password, schoolCode, email)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const body: any = {
        firstName: mode === "new" ? firstName : "Existing",
        secondName: mode === "new" ? secondName || undefined : undefined,
        lastName: mode === "new" ? lastName : "User",
        phone,
        email: email || undefined,
        password,
        schoolCode,
      }
      await authApi.register(body)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
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
          <h2 className="text-2xl font-bold text-primary-900">You're all set!</h2>
          <p className="mt-2 text-sm text-primary-500">
            You have been successfully registered and added to the school.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-600"
          >
            <ArrowLeft size={16} />
            Sign in to continue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:flex-none lg:min-h-screen lg:justify-center lg:px-20 xl:px-24">
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

          <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Join a School</h2>
          <p className="mt-1 text-sm text-primary-500">
            Enter your school code to get started.
          </p>

          <div className="mt-6 flex rounded-lg border border-surface-200 p-1 bg-surface-50">
            <button
              type="button"
              onClick={() => { setMode("new"); setError(""); setFieldErrors({}) }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === "new" ? "bg-white text-primary-900 shadow-sm" : "text-primary-500 hover:text-primary-700"
              }`}
            >
              I'm new
            </button>
            <button
              type="button"
              onClick={() => { setMode("existing"); setError(""); setFieldErrors({}) }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === "existing" ? "bg-white text-primary-900 shadow-sm" : "text-primary-500 hover:text-primary-700"
              }`}
            >
              I have an account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Input
                label="School Code"
                placeholder="e.g. NAIWESTSM001"
                value={schoolCode}
                onChange={(e) => { setSchoolCode(e.target.value); clearFieldError("schoolCode") }}
                autoFocus
              />
              {fieldErrors.schoolCode && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.schoolCode}</p>}
            </div>

            {mode === "new" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="First Name"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName") }}
                    />
                    {fieldErrors.firstName && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName") }}
                    />
                    {fieldErrors.lastName && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.lastName}</p>}
                  </div>
                </div>
                <Input
                  label="Second Name (optional)"
                  placeholder="Middle name"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                />
              </>
            )}

            <div>
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+254712345678"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearFieldError("phone") }}
              />
              {fieldErrors.phone && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.phone}</p>}
            </div>

            {mode === "new" && (
              <div>
                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError("email") }}
                />
                {fieldErrors.email && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.email}</p>}
              </div>
            )}

            <div>
              <Input
                label="Password"
                type="password"
                placeholder={mode === "existing" ? "Your existing password" : "Create a password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password") }}
              />
              {fieldErrors.password && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {mode === "new" ? "Creating account..." : "Joining school..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={16} />
                  {mode === "new" ? "Create Account & Join" : "Join School"}
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-primary-400">
            Already a member?{" "}
            <Link to="/auth/login" className="font-semibold text-accent hover:text-accent-600">
              Sign in
            </Link>
          </p>

          <p className="mt-2 text-center text-xs text-primary-300">
            Registering a new school?{" "}
            <Link to="/onboarding/register" className="font-semibold text-accent hover:text-accent-600">
              Register your school
            </Link>
          </p>
        </div>
      </div>

      <BrandedHero
        title={<>Join your school on <span className="text-accent">SchoolPulse</span></>}
        subtitle="Enter your school code to connect to your school's management platform."
        features={[
          "Access attendance, grades, and school updates",
          "Communicate with teachers and staff",
          "View fee statements and make payments",
          "Stay informed with real-time notifications",
          "Available for parents, teachers, and staff",
        ]}
      />
    </div>
  )
}
