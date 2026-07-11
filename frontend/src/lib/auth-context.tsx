import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { authApi, setAccessToken, getAccessToken } from "./api"
import type { AuthState, User, Membership, School } from "../types"

interface AuthContextType extends AuthState {
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  switchRole: (role: Role) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = "schoolpulse:auth"

interface StoredAuth {
  accessToken: string
  refreshToken: string
  user: User
  membership: Membership
  school: School
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
  })

  const applyAuth = useCallback((stored: StoredAuth) => {
    setAccessToken(stored.accessToken)
    const roles = stored.membership?.roles?.map((r: any) => r.role || r) || []
    
    // Check if there is a saved activeRole in localStorage
    const savedRoleId = localStorage.getItem("schoolpulse:activeRole")
    const activeRole = roles.find((r: any) => r.id === savedRoleId) || roles[0] || null

    if (activeRole) {
      localStorage.setItem("schoolpulse:activeRole", activeRole.id)
    }

    setState({
      user: stored.user,
      membership: stored.membership,
      school: stored.school,
      accessToken: stored.accessToken,
      isAuthenticated: true,
      isLoading: false,
      activeRole,
      roles,
    })
  }, [])

  const clearAuth = useCallback(() => {
    setAccessToken(null)
    clearStoredAuth()
    localStorage.removeItem("schoolpulse:activeRole")
    setState({
      user: null,
      membership: null,
      school: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      activeRole: null,
      roles: [],
    })
  }, [])

  const mountTime = useRef(Date.now())

  useEffect(() => {
    const stored = loadStoredAuth()
    const elapsed = Date.now() - mountTime.current
    const remaining = Math.max(0, 1000 - elapsed)

    const timer = setTimeout(() => {
      if (stored) {
        applyAuth(stored)
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }, remaining)

    return () => clearTimeout(timer)
  }, [applyAuth])

  useEffect(() => {
    const handler = () => {
      clearAuth()
    }
    window.addEventListener("auth:unauthorized", handler)
    return () => window.removeEventListener("auth:unauthorized", handler)
  }, [clearAuth])

  const login = useCallback(async (loginStr: string, password: string) => {
    const res = await authApi.login({ login: loginStr, password })
    const { accessToken, refreshToken, user, membership, school } = res.data

    const stored: StoredAuth = { accessToken, refreshToken, user, membership, school }
    storeAuth(stored)
    applyAuth(stored)
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

  const switchRole = useCallback((role: Role) => {
    localStorage.setItem("schoolpulse:activeRole", role.id)
    setState((s) => ({ ...s, activeRole: role }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshAuth, switchRole }}>
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
