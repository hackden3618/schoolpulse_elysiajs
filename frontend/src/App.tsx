import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./lib/auth-context"
import { AppShell } from "./components/shell/AppShell"
import { LoginPage } from "./pages/auth/LoginPage"
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage"
import { SchoolRegistrationPage } from "./pages/onboarding/SchoolRegistrationPage"
import { Dashboard } from "./pages/Dashboard"
import { StudentList } from "./pages/students/StudentList"
import { StudentDetail } from "./pages/students/StudentDetail"
import { AttendancePage } from "./pages/attendance/AttendancePage"
import { FinancePage } from "./pages/finance/FinancePage"
import { AcademicsPage } from "./pages/academics/AcademicsPage"
import { CommunicationPage } from "./pages/communication/CommunicationPage"
import { ReportsPage } from "./pages/reports/ReportsPage"
import { SettingsPage } from "./pages/settings/SettingsPage"
import { UserListPage } from "./pages/users/UserListPage"
import { CreateUserPage } from "./pages/users/CreateUserPage"

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth routes (outside AppShell) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/register" element={<SchoolRegistrationPage />} />

        {/* App routes (inside AppShell) */}
        <Route path="/*" element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<StudentList />} />
                <Route path="/students/:id" element={<StudentDetail />} />
                <Route path="/users" element={<UserListPage />} />
                <Route path="/users/create" element={<CreateUserPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/academics" element={<AcademicsPage />} />
                <Route path="/assessments" element={<AcademicsPage />} />
                <Route path="/communication" element={<CommunicationPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/system" element={<SettingsPage />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        } />
      </Routes>
    </AuthProvider>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}
