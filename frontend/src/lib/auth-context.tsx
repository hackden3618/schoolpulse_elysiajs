import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { AuthState, User, Membership, School, Role } from "../types"
import { hasPermission as checkPermission, type Permission } from "./permissions"
import {
  MOCK_USER,
  MOCK_MEMBERSHIPS,
  MOCK_SCHOOLS,
  MOCK_ROLES,
  type MockMembership,
} from "./mock/data"

interface AuthContextType extends AuthState {
  roleNames: string[]
  hasPermission: (permission: Permission) => boolean
  login: (login: string, password: string) => Promise<{ allMemberships: Membership[]; allSchools: School[]; user: User }>
  logout: () => void
  switchSchool: (membershipId: string) => void
  switchRole: (role: Role) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = "schoolpulse:auth"

interface StoredSession {
  membershipId: string
  activeRoleName?: string
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

function saveSession(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function buildSchool(s: { id: string; name: string; code: string; level: string; county: string }): School {
  return {
    id: s.id,
    schoolName: s.name,
    schoolCode: s.code,
    schoolLevel: s.level as any,
    county: s.county,
    schoolPhone: "",
    postOffice: "",
    town: "",
    country: "Kenya",
    currency: "KES",
    timezone: "Africa/Nairobi",
    subscriptionPlan: "trial" as any,
    subscriptionStatus: "active" as any,
    schoolTier: "standard" as any,
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as School
}

function membershipToAuth(mem: MockMembership, activeRoleName?: string) {
  const roles: Role[] = mem.roles as unknown as Role[]
  const roleNames = roles.map((r) => r.name)
  const school = MOCK_SCHOOLS.find((s) => s.id === mem.schoolId)!
  const activeRole = activeRoleName
    ? (roles.find((r) => r.name === activeRoleName) ?? roles[0] ?? null)
    : (roles[0] ?? null)

  const user: User = {
    id: MOCK_USER.id,
    firstName: MOCK_USER.firstName,
    lastName: MOCK_USER.lastName,
    phone: MOCK_USER.phone,
    email: MOCK_USER.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as User

  const membership: Membership = {
    id: mem.id,
    userId: mem.userId,
    schoolId: mem.schoolId,
    roles: roles.map((r) => ({ id: r.id, role: r, membershipId: mem.id, roleId: r.id })),
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Membership

  const schoolOut: School = buildSchool(school)

  return { user, membership, school: schoolOut, roles, roleNames, activeRole }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    membership: null,
    school: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    activeRole: null,
    roles: [],
    roleNames: [],
    allMemberships: [],
    allSchools: [],
  })

  const applySession = useCallback((mem: MockMembership, activeRoleName?: string) => {
    const derived = membershipToAuth(mem, activeRoleName)
    const allMemberships = MOCK_MEMBERSHIPS.map(
      (m) => membershipToAuth(m).membership
    )
    const allSchools = MOCK_SCHOOLS.map((s) => buildSchool(s))
    setState({
      user: derived.user,
      membership: derived.membership,
      school: derived.school,
      accessToken: "mock-token",
      isAuthenticated: true,
      isLoading: false,
      activeRole: derived.activeRole,
      roles: derived.roles,
      roleNames: derived.roleNames,
      allMemberships,
      allSchools,
    })
  }, [])

  useEffect(() => {
    const stored = loadSession()
    if (stored) {
      const mem = MOCK_MEMBERSHIPS.find((m) => m.id === stored.membershipId)
      if (mem) {
        applySession(mem, stored.activeRoleName)
        return
      }
    }
    setState((s) => ({ ...s, isLoading: false }))
  }, [applySession])

  const login = useCallback(
    async (_login: string, _password: string) => {
      // Frontend-only prototype: any credentials open the sample session.
      const mem = MOCK_MEMBERSHIPS[0]!
      const session = { membershipId: mem.id, activeRoleName: mem.roles[0]?.name }
      saveSession(session)
      applySession(mem, session.activeRoleName)
      const derived = membershipToAuth(mem, session.activeRoleName)
      return {
        allMemberships: MOCK_MEMBERSHIPS.map((m) => membershipToAuth(m).membership),
        allSchools: MOCK_SCHOOLS.map((s) => buildSchool(s)),
        user: derived.user,
      }
    },
    [applySession]
  )

  const logout = useCallback(() => {
    clearSession()
    setState({
      user: null,
      membership: null,
      school: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      activeRole: null,
      roles: [],
      roleNames: [],
      allMemberships: [],
      allSchools: [],
    })
  }, [])

  const switchSchool = useCallback(
    (membershipId: string) => {
      const mem = MOCK_MEMBERSHIPS.find((m) => m.id === membershipId)
      if (!mem) return
      const session = { membershipId: mem.id, activeRoleName: mem.roles[0]?.name }
      saveSession(session)
      applySession(mem, session.activeRoleName)
    },
    [applySession]
  )

  const switchRole = useCallback(
    (role: Role) => {
      const stored = loadSession()
      if (!stored) return
      const session = { membershipId: stored.membershipId, activeRoleName: role.name }
      saveSession(session)
      const mem = MOCK_MEMBERSHIPS.find((m) => m.id === stored.membershipId)
      if (mem) applySession(mem, role.name)
    },
    [applySession]
  )

  const effectiveHasPermission = useCallback(
    (permission: Permission) =>
      checkPermission(state.roleNames, permission, state.activeRole?.name ?? null),
    [state.roleNames, state.activeRole]
  )

  return (
    <AuthContext.Provider
      value={{
        ...state,
        roleNames: state.roleNames,
        hasPermission: effectiveHasPermission,
        login,
        logout,
        switchSchool,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
