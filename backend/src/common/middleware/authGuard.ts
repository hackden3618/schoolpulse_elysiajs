import { AppError } from "@/common/errors"
import { verifyToken } from "@/shared/jwt"
import type { JwtPayload } from "@/shared/jwt"

export interface AuthUser extends JwtPayload {
  userId: string
}

export function authGuard(app: any): any {
  return app.derive(({ request, params, headers }: any) => {
    const authHeader = headers["authorization"] || request?.headers?.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthenticated("Missing or invalid Authorization header")
    }

    const token = authHeader.slice(7)
    let payload: JwtPayload
    try {
      payload = verifyToken(token)
    } catch {
      throw AppError.unauthenticated("Invalid or expired token")
    }

    const authUser: AuthUser = {
      sub: payload.sub,
      userId: payload.sub,
      schoolId: payload.schoolId,
      roles: payload.roles,
    }

    const routeSchoolId = params?.schoolId
    if (routeSchoolId && routeSchoolId !== authUser.schoolId) {
      throw AppError.forbidden("School context mismatch")
    }

    return { authUser }
  })
}
