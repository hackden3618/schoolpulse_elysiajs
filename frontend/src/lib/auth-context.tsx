import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { authApi, setAccessToken, getAccessToken, setPlatformToken } from "./api"
import type { AuthState, User, Membership, School, Role } from "../types"

interface AuthContextType extends AuthState {
  login: (login: string, password: string) => Promise<{ allMemberships: Membership[], allSchools: School[], user: User }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  switchSchool: (membershipId: string) => Promise<void>
  switchRole: (role: Role) => void
  switchContext: (membershipId: string) => Promise<void>
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
    allMemberships: [],
    allSchools: [],
  })

  const applyAuth = useCallback((stored: StoredAuth) => {
    setAccessToken(stored.accessToken)
    const roles = stored.membership?.roles?.map((r: any) => r.role || r) || []
    const allMemberships = stored.allMemberships || [stored.membership]
    const allSchools = stored.allSchools || [stored.school]

    const savedRoleId = localStorage.getItem("schoolpulse:activeRole")
    const activeRole = savedRoleId
      ? roles.find((r: any) => r.id === savedRoleId) || roles[0] || null
      : roles.length > 0 ? roles[0] : null

    setState({
      user: stored.user,
      membership: stored.membership,
      school: stored.school,
      accessToken: stored.accessToken,
      isAuthenticated: true,
      isLoading: false,
      activeRole,
      roles,
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
    const res = await authApi.switchSchool({ membershipId })
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

  const switchRole = useCallback((role: Role) => {
    localStorage.setItem("schoolpulse:activeRole", role.id)
    setState((s) => ({ ...s, activeRole: role }))
  }, [])

  /**
   * Switches the active membership (and therefore the JWT roles/permissions)
   * by re-issuing a token for the chosen membership. This lets a user who is
   * e.g. both a Super Admin and a Parent in the same school adopt the
   * Parent context so guardian-scoped endpoints are authorized.
   */
  const switchContext = useCallback(async (membershipId: string) => {
    const res = await authApi.switchSchool({ membershipId })
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

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshAuth, switchSchool, switchRole, switchContext }}>
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
