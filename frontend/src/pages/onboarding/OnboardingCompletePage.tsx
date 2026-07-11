import { useNavigate } from "react-router-dom"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Logo } from "../../components/ui/Logo"
import { Button } from "../../components/ui/Button"

export function OnboardingCompletePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500 mb-6">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-primary-900">Welcome aboard!</h2>
        <p className="mt-2 text-sm text-primary-500">
          Your admin account has been created. Let's set up your school to get started.
        </p>
        <Button className="mt-8 w-full" onClick={() => navigate("/onboarding/school-profile", { replace: true })}>
          Continue Setup <ArrowRight size={16} />
        </Button>
        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          className="mt-3 text-sm text-primary-400 hover:text-primary-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
