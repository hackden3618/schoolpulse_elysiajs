import { useState, useEffect, useCallback, useRef } from "react"
import { withMinDelay } from "./ux"
import type { ApiResponse } from "../types"

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string
}

export interface UseApiReturn<T> extends UseApiState<T> {
  refresh: () => Promise<void>
  setData: (data: T | null) => void
}

export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = [],
  enabled: boolean = true,
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState("")
  const cancelledRef = useRef(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await withMinDelay(fetcher())
      if (!cancelledRef.current) setData(res.data)
    } catch (e) {
      if (!cancelledRef.current) setError(e instanceof Error ? e.message : "An error occurred")
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    cancelledRef.current = false
    refresh()
    return () => { cancelledRef.current = true }
  }, [refresh, enabled])

  return { data, loading, error, refresh, setData }
}
