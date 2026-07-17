import { lazy, Suspense } from "react"
import { LoadingScreen } from "./components/ui/LoadingScreen"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AuthProvider, useAuth } from "./lib/auth-context"
import { getNavigation } from "./lib/constants"
import { ToastProvider } from "./components/ui/Toast"

// Auth pages — light, load eagerly
import { LoginPage } from "./pages/auth/LoginPage"
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage"
import { RegisterPage } from "./pages/auth/RegisterPage"
import { SchoolRegistrationPage } from "./pages/onboarding/SchoolRegistrationPage"
import { SchoolSetupPage } from "./pages/onboarding/SchoolSetupPage"
import { OnboardingCompletePage } from "./pages/onboarding/OnboardingCompletePage"
import { PlatformLoginPage } from "./pages/platform/PlatformLoginPage"

// Heavy pages — lazy-loaded
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard").then((m) => ({ default: m.PlatformDashboard })))
const AppShell = lazy(() => import("./components/shell/AppShell").then((m) => ({ default: m.AppShell })))
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })))
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })))
const StudentList = lazy(() => import("./pages/students/StudentList").then((m) => ({ default: m.StudentList })))
const StudentDetail = lazy(() => import("./pages/students/StudentDetail").then((m) => ({ default: m.StudentDetail })))
const CreateStudent = lazy(() => import("./pages/students/CreateStudent").then((m) => ({ default: m.CreateStudent })))
const BulkImportPage = lazy(() => import("./pages/students/BulkImportPage").then((m) => ({ default: m.BulkImportPage })))
const AttendancePage = lazy(() => import("./pages/attendance/AttendancePage").then((m) => ({ default: m.AttendancePage })))
const FinancePage = lazy(() => import("./pages/finance/FinancePage").then((m) => ({ default: m.FinancePage })))
const AcademicsPage = lazy(() => import("./pages/academics/AcademicsPage").then((m) => ({ default: m.AcademicsPage })))
const ExamsPage = lazy(() => import("./pages/exams/ExamsPage").then((m) => ({ default: m.ExamsPage })))
const CommunicationPage = lazy(() => import("./pages/communication/CommunicationPage").then((m) => ({ default: m.CommunicationPage })))
const SupportPage = lazy(() => import("./pages/support/SupportPage").then((m) => ({ default: m.SupportPage })))
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })))
const GuardianPaymentsPage = lazy(() => import("./pages/guardian/GuardianPaymentsPage").then((m) => ({ default: m.GuardianPaymentsPage })))
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })))
const UserListPage = lazy(() => import("./pages/users/UserListPage").then((m) => ({ default: m.UserListPage })))
const CreateUserPage = lazy(() => import("./pages/users/CreateUserPage").then((m) => ({ default: m.CreateUserPage })))
const EditUserPage = lazy(() => import("./pages/users/EditUserPage").then((m) => ({ default: m.EditUserPage })))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })))

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
        {/* Auth routes (outside AppShell, loaded eagerly) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/onboarding/register" element={<SchoolRegistrationPage />} />
        <Route path="/setup" element={<SchoolSetupPage />} />
        <Route path="/onboarding/setup" element={<SchoolSetupPage />} />
        <Route path="/onboarding/complete" element={<OnboardingCompletePage />} />

        {/* Platform Admin routes */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route path="/platform/dashboard" element={
          <RequireAuth>
            <Suspense fallback={<LoadingScreen />}>
              <PlatformDashboard />
            </Suspense>
          </RequireAuth>
        } />

        {/* App routes (lazy-loaded inside AppShell) */}
        <Route path="/*" element={
          <RequireAuth>
            <Suspense fallback={<LoadingScreen />}>
              <AppShell>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/students" element={<RoleGuard><StudentList /></RoleGuard>} />
                    <Route path="/students/create" element={<RoleGuard><CreateStudent /></RoleGuard>} />
                    <Route path="/students/import" element={<RoleGuard><BulkImportPage /></RoleGuard>} />
                    <Route path="/students/imports" element={<Navigate to="/students/import" replace />} />
                    <Route path="/students/:id" element={<RoleGuard><StudentDetail /></RoleGuard>} />
                    <Route path="/users" element={<RoleGuard><UserListPage /></RoleGuard>} />
                    <Route path="/users/create" element={<RoleGuard><CreateUserPage /></RoleGuard>} />
                    <Route path="/users/:userId" element={<RoleGuard><EditUserPage /></RoleGuard>} />
                    <Route path="/attendance" element={<RoleGuard><AttendancePage /></RoleGuard>} />
                    <Route path="/finance" element={<RoleGuard><FinancePage /></RoleGuard>} />
                    <Route path="/academics" element={<RoleGuard><AcademicsPage /></RoleGuard>} />
                    <Route path="/exams" element={<RoleGuard><ExamsPage /></RoleGuard>} />
                    <Route path="/assessments" element={<RoleGuard><ExamsPage /></RoleGuard>} />
                    <Route path="/payments" element={<RoleGuard><GuardianPaymentsPage /></RoleGuard>} />
                    <Route path="/communication" element={<RoleGuard><CommunicationPage /></RoleGuard>} />
                    <Route path="/support" element={<RoleGuard><SupportPage /></RoleGuard>} />
                    <Route path="/reports" element={<RoleGuard><ReportsPage /></RoleGuard>} />
                    <Route path="/settings" element={<RoleGuard><SettingsPage /></RoleGuard>} />
                    <Route path="/settings/system" element={<RoleGuard><SettingsPage /></RoleGuard>} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </AppShell>
            </Suspense>
          </RequireAuth>
        } />
      </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { activeRole, isLoading, isAuthenticated, roleNames } = useAuth()
  const location = useLocation()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!activeRole?.name) return <>{children}</>
  const isGuardian = activeRole.name === "Guardian"
  // Allow guardians to view individual student profiles
  if (isGuardian && location.pathname.startsWith("/students/") && location.pathname !== "/students") return <>{children}</>
  const allowed = getNavigation(roleNames, activeRole?.name).flatMap((g) => g.items.map((i) => i.href))
  const isAllowed = allowed.some((path) => location.pathname === path || location.pathname.startsWith(path + "/"))
  if (!isAllowed) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
