import { Plus, Search } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Table } from "../../components/ui/Table"

const mockSessions = [
  { id: "1", className: "4 East", date: "2026-07-10", sessionType: "morning", status: "open", present: 38, total: 42 },
  { id: "2", className: "5 West", date: "2026-07-10", sessionType: "morning", status: "locked", present: 35, total: 36 },
  { id: "3", className: "6 North", date: "2026-07-10", sessionType: "afternoon", status: "open", present: 30, total: 33 },
  { id: "4", className: "7 South", date: "2026-07-09", sessionType: "full_day", status: "locked", present: 28, total: 28 },
]

export function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and manage daily attendance records."
        actions={
          <Button>
            <Plus size={16} />
            New Session
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b border-surface-100">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="text" placeholder="Search by class or date..." className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-2 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <Table
            columns={[
              { key: "class", header: "Class", render: (s) => <span className="font-medium">{s.className}</span> },
              { key: "date", header: "Date", render: (s) => s.date },
              { key: "type", header: "Session", render: (s) => <span className="capitalize">{s.sessionType.replace("_", " ")}</span> },
              { key: "attendance", header: "Attendance", render: (s) => `${s.present}/${s.total}` },
              { key: "status", header: "Status", render: (s) => <Badge variant={s.status === "open" ? "warning" : "success"}>{s.status}</Badge> },
            ]}
            data={mockSessions}
          />
        </CardContent>
      </Card>

      {/* TODO: Backend Integration
       *
       * [ ] GET    /api/v1/schools/:schoolId/attendance/sessions              – List
       * [ ] POST   /api/v1/schools/:schoolId/attendance/sessions              – Create
       * [ ] GET    /api/v1/schools/:schoolId/attendance/sessions/:id          – Detail with records
       * [ ] PUT    /api/v1/schools/:schoolId/attendance/sessions/:id/records  – Save marks
       * [ ] POST   /api/v1/schools/:schoolId/attendance/sessions/:id/lock     – Lock
       * [ ] PATCH  /api/v1/schools/:schoolId/attendance/records/:id           – Edit
       * [ ] GET    /api/v1/schools/:schoolId/reports/attendance               – Attendance report
       */}
    </div>
  )
}
