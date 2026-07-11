import { useState, useEffect } from "react"
import { Save, Building2, Users, CreditCard, Bell, AlertCircle, Check } from "lucide-react"
import { schoolsApi } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Skeleton } from "../../components/ui/Skeleton"
import { UX_MIN_DELAY, withMinDelay } from "../../lib/ux"
import type { School } from "../../types"

export function SettingsPage() {
  const { school: authSchool } = useAuth()
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await withMinDelay(schoolsApi.get(authSchool!.id))
      setSchool(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load school profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!school) return
    setSaving(true)
    setSaved(false)
    try {
      await schoolsApi.update(authSchool!.id, {
        schoolName: school.schoolName,
        schoolPhone: school.schoolPhone,
        schoolEmail: school.schoolEmail,
        schoolAddress: school.schoolAddress,
        county: school.county,
        town: school.town,
        currency: school.currency,
        timezone: school.timezone,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage school configuration and preferences." />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" /><Skeleton className="h-10" />
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="" />
        <Card><CardContent className="p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-danger-500 mb-3" />
          <p className="text-sm text-danger-700">{error}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={load}>Retry</Button>
        </CardContent></Card>
      </div>
    )
  }

  if (!school) return null

  const sections = [
    {
      id: "school",
      icon: Building2,
      title: "School Profile",
      fields: [
        { label: "School Name", key: "schoolName", type: "text" },
        { label: "School Code", key: "schoolCode", type: "text", readonly: true },
        { label: "Phone", key: "schoolPhone", type: "tel" },
        { label: "Email", key: "schoolEmail", type: "email" },
        { label: "Address", key: "schoolAddress", type: "text" },
        { label: "County", key: "county", type: "text" },
        { label: "Town/City", key: "town", type: "text" },
      ],
    },
    {
      id: "academics",
      icon: Users,
      title: "Academic Settings",
      fields: [
        { label: "School Level", key: "schoolLevel", type: "text", readonly: true },
        { label: "Timezone", key: "timezone", type: "text" },
      ],
    },
    {
      id: "finance",
      icon: CreditCard,
      title: "Finance Settings",
      fields: [
        { label: "Currency", key: "currency", type: "text" },
        { label: "Subscription Plan", key: "subscriptionPlan", type: "text", readonly: true },
        { label: "Subscription Status", key: "subscriptionStatus", type: "text", readonly: true },
      ],
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      fields: [
        { label: "SMS Provider", key: "sms", type: "text", readonly: true, value: "Africa's Talking" },
        { label: "Email Provider", key: "email", type: "text", readonly: true, value: "SendGrid" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage school configuration and preferences."
        actions={
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success-700 bg-success-50 px-3 py-1.5 rounded-full">
                <Check size={12} /> Saved
              </span>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-primary-50 p-2 text-primary-500">
                    <Icon size={18} />
                  </div>
                  <h2 className="text-lg font-semibold text-surface-900">{section.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field) => {
                    const value = "value" in field ? (field as any).value : (school as any)[field.key] ?? ""
                    return (
                      <Input
                        key={field.key}
                        label={field.label}
                        value={value}
                        readOnly={field.readonly}
                        onChange={(e) => {
                          if (!field.readonly) {
                            setSchool({ ...school, [field.key]: e.target.value })
                          }
                        }}
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
