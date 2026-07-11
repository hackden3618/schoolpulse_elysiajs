import type {
  ApiResponse,
  School,
  User,
  Membership,
  Role,
  Student,
  AcademicYear,
  Term,
  Class,
  ClassInstance,
  Subject,
  AttendanceSession,
  AttendanceRecord,
  Exam,
  FeeStructure,
  Invoice,
  Payment,
  Conversation,
  Message,
  Notification,
  JoinRequest,
  LoginResponse,
  Assessment,
} from "../types"

const API_BASE = "/api/v1"

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }
  return headers
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  })

  if (!res.ok) {
    if (res.status === 401) {
      const event = new CustomEvent("auth:unauthorized")
      window.dispatchEvent(event)
    }
    const body = await res.json().catch(() => ({}))
    const message = body?.error?.message || `API error: ${res.status}`
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

/* =========================================================================
 * AUTHENTICATION (not yet in backend - placeholder for future)
 * ========================================================================= */

export const authApi = {
  login: (data: { login: string; password: string }) =>
    request<ApiResponse<LoginResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  refresh: (refreshToken: string) =>
    request<ApiResponse<{ accessToken: string; refreshToken: string }>>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  logout: () =>
    request<ApiResponse<void>>("/auth/logout", { method: "POST" }),
  forgotPassword: (data: { login: string }) =>
    request<ApiResponse<void>>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetPassword: (data: { token: string; password: string }) =>
    request<ApiResponse<void>>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

/* =========================================================================
 * JOIN REQUESTS (not yet in backend - placeholder)
 * ========================================================================= */

export const joinRequestsApi = {
  create: (data: { schoolName: string; phone: string; email?: string }) =>
    request<ApiResponse<JoinRequest>>("/join-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: () => request<ApiResponse<JoinRequest[]>>("/join-requests"),
}

/* =========================================================================
 * SCHOOLS
 * ========================================================================= */

export const schoolsApi = {
  list: () => request<ApiResponse<School[]>>("/schools"),
  get: (id: string) => request<ApiResponse<School>>(`/schools/${id}`),
  create: (data: Partial<School>) =>
    request<ApiResponse<School>>("/schools", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<School>) =>
    request<ApiResponse<School>>(`/schools/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getSubscription: (id: string) =>
    request<ApiResponse<School>>(`/schools/${id}/subscription`),
  updateSubscription: (id: string, data: Record<string, unknown>) =>
    request<ApiResponse<School>>(`/schools/${id}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/* =========================================================================
 * USERS & MEMBERSHIPS
 * Backend returns: success(data) = { data: T[], meta: { requestId, schoolId } }
 * ========================================================================= */

export const usersApi = {
  list: (schoolId: string) =>
    request<ApiResponse<User[]>>(`/schools/${schoolId}/users`),
  get: (schoolId: string, userId: string) =>
    request<ApiResponse<User>>(`/schools/${schoolId}/users/${userId}`),
  create: (schoolId: string, data: {
    firstName: string
    secondName?: string
    lastName: string
    phone: string
    email?: string
    password?: string
  }) =>
    request<ApiResponse<User>>(`/schools/${schoolId}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (schoolId: string, userId: string, data: Partial<User>) =>
    request<ApiResponse<User>>(`/schools/${schoolId}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

export const membershipsApi = {
  list: (schoolId: string) =>
    request<ApiResponse<Membership[]>>(`/schools/${schoolId}/memberships`),
  create: (schoolId: string, data: { userId: string; roleIds?: string[] }) =>
    request<ApiResponse<Membership>>(`/schools/${schoolId}/memberships`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (schoolId: string, membershipId: string, data: { status: string }) =>
    request<ApiResponse<Membership>>(`/schools/${schoolId}/memberships/${membershipId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  assignRoles: (schoolId: string, membershipId: string, roleIds: string[]) =>
    request<ApiResponse<Membership>>(`/schools/${schoolId}/memberships/${membershipId}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roleIds }),
    }),
}

/* =========================================================================
 * ROLES (not yet in backend)
 * ========================================================================= */

export const rolesApi = {
  list: () => request<ApiResponse<Role[]>>("/roles"),
}

/* =========================================================================
 * STUDENTS
 * Backend returns: success(data) = { data: T, meta: { requestId, schoolId } }
 * ========================================================================= */

export const studentsApi = {
  list: (schoolId: string) =>
    request<ApiResponse<Student[]>>(`/schools/${schoolId}/students`),
  get: (schoolId: string, studentId: string) =>
    request<ApiResponse<Student>>(`/schools/${schoolId}/students/${studentId}`),
  create: (schoolId: string, data: {
    firstName: string
    secondName?: string
    lastName: string
    dateOfBirth: string
    admissionNumber: string
    gender?: "male" | "female"
    classInstanceId?: string
    academicYearId?: string
    termId?: string
  }) =>
    request<ApiResponse<Student>>(`/schools/${schoolId}/students`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (schoolId: string, studentId: string, data: Partial<Student>) =>
    request<ApiResponse<Student>>(`/schools/${schoolId}/students/${studentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  archive: (schoolId: string, studentId: string, data: { reason: string; details?: string }) =>
    request<ApiResponse<Student>>(`/schools/${schoolId}/students/${studentId}/archive`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  addGuardian: (schoolId: string, studentId: string, data: {
    guardianId: string
    relationship?: string
    isPrimary?: boolean
    canPay?: boolean
    receivesSms?: boolean
    receivesEmail?: boolean
  }) =>
    request<ApiResponse<void>>(`/schools/${schoolId}/students/${studentId}/guardians`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeGuardian: (schoolId: string, studentId: string, guardianId: string) =>
    request<ApiResponse<void>>(`/schools/${schoolId}/students/${studentId}/guardians/${guardianId}`, { method: "DELETE" }),
  enroll: (schoolId: string, studentId: string, data: {
    classInstanceId: string
    academicYearId: string
    termId?: string
  }) =>
    request<ApiResponse<void>>(`/schools/${schoolId}/students/${studentId}/enrollments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

/* =========================================================================
 * ACADEMIC STRUCTURE
 * Backend returns: success(data) = { data: T, meta: { requestId, schoolId } }
 * ========================================================================= */

export const academicApi = {
  years: {
    list: (schoolId: string) =>
      request<ApiResponse<AcademicYear[]>>(`/schools/${schoolId}/academic-years`),
    create: (schoolId: string, data: { name: string; startDate: string; endDate: string }) =>
      request<ApiResponse<AcademicYear>>(`/schools/${schoolId}/academic-years`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (schoolId: string, id: string, data: Partial<AcademicYear>) =>
      request<ApiResponse<AcademicYear>>(`/schools/${schoolId}/academic-years/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    activate: (schoolId: string, id: string) =>
      request<ApiResponse<AcademicYear>>(`/schools/${schoolId}/academic-years/${id}/activate`, { method: "POST" }),
  },
  terms: {
    list: (schoolId: string) =>
      request<ApiResponse<Term[]>>(`/schools/${schoolId}/terms`),
    create: (schoolId: string, data: { name: string; academicYearId: string; startDate: string; endDate: string }) =>
      request<ApiResponse<Term>>(`/schools/${schoolId}/terms`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    activate: (schoolId: string, id: string) =>
      request<ApiResponse<Term>>(`/schools/${schoolId}/terms/${id}/activate`, { method: "POST" }),
  },
  classes: {
    list: (schoolId: string) =>
      request<ApiResponse<Class[]>>(`/schools/${schoolId}/classes`),
    create: (schoolId: string, data: { name: string; level: number }) =>
      request<ApiResponse<Class>>(`/schools/${schoolId}/classes`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  classInstances: {
    list: (schoolId: string) =>
      request<ApiResponse<ClassInstance[]>>(`/schools/${schoolId}/class-instances`),
    create: (schoolId: string, data: { classId: string; academicYearId: string; streamName: string }) =>
      request<ApiResponse<ClassInstance>>(`/schools/${schoolId}/class-instances`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    assignSubjects: (schoolId: string, classInstanceId: string, data: { assignments: { subjectId: string; teacherMembershipId?: string }[] }) =>
      request<ApiResponse<ClassInstance>>(`/schools/${schoolId}/class-instances/${classInstanceId}/subjects`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  subjects: {
    list: (schoolId: string) =>
      request<ApiResponse<Subject[]>>(`/schools/${schoolId}/subjects`),
    create: (schoolId: string, data: { name: string; code: string; isCompulsory?: boolean }) =>
      request<ApiResponse<Subject>>(`/schools/${schoolId}/subjects`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
}

/* =========================================================================
 * ATTENDANCE
 * ========================================================================= */

export const attendanceApi = {
  listSessions: (schoolId: string, params?: { classInstanceId?: string; sessionDate?: string }) => {
    const qs = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v))).toString() : ""
    return request<ApiResponse<AttendanceSession[]>>(`/schools/${schoolId}/attendance/sessions${qs}`)
  },
  createSession: (schoolId: string, data: { classInstanceId: string; sessionDate: string; sessionType: string }) =>
    request<ApiResponse<AttendanceSession>>(`/schools/${schoolId}/attendance/sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSession: (schoolId: string, sessionId: string) =>
    request<ApiResponse<AttendanceSession>>(`/schools/${schoolId}/attendance/sessions/${sessionId}`),
  editRecord: (schoolId: string, sessionId: string, recordId: string, data: { status: string; editReason?: string }) =>
    request<ApiResponse<AttendanceRecord>>(`/schools/${schoolId}/attendance/sessions/${sessionId}/records/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  lockSession: (schoolId: string, sessionId: string) =>
    request<ApiResponse<AttendanceSession>>(`/schools/${schoolId}/attendance/sessions/${sessionId}/lock`, { method: "POST" }),
}

/* =========================================================================
 * EXAMINATIONS
 * ========================================================================= */

export const examsApi = {
  list: (schoolId: string, termId?: string) => {
    const qs = termId ? `?termId=${termId}` : ""
    return request<ApiResponse<Exam[]>>(`/schools/${schoolId}/exams${qs}`)
  },
  get: (schoolId: string, examId: string) =>
    request<ApiResponse<Exam>>(`/schools/${schoolId}/exams/${examId}`),
  create: (schoolId: string, data: Partial<Exam>) =>
    request<ApiResponse<Exam>>(`/schools/${schoolId}/exams`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (schoolId: string, examId: string, data: Partial<Exam>) =>
    request<ApiResponse<Exam>>(`/schools/${schoolId}/exams/${examId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  publish: (schoolId: string, examId: string) =>
    request<ApiResponse<Exam>>(`/schools/${schoolId}/exams/${examId}/publish`, { method: "POST" }),
}

export const assessmentsApi = {
  create: (schoolId: string, data: { examId: string; classInstanceId: string; subjectId: string; totalMarks: number }) =>
    request<ApiResponse<Assessment>>(`/schools/${schoolId}/assessments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (schoolId: string, assessmentId: string) =>
    request<ApiResponse<Assessment>>(`/schools/${schoolId}/assessments/${assessmentId}`),
  saveResults: (schoolId: string, assessmentId: string, results: { studentId: string; attainedMarks: number; remarks?: string }[]) =>
    request<ApiResponse<Assessment>>(`/schools/${schoolId}/assessments/${assessmentId}/results`, {
      method: "POST",
      body: JSON.stringify({ results }),
    }),
  publish: (schoolId: string, assessmentId: string) =>
    request<ApiResponse<Assessment>>(`/schools/${schoolId}/assessments/${assessmentId}/publish`, { method: "POST" }),
}

/* =========================================================================
 * FINANCE
 * ========================================================================= */

export const financeApi = {
  feeStructures: {
    list: (schoolId: string) =>
      request<ApiResponse<FeeStructure[]>>(`/schools/${schoolId}/finance/fee-structures`),
    create: (schoolId: string, data: { academicYearId: string; termId: string; classId?: string; isGlobal?: boolean; items: { name: string; amount: number; optional?: boolean; description?: string }[] }) =>
      request<ApiResponse<FeeStructure>>(`/schools/${schoolId}/finance/fee-structures`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  invoices: {
    list: (schoolId: string, studentId?: string) => {
      const qs = studentId ? `?studentId=${studentId}` : ""
      return request<ApiResponse<Invoice[]>>(`/schools/${schoolId}/finance/invoices${qs}`)
    },
    generate: (schoolId: string, data: { studentId: string; feeStructureId: string; termId: string; enrollmentId?: string }) =>
      request<ApiResponse<Invoice>>(`/schools/${schoolId}/finance/invoices`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (schoolId: string, invoiceId: string) =>
      request<ApiResponse<Invoice>>(`/schools/${schoolId}/finance/invoices/${invoiceId}`),
  },
  payments: {
    list: (schoolId: string, studentId?: string) => {
      const qs = studentId ? `?studentId=${studentId}` : ""
      return request<ApiResponse<Payment[]>>(`/schools/${schoolId}/finance/payments${qs}`)
    },
    record: (schoolId: string, data: { studentId: string; invoiceId: string; amount: number; method: string; transactionRef: string }) =>
      request<ApiResponse<Payment>>(`/schools/${schoolId}/finance/payments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
}

/* =========================================================================
 * CONVERSATIONS (notifications)
 * ========================================================================= */

export const conversationsApi = {
  list: (schoolId: string) =>
    request<ApiResponse<Conversation[]>>(`/schools/${schoolId}/conversations`),
  create: (schoolId: string, data: { type: string; subject?: string; participantIds?: string[] }) =>
    request<ApiResponse<Conversation>>(`/schools/${schoolId}/conversations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (schoolId: string, conversationId: string) =>
    request<ApiResponse<Conversation>>(`/schools/${schoolId}/conversations/${conversationId}`),
  messages: {
    list: (schoolId: string, conversationId: string) =>
      request<ApiResponse<Message[]>>(`/schools/${schoolId}/conversations/${conversationId}/messages`),
    send: (schoolId: string, conversationId: string, data: { content: string; channel?: string; priority?: string }) =>
      request<ApiResponse<Message>>(`/schools/${schoolId}/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
}

/* =========================================================================
 * DASHBOARD
 * ========================================================================= */

export const dashboardApi = {
  summary: (schoolId: string) =>
    request<ApiResponse<{ students: number; activeStudents: number; staff: number; activeClasses: number; activeAcademicYear: any; activeTerm: any; attendanceToday: number; openInvoices: number; pendingPayments: number }>>(`/schools/${schoolId}/dashboard/summary`),
  activity: (schoolId: string) =>
    request<ApiResponse<{ recentPayments: any[] }>>(`/schools/${schoolId}/dashboard/activity`),
}
