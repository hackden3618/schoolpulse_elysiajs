import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "@/shared/constants";
import { AppError } from "@/common/errors";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyPasswordOrThrow(
  password: string,
  hash: string
): Promise<void> {
  const valid = await verifyPassword(password, hash);
  if (!valid) {
    throw AppError.unauthenticated("Invalid credentials");
  }
}
