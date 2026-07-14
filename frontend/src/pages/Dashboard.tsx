import { useAuth } from "../lib/auth-context"
import { GuardianDashboard } from "./dashboards/GuardianDashboard"
import { TeacherDashboard } from "./dashboards/TeacherDashboard"
import { BursarDashboard } from "./dashboards/BursarDashboard"
import { AdminDashboard } from "./dashboards/AdminDashboard"

export function Dashboard() {
  const { activeRole } = useAuth()

  switch (activeRole?.name) {
    case "Guardian":
      return <GuardianDashboard />
    case "Teacher":
      return <TeacherDashboard />
    case "Bursar":
      return <BursarDashboard />
    default:
      return <AdminDashboard />
  }
}
