export const UX_MIN_DELAY = 500

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
 * Normalise a Kenyan phone number to the international format required
 * by the Safaricom Daraja API (e.g. "0712345678" → "254712345678").
 */
export function normalizePhone(phone: string): string {
  return phone
    .trim()
    .replace(/^\+/, "")   // strip leading +
    .replace(/^0/, "254") // replace leading 0 with country code
}
