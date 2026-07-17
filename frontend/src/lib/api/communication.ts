import type {
  ApiResponse,
  Conversation,
  Message,
  MessageTemplate,
  BroadcastResult,
  BroadcastStats,
  DeliveryReport,
  DeliveryStats,
  NotificationPreference,
  PaginatedResult,
  SmsSendResult,
  SmsSegmentInfo,
} from "../../types"

const API_BASE = "/api/v1"

let accessToken: string | null = null

function getAccessToken(): string | null {
  if (!accessToken) {
    try {
      const raw = localStorage.getItem("schoolpulse:auth")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.accessToken) accessToken = parsed.accessToken
      }
    } catch {}
  }
  return accessToken
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const token = getAccessToken()
  if (token) headers["Authorization"] = `Bearer ${token}`
  const url = `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers: { ...headers, ...options?.headers } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body?.error?.message || `Request failed: ${res.status}`
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const communicationApi = {
  templates: {
    list: (schoolId: string) =>
      request<ApiResponse<MessageTemplate[]>>(`/schools/${schoolId}/communication/templates`),

    get: (schoolId: string, templateId: string) =>
      request<ApiResponse<MessageTemplate>>(`/schools/${schoolId}/communication/templates/${templateId}`),

    create: (schoolId: string, data: { name: string; content: string; channel?: string; variables?: string[] }) =>
      request<ApiResponse<MessageTemplate>>(`/schools/${schoolId}/communication/templates`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (schoolId: string, templateId: string, data: { name?: string; content?: string; channel?: string; variables?: string[] }) =>
      request<ApiResponse<MessageTemplate>>(`/schools/${schoolId}/communication/templates/${templateId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (schoolId: string, templateId: string) =>
      request<ApiResponse<{ deleted: boolean }>>(`/schools/${schoolId}/communication/templates/${templateId}`, {
        method: "DELETE",
      }),
  },

  broadcast: {
    create: (schoolId: string, data: {
      content: string
      channel: "in_app" | "sms"
      priority?: string
      subject?: string
      scheduledAt?: string | null
      audience: { roles?: string[]; classIds?: string[]; studentIds?: string[]; allMembers?: boolean }
    }) =>
      request<ApiResponse<BroadcastResult>>(`/schools/${schoolId}/communication/broadcast`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    list: (schoolId: string, page = 1, pageSize = 20) =>
      request<ApiResponse<PaginatedResult<{ id: string; subject: string | null; channel: string; createdAt: string; scheduledAt: string | null; sentAt: string | null; _count: { receipts: number } }>>>(`/schools/${schoolId}/communication/broadcasts?page=${page}&pageSize=${pageSize}`),

    stats: (schoolId: string, messageId: string) =>
      request<ApiResponse<BroadcastStats>>(`/schools/${schoolId}/communication/broadcasts/${messageId}/stats`),
  },

  delivery: {
    list: (schoolId: string, params?: { messageId?: string; status?: string; channel?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
      const qs = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)) })
      }
      return request<ApiResponse<PaginatedResult<DeliveryReport>>>(`/schools/${schoolId}/communication/delivery?${qs}`)
    },

    stats: (schoolId: string) =>
      request<ApiResponse<DeliveryStats>>(`/schools/${schoolId}/communication/delivery/stats`),
  },

  history: {
    search: (schoolId: string, params?: { search?: string; channel?: string; messageType?: string; senderId?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
      const qs = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)) })
      }
      return request<ApiResponse<PaginatedResult<Message>>>(`/schools/${schoolId}/communication/history?${qs}`)
    },
  },

  scheduled: {
    list: (schoolId: string, page = 1, pageSize = 20) =>
      request<ApiResponse<PaginatedResult<Message>>>(`/schools/${schoolId}/communication/scheduled?page=${page}&pageSize=${pageSize}`),

    cancel: (schoolId: string, messageId: string) =>
      request<ApiResponse<{ cancelled: boolean }>>(`/schools/${schoolId}/communication/scheduled/${messageId}`, {
        method: "DELETE",
      }),
  },

  preferences: {
    get: (schoolId: string) =>
      request<ApiResponse<NotificationPreference[]>>(`/schools/${schoolId}/communication/preferences`),

    update: (schoolId: string, preferences: { channel: string; enabled: boolean; quietHoursStart?: string | null; quietHoursEnd?: string | null }[]) =>
      request<ApiResponse<NotificationPreference[]>>(`/schools/${schoolId}/communication/preferences`, {
        method: "PUT",
        body: JSON.stringify({ preferences }),
      }),
  },
}
