import { Logo } from "./Logo"
import { CheckCircle } from "lucide-react"

interface BrandedHeroProps {
  title: React.ReactNode
  subtitle?: string
  features?: string[]
}

export function BrandedHero({ title, subtitle, features }: BrandedHeroProps) {
  return (
    <div className="fixed right-0 top-0 hidden h-screen w-1/2 lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,157,71,0.08),transparent_50%)]" />
      <div className="absolute inset-0 flex items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 shadow-lg shadow-accent/5">
            <Logo size={48} className="text-accent" />
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-4 text-primary-300 text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
          {features && features.length > 0 && (
            <ul className="mt-8 space-y-3 text-left">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-primary-300">
                  <CheckCircle size={18} className="shrink-0 mt-0.5 text-accent" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
