import { success } from "@/common/responses"
import * as svc from "./service"

export async function getRolesController() {
  const roles = await svc.getAllRoles()
  return success(roles)
}
