import { useState, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, AlertCircle, CheckCircle, KeyRound } from "lucide-react"
import { schoolsApi } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

export function SchoolSetupPage() {
  const navigate = useNavigate()
  const [schoolCode, setSchoolCode] = useState("")
  const [oneTimeCode, setOneTimeCode] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!schoolCode || !oneTimeCode || !firstName || !lastName || !phone || !password) {
      setError("All fields marked with * are required.")
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
      await schoolsApi.claim({
        schoolCode,
        oneTimeCode,
        firstName,
        lastName,
        phone,
        email: email || undefined,
        password,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.")
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
          <h2 className="text-2xl font-bold text-primary-900">School claimed!</h2>
          <p className="mt-2 text-sm text-primary-500">
            Your admin account has been created. You can now sign in.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-600"
          >
            <ArrowLeft size={16} />
            Go to sign in
          </Link>
        </div>
      </div>
    )
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

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent">
              <KeyRound size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Claim your school</h2>
              <p className="mt-1 text-sm text-primary-500">
                Enter the code and OTP sent via SMS to set up your admin account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="border-b border-surface-200 pb-4">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Verification</p>
              <Input label="School Code *" placeholder="e.g. NAI001" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} />
              <Input label="One-Time Code (OTP) *" placeholder="6-digit code" value={oneTimeCode} onChange={(e) => setOneTimeCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            </div>

            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Admin Account</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Last Name *" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <Input label="Phone Number *" type="tel" placeholder="+254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email Address" type="email" placeholder="admin@school.sch.ke" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password *" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input label="Confirm Password *" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Claim School"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-primary-400">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-accent hover:text-accent-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Welcome to <span className="text-accent">SchoolPulse</span>
            </h3>
            <p className="mt-4 text-primary-300 text-sm leading-relaxed">
              Your school registration has been approved. Use the school code and
              one-time password sent to your phone to set up your administrator account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
