import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { authApi, setAccessToken, getAccessToken, setPlatformToken, getTokenClaims } from "./api"
import type { AuthState, User, Membership, School, Role } from "../types"
import { hasPermission as checkPermission, type Permission } from "./permissions"

interface AuthContextType extends AuthState {
  roleNames: string[]
  hasPermission: (permission: Permission) => boolean
  login: (login: string, password: string) => Promise<{ allMemberships: Membership[], allSchools: School[], user: User }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  switchSchool: (membershipId: string) => Promise<void>
  switchRole: (role: Role) => void
  switchContext: (membershipId: string, roleName?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = "schoolpulse:auth"

interface StoredAuth {
  accessToken: string
  refreshToken: string
  user: User
  membership: Membership
  school: School
  allMemberships?: Membership[]
  allSchools?: School[]
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

function storeAuth(data: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
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

  const applyAuth = useCallback((stored: StoredAuth) => {
    setAccessToken(stored.accessToken)
    const roles: Role[] = stored.membership?.roles?.map((r: any) => r.role || r) || []
    const roleNames = roles.map((r) => r.name)
    const allMemberships = stored.allMemberships || [stored.membership]
    const allSchools = stored.allSchools || [stored.school]

    // The active role is the canonical source of truth for the assumed
    // context. It is carried in the JWT claim by the backend and re-issued on
    // every role/school switch, so we derive it from the token rather than
    // from local storage (which could diverge after a school switch).
    const claims = getTokenClaims()
    const activeRoleName = claims?.activeRole
    const activeRole = activeRoleName
      ? (roles.find((r: any) => r.name === activeRoleName) ?? null)
      : (roles[0] ?? null)

    setState({
      user: stored.user,
      membership: stored.membership,
      school: stored.school,
      accessToken: stored.accessToken,
      isAuthenticated: true,
      isLoading: false,
      activeRole,
      roles,
      roleNames,
      allMemberships,
      allSchools,
    })
  }, [])

  const clearAuth = useCallback(() => {
    setAccessToken(null)
    clearStoredAuth()
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

  useEffect(() => {
    const stored = loadStoredAuth()
    if (stored) {
      applyAuth(stored)
    } else {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [applyAuth])

  useEffect(() => {
    const handler = () => {
      clearAuth()
      setPlatformToken(null)
      localStorage.removeItem("schoolpulse:platform")
    }
    window.addEventListener("auth:unauthorized", handler)
    return () => window.removeEventListener("auth:unauthorized", handler)
  }, [clearAuth])

  const login = useCallback(async (loginStr: string, password: string) => {
    const res = await authApi.login({ login: loginStr, password })
    const { accessToken, refreshToken, user, membership, school, memberships, schools } = res.data

    const allMemberships = memberships || [membership]
    const allSchools = schools || [school]

    const stored: StoredAuth = {
      accessToken, refreshToken, user, membership, school,
      allMemberships,
      allSchools,
    }
    storeAuth(stored)
    applyAuth(stored)

    return { allMemberships, allSchools, user }
  }, [applyAuth])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // proceed with local logout even if API fails
    }
    clearAuth()
  }, [clearAuth])

  const refreshAuth = useCallback(async () => {
    const stored = loadStoredAuth()
    if (!stored) {
      clearAuth()
      return
    }
    try {
      const res = await authApi.refresh(stored.refreshToken)
      const newStored: StoredAuth = {
        ...stored,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }
      storeAuth(newStored)
      applyAuth(newStored)
    } catch {
      clearAuth()
    }
  }, [applyAuth, clearAuth])

  const switchSchool = useCallback(async (membershipId: string) => {
    const sessionId = getTokenClaims()?.sessionId
    const res = await authApi.switchSchool({ membershipId, sessionId })
    const { accessToken, refreshToken, membership, school } = res.data
    const stored = loadStoredAuth()
    if (!stored) return
    const newStored: StoredAuth = {
      ...stored,
      accessToken,
      refreshToken,
      membership,
      school,
    }
    storeAuth(newStored)
    applyAuth(newStored)
  }, [applyAuth])

  const switchRole = useCallback(async (role: Role) => {
    const sessionId = getTokenClaims()?.sessionId
    // Do NOT optimistically set activeRole. The backend is the source of truth;
    // the role is only committed once the token is successfully re-issued
    // (applyAuth derives activeRole from the JWT claim). On failure the UI
    // keeps the previously authorized role, avoiding a client/backend split.
    try {
      const res = await authApi.switchRole({ roleName: role.name })
      const stored = loadStoredAuth()
      if (!stored) return
      const newStored: StoredAuth = {
        ...stored,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }
      storeAuth(newStored)
      applyAuth(newStored)
    } catch {
      // Leave activeRole as the previously authorized value.
    }
  }, [applyAuth])

  /**
   * Switches the active membership (and therefore the JWT roles/permissions)
   * by re-issuing a token for the chosen membership. This lets a user who is
   * e.g. both a Super Admin and a Parent in the same school adopt the
   * Parent context so guardian-scoped endpoints are authorized.
   */
  const switchContext = useCallback(async (membershipId: string, roleName?: string) => {
    const res = await authApi.switchSchool({ membershipId, roleName })
    const { accessToken, refreshToken, membership, school } = res.data
    const stored = loadStoredAuth()
    if (!stored) return
    const newStored: StoredAuth = {
      ...stored,
      accessToken,
      refreshToken,
      membership,
      school,
    }
    storeAuth(newStored)
    applyAuth(newStored)
  }, [applyAuth])

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
        refreshAuth,
        switchSchool,
        switchRole,
        switchContext,
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
