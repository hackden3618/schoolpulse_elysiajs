import { useState, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, AlertCircle, CheckCircle, Building2 } from "lucide-react"
import { joinRequestsApi } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"

export function SchoolRegistrationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [schoolName, setSchoolName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [adminPhone, setAdminPhone] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [county, setCounty] = useState("")
  const [town, setTown] = useState("")
  const [country, setCountry] = useState("Kenya")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    if (!schoolName || !phone) {
      setError("School name and phone are required.")
      return
    }
    setLoading(true)
    try {
      await joinRequestsApi.create({
        schoolName,
        phone,
        email: email || undefined,
        adminPhone,
        adminEmail: adminEmail || undefined,
        county: county || undefined,
        country: country || undefined,
        town: town || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500 mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-primary-900">Registration submitted</h2>
          <p className="mt-2 text-sm text-primary-500">
            Thank you! Our team will review your request and contact you within 24 hours.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-600"
          >
            <ArrowLeft size={16} />
            Back to sign in
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
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900 tracking-tight">Register your school</h2>
              <p className="mt-1 text-sm text-primary-500">Step {step} of 2</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-accent" : "bg-primary-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-accent" : "bg-primary-200"}`} />
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-primary-600">Tell us about your school to get started.</p>
              <Input label="School Name *" placeholder="e.g. St Mary's High School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              <Input label="Phone Number *" type="tel" placeholder="e.g. +254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email Address" type="email" placeholder="admin@school.sch.ke" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="border-t border-primary-100 pt-4">
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-3">Admin Contact</p>
                <Input label="Admin Phone *" type="tel" placeholder="e.g. +254712345678" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                <Input label="Admin Email" type="email" placeholder="admin@school.sch.ke" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="County *" placeholder="e.g. Nairobi" value={county} onChange={(e) => setCounty(e.target.value)} />
                <Input label="Town / City" placeholder="e.g. Westlands" value={town} onChange={(e) => setTown(e.target.value)} />
              </div>
              <Input label="Country" placeholder="Kenya" value={country} onChange={(e) => setCountry(e.target.value)} />
              <Button className="w-full" onClick={() => setStep(2)} disabled={!schoolName || !phone || !adminPhone}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-lg bg-primary-50 border border-primary-100 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-primary-800">Review your details</h3>
                <div className="text-sm text-primary-600 space-y-1">
                  <p><span className="font-medium">School:</span> {schoolName}</p>
                  <p><span className="font-medium">School Phone:</span> {phone}</p>
                  {email && <p><span className="font-medium">School Email:</span> {email}</p>}
                  <p><span className="font-medium">Admin Phone:</span> {adminPhone}</p>
                  {adminEmail && <p><span className="font-medium">Admin Email:</span> {adminEmail}</p>}
                  {county && <p><span className="font-medium">Location:</span> {county}{town ? `, ${town}` : ""}, {country}</p>}
                </div>
              </div>

              <p className="text-xs text-primary-400">
                By submitting, you agree to our Terms of Service and Privacy Policy.
              </p>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          )}

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
              Join <span className="text-accent">98+</span> schools already on SchoolPulse
            </h3>
            <ul className="mt-8 space-y-4 text-left">
              {[
                "Multi-tenant architecture with full school isolation",
                "Comprehensive student, academic & finance management",
                "Built-in communication (SMS, email, in-app)",
                "Role-based access control for staff & parents",
                "99.9% uptime with enterprise-grade security",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-primary-300">
                  <CheckCircle size={18} className="shrink-0 mt-0.5 text-accent" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
