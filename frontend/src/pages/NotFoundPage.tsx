import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 mb-6">
        <span className="text-3xl font-bold text-surface-400">404</span>
      </div>
      <h1 className="text-2xl font-bold text-primary-900 mb-2">Page not found</h1>
      <p className="text-surface-500 mb-8 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
