import { LoadingScreen } from "./components/ui/LoadingScreen"
import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./lib/auth-context"
import { AppShell } from "./components/shell/AppShell"
import { LoginPage } from "./pages/auth/LoginPage"
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage"
import { SchoolRegistrationPage } from "./pages/onboarding/SchoolRegistrationPage"
import { SchoolSetupPage } from "./pages/onboarding/SchoolSetupPage"
import { OnboardingCompletePage } from "./pages/onboarding/OnboardingCompletePage"
import { Dashboard } from "./pages/Dashboard"
import { StudentList } from "./pages/students/StudentList"
import { StudentDetail } from "./pages/students/StudentDetail"
import { CreateStudent } from "./pages/students/CreateStudent"
import { AttendancePage } from "./pages/attendance/AttendancePage"
import { FinancePage } from "./pages/finance/FinancePage"
import { AcademicsPage } from "./pages/academics/AcademicsPage"
import { ExamsPage } from "./pages/exams/ExamsPage"
import { CommunicationPage } from "./pages/communication/CommunicationPage"
import { ReportsPage } from "./pages/reports/ReportsPage"
import { SettingsPage } from "./pages/settings/SettingsPage"
import { UserListPage } from "./pages/users/UserListPage"
import { CreateUserPage } from "./pages/users/CreateUserPage"
import { EditUserPage } from "./pages/users/EditUserPage"
import { PlatformLoginPage } from "./pages/platform/PlatformLoginPage"
import { PlatformDashboard } from "./pages/platform/PlatformDashboard"

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth routes (outside AppShell) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/register" element={<SchoolRegistrationPage />} />
        <Route path="/onboarding/register" element={<SchoolRegistrationPage />} />
        <Route path="/setup" element={<SchoolSetupPage />} />
        <Route path="/onboarding/setup" element={<SchoolSetupPage />} />
        <Route path="/onboarding/complete" element={<OnboardingCompletePage />} />

        {/* Platform Admin routes (outside AppShell) */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route path="/platform/dashboard" element={<PlatformDashboard />} />

        {/* App routes (inside AppShell) */}
        <Route path="/*" element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<StudentList />} />
                <Route path="/students/create" element={<CreateStudent />} />
                <Route path="/students/:id" element={<StudentDetail />} />
                <Route path="/users" element={<UserListPage />} />
                <Route path="/users/create" element={<CreateUserPage />} />
                <Route path="/users/:userId" element={<EditUserPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/academics" element={<AcademicsPage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/assessments" element={<ExamsPage />} />
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
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}
