import { Logo } from "./Logo"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-900 shadow-lg shadow-primary-900/20">
          <Logo size={32} className="text-white" />
        </div>
        <div className="relative flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary-100 border-t-accent animate-spin" />
        </div>
        <p className="text-sm font-medium text-primary-400 tracking-wide">
          SchoolPulse
        </p>
      </div>
    </div>
  )
}
