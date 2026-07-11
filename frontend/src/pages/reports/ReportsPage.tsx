import { BarChart3, FileDown } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"

const reportCategories = [
  { title: "Attendance Reports", description: "Daily, weekly, and term attendance summaries.", count: 3 },
  { title: "Financial Reports", description: "Fee collection, revenue, and outstanding balances.", count: 4 },
  { title: "Academic Reports", description: "Exam results, grade distributions, and report cards.", count: 3 },
  { title: "Student Reports", description: "Enrollment demographics and student statistics.", count: 2 },
  { title: "Operational Reports", description: "Staff, class, and school performance metrics.", count: 2 },
]

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export operational reports."
        actions={
          <Button variant="secondary">
            <FileDown size={16} />
            Export All
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCategories.map((cat) => (
          <Card key={cat.title} className="hover:border-primary-200 transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-primary-50 p-2.5 text-primary-500">
                  <BarChart3 size={18} />
                </div>
                <span className="text-xs font-medium text-surface-400 bg-surface-100 rounded-full px-2 py-0.5">
                  {cat.count} reports
                </span>
              </div>
              <h3 className="font-semibold text-surface-900">{cat.title}</h3>
              <p className="mt-1 text-sm text-surface-500">{cat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TODO: Backend Integration
       *
       * [ ] GET /api/v1/schools/:schoolId/reports/attendance  – Attendance reports
       * [ ] GET /api/v1/schools/:schoolId/reports/finance     – Finance reports
       * [ ] GET /api/v1/schools/:schoolId/students/:id/report-card – Report card PDF
       * All reports should support CSV export & PDF generation
       */}
    </div>
  )
}
