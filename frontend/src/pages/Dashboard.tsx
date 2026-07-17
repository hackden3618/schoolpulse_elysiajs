import { useAuth } from "../lib/auth-context"
import { PageHeader } from "../components/shell/PageHeader"
import { Card, CardContent } from "../components/ui/Card"
import { MOCK_DASHBOARD } from "../lib/mock/data"

export function Dashboard() {
  const { school, activeRole } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${school?.schoolName ?? "School"} — Dashboard`}
        description={`Active role: ${activeRole?.name ?? "—"} · sample data`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_DASHBOARD.stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-surface-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-primary-900">{s.value}</p>
              <p className="mt-1 text-xs text-surface-400">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-primary-900">Recent activity</h3>
          <ul className="mt-3 divide-y divide-surface-100">
            {MOCK_DASHBOARD.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-primary-800">{a.title}</p>
                  <p className="text-xs text-surface-500">{a.detail}</p>
                </div>
                <span className="text-xs text-surface-400">{a.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-surface-400">
            This is a frontend-only prototype running on in-browser sample data. Features are
            rebuilt module by module.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
