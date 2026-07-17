import { lazy, Suspense } from "react"
import { LoadingScreen } from "./components/ui/LoadingScreen"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AuthProvider, useAuth } from "./lib/auth-context"
import { getNavigation } from "./lib/constants"
import { ToastProvider } from "./components/ui/Toast"

// Auth page — loaded eagerly
import { LoginPage } from "./pages/auth/LoginPage"

// Shell + sample pages — lazy-loaded
const AppShell = lazy(() => import("./components/shell/AppShell").then((m) => ({ default: m.AppShell })))
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })))
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })))

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />

          <Route path="/*" element={
            <RequireAuth>
              <Suspense fallback={<LoadingScreen />}>
                <AppShell>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/profile" element={<ProfilePage />} />
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

// Permission-driven guard: if the active role's effective permissions no
// longer include a route, redirect to the dashboard. Navigation is itself
// derived from permissions, so this is defense-in-depth.
function RoleGuard({ children }: { children: React.ReactNode }) {
  const { activeRole, isLoading, isAuthenticated, roleNames } = useAuth()
  const location = useLocation()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!activeRole?.name) return <>{children}</>
  const allowed = getNavigation(roleNames, activeRole?.name).flatMap((g) => g.items.map((i) => i.href))
  const isAllowed = allowed.some((path) => location.pathname === path || location.pathname.startsWith(path + "/"))
  if (!isAllowed) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// Keep RoleGuard referenced for future feature routes.
void RoleGuard
