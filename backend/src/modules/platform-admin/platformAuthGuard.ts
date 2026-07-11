import { AppError } from "@/common/errors"
import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || "schoolpulse-dev-fallback-secret"

export function platformAuthGuard(app: any): any {
  return app.derive(({ request, headers }: any) => {
    const authHeader =
      headers["authorization"] || request?.headers?.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthenticated("Missing or invalid Authorization header")
    }

    const token = authHeader.slice(7)
    let payload: any
    try {
      payload = jwt.verify(token, SECRET)
    } catch {
      throw AppError.unauthenticated("Invalid or expired token")
    }

    if (payload.type !== "platform") {
      throw AppError.forbidden("Platform admin access required")
    }

    const platformAdmin = {
      id: payload.sub,
      role: payload.role,
      type: payload.type,
    }

    return { platformAdmin }
  })
}
