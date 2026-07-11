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
