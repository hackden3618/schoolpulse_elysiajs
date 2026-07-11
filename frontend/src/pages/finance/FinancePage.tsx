import { DollarSign, Plus, Search } from "lucide-react"
import { PageHeader } from "../../components/shell/PageHeader"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge, type BadgeVariant } from "../../components/ui/Badge"
import { Button } from "../../components/ui/Button"
import { Table } from "../../components/ui/Table"

const mockInvoices = [
  { id: "1", student: "Mary Wanjiku", term: "Term 1 2026", total: 45000, balance: 0, status: "paid", dueDate: "2026-02-15" },
  { id: "2", student: "John Kamau", term: "Term 1 2026", total: 45000, balance: 15000, status: "partial", dueDate: "2026-02-15" },
  { id: "3", student: "Grace Akinyi", term: "Term 1 2026", total: 55000, balance: 55000, status: "overdue", dueDate: "2026-02-15" },
  { id: "4", student: "Peter Omondi", term: "Term 1 2026", total: 45000, balance: 0, status: "paid", dueDate: "2026-02-15" },
  { id: "5", student: "Faith Muthoni", term: "Term 1 2026", total: 50000, balance: 50000, status: "pending", dueDate: "2026-03-01" },
]

const statusVariant: Record<string, BadgeVariant> = {
  paid: "success",
  partial: "warning",
  overdue: "danger",
  pending: "info",
  cancelled: "default",
}

const summaryCards = [
  { label: "Total Collected", value: "Ksh 3.2M", change: "+12% vs last term" },
  { label: "Outstanding", value: "Ksh 1.1M", change: "23 invoices overdue" },
  { label: "Collection Rate", value: "74%", change: "Target: 90%" },
]

export function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Fee structures, invoices, payments and receipts."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary">
              <DollarSign size={16} />
              Record Payment
            </Button>
            <Button>
              <Plus size={16} />
              Generate Invoices
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <p className="text-sm text-surface-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{card.value}</p>
              <p className="mt-1 text-xs text-surface-400">{card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-surface-100">
            <h3 className="text-lg font-semibold text-surface-900">Invoices</h3>
            <div className="relative w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="text" placeholder="Search invoices..." className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-2 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <Table
            columns={[
              { key: "student", header: "Student", render: (i) => <span className="font-medium">{i.student}</span> },
              { key: "term", header: "Term", render: (i) => i.term },
              { key: "total", header: "Total", render: (i) => `Ksh ${i.total.toLocaleString()}` },
              { key: "balance", header: "Balance", render: (i) => i.balance === 0 ? <span className="text-success-500">Paid</span> : `Ksh ${i.balance.toLocaleString()}` },
              { key: "status", header: "Status", render: (i) => <Badge variant={statusVariant[i.status]}>{i.status}</Badge> },
              { key: "due", header: "Due Date", render: (i) => i.dueDate },
            ]}
            data={mockInvoices}
          />
        </CardContent>
      </Card>

      {/* TODO: Backend Integration
       *
       * [ ] GET    /api/v1/schools/:schoolId/fee-structures            – Fee structures
       * [ ] POST   /api/v1/schools/:schoolId/fee-structures            – Create
       * [ ] POST   /api/v1/schools/:schoolId/invoices/generate         – Generate term invoices
       * [ ] GET    /api/v1/schools/:schoolId/invoices                  – List/search
       * [ ] GET    /api/v1/schools/:schoolId/students/:id/statement    – Student statement
       * [ ] POST   /api/v1/schools/:schoolId/payments/manual           – Record payment
       * [ ] POST   /api/v1/schools/:schoolId/payments/mpesa/stk        – M-Pesa STK push
       * [ ] POST   /api/v1/schools/:schoolId/payments/:id/reverse      – Reverse
       * [ ] GET    /api/v1/schools/:schoolId/reports/finance           – Finance reports
       * [ ] POST   /api/v1/schools/:schoolId/fee-reminders/send        – Send reminders
       */}
    </div>
  )
}
