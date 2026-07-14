import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, AlertCircle, CheckCircle, KeyRound, UserPlus, Info } from "lucide-react"
import { schoolsApi, setAccessToken } from "../../lib/api"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { BrandedHero } from "../../components/ui/BrandedHero"
import { normalizePhone } from "../../lib/ux"

type FieldErrors = {
  schoolCode?: string
  oneTimeCode?: string
  firstName?: string
  lastName?: string
  rawPhone?: string
  email?: string
}

const validateStep1 = (code: string, otp: string): FieldErrors => {
  const e: FieldErrors = {}
  if (!code.trim()) e.schoolCode = "School code is required."
  else if (code.trim().length < 3) e.schoolCode = "School code is too short."
  if (!otp.trim()) e.oneTimeCode = "OTP is required."
  else if (otp.length < 4) e.oneTimeCode = "OTP must be at least 4 digits."
  return e
}

const validateStep2 = (first: string, last: string, phone: string, emailVal: string): FieldErrors => {
  const e: FieldErrors = {}
  if (!first.trim()) e.firstName = "First name is required."
  if (!last.trim()) e.lastName = "Last name is required."
  if (!phone.trim()) e.rawPhone = "Phone number is required."
  else if (phone.trim().length < 8) e.rawPhone = "Enter a valid phone number."
  if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) e.email = "Enter a valid email address."
  return e
}

export function SchoolSetupPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [schoolCode, setSchoolCode] = useState("")
    const [oneTimeCode, setOneTimeCode] = useState("")
    const [setupToken, setSetupToken] = useState("")
    const [schoolName, setSchoolName] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [rawPhone, setRaw] = useState("")
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [loading, setLoading] = useState(false)

    const handleVerifyOtp = async () => {
        setError("")
        const errs = validateStep1(schoolCode, oneTimeCode)
        setFieldErrors(errs)
        if (Object.keys(errs).length > 0) return
        setLoading(true)
        try {
            const res = await schoolsApi.verifyOtp({ schoolCode: schoolCode.toUpperCase(), oneTimeCode })
            setSetupToken(res.data.setupToken)
            setSchoolName(res.data.schoolName)
            setFieldErrors({})
            setStep(2)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed.")
        } finally {
            setLoading(false)
        }
    }

    const handleSetupAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const errs = validateStep2(firstName, lastName, rawPhone, email)
        setFieldErrors(errs)
        if (Object.keys(errs).length > 0) return
        setLoading(true)
        try {
            const phone = normalizePhone(rawPhone)
            const res = await schoolsApi.setupAdmin({
                setupToken,
                firstName,
                lastName,
                phone,
                email: email || undefined,
            })
            setAccessToken(res.data.accessToken)
            navigate("/onboarding/complete", { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Setup failed.")
        } finally {
            setLoading(false)
        }
    }

    const setField = (field: keyof FieldErrors, value: string, setter: (v: string) => void) => {
      setter(value)
      if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
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

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent">
                            {step === 1 ? <KeyRound size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-primary-900 tracking-tight">
                                {step === 1 ? "Verify your school" : "Create admin account"}
                            </h2>
                            <p className="mt-1 text-sm text-primary-500">Step {step} of 2</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-2 mb-8">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-accent" : "bg-primary-200"}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-accent" : "bg-primary-200"}`} />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-100 px-4 py-3 text-sm text-danger-700 mb-5">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-5">
                            <p className="text-sm text-primary-600">
                                Enter the school code and one-time password sent to your phone via SMS.
                            </p>
                            <div>
                              <Input label="School Code *" placeholder="e.g. NAIWES001" value={schoolCode}
                                onChange={(e) => setField("schoolCode", e.target.value.toUpperCase(), setSchoolCode)} />
                              {fieldErrors.schoolCode && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.schoolCode}</p>}
                            </div>
                            <div>
                              <Input label="One-Time Password (OTP) *" placeholder="6-digit code" value={oneTimeCode}
                                onChange={(e) => setField("oneTimeCode", e.target.value.replace(/\D/g, "").slice(0, 6), setOneTimeCode)} />
                              {fieldErrors.oneTimeCode && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.oneTimeCode}</p>}
                            </div>
                            <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Continue"}
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSetupAdmin} className="space-y-5">
                            <div className="rounded-lg bg-primary-50 border border-primary-100 p-3 text-sm">
                                <p className="font-semibold text-primary-800">{schoolName}</p>
                                <p className="text-primary-500 text-xs mt-0.5 font-mono">{schoolCode}</p>
                            </div>

                            <div className="flex items-start gap-2 rounded-lg bg-info-50 border border-info-100 p-3 text-xs text-info-700">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <span>Your OTP will be used as your initial password. You can change it after logging in.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Input label="First Name *" placeholder="John" value={firstName}
                                  onChange={(e) => setField("firstName", e.target.value, setFirstName)} />
                                {fieldErrors.firstName && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.firstName}</p>}
                              </div>
                              <div>
                                <Input label="Last Name *" placeholder="Doe" value={lastName}
                                  onChange={(e) => setField("lastName", e.target.value, setLastName)} />
                                {fieldErrors.lastName && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.lastName}</p>}
                              </div>
                            </div>
                            <div>
                              <Input label="Phone Number *" type="tel" placeholder="+254712345678" value={rawPhone}
                                onChange={(e) => setField("rawPhone", e.target.value, setRaw)} />
                              {fieldErrors.rawPhone && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.rawPhone}</p>}
                            </div>
                            <div>
                              <Input label="Email Address" type="email" placeholder="admin@school.sch.ke" value={email}
                                onChange={(e) => setField("email", e.target.value, setEmail)} />
                              {fieldErrors.email && <p className="mt-1 text-[11px] text-danger-500">{fieldErrors.email}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Setting up..." : "Complete Setup"}
                            </Button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-primary-400">
                        Already set up?{" "}
                        <Link to="/auth/login" className="font-semibold text-accent hover:text-accent-600">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <BrandedHero
                title={<>Welcome to <span className="text-accent">SchoolPulse</span></>}
                subtitle="Your school registration has been approved. Verify your school code and set up your administrator account to get started."
            />
        </div>
    )
}
