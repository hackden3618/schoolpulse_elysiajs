import * as repo from "./repository"

export async function getAllRoles() {
  return repo.findAllRoles()
}
