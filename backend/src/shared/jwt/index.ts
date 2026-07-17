import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || "schoolpulse-dev-fallback-secret"
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

export interface JwtPayload {
  sub: string
  schoolId: string
  membershipId?: string | null
  roles: string[]
  /** Stable per-login session identifier for tracing and session management. */
  sessionId?: string
  /** The role currently assumed by the user (view/switch context). */
  activeRole?: string | null
  joinRequestId?: string
}

export function signToken(payload: JwtPayload, options?: { expiresIn?: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: (options?.expiresIn || EXPIRES_IN) as any })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload
}
