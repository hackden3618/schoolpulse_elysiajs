export const UX_MIN_DELAY = 200

export async function withMinDelay<T>(
  promise: Promise<T>,
  minMs: number = UX_MIN_DELAY
): Promise<T> {
  const start = Date.now()
  const result = await promise
  const elapsed = Date.now() - start
  const remaining = Math.max(0, minMs - elapsed)
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining))
  }
  return result
}

/**
 * Normalise a Kenyan phone number to E.164 international format
 * (e.g. "0712345678" → "+254712345678").
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.trim()
  if (cleaned.startsWith("+")) return cleaned
  if (cleaned.startsWith("0")) return "+254" + cleaned.slice(1)
  if (cleaned.startsWith("254")) return "+" + cleaned
  return cleaned
}
