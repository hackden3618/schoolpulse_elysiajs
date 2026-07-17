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
    SmsTemplate,
    SmsSendResult,
    SmsSegmentInfo,
    SupportTicket,
    SupportTicketMessage,
    ImportSession,
    ImportProgress,
    PreviewSummary,
    PreviewData,
    ValidatedRow,
    ColumnMapping,
} from "../types"

const API_BASE = "/api/v1"

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
    accessToken = token
}

export function getAccessToken(): string | null {
    if (!accessToken) {
        try {
            const raw = localStorage.getItem("schoolpulse:auth")
            if (raw) {
                const parsed = JSON.parse(raw)
                if (parsed?.accessToken) {
                    accessToken = parsed.accessToken
                }
            }
        } catch { /* ignore */ }
    }
    return accessToken
}

function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const token = getAccessToken()
    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }
    return headers
}

async function apiFetch<T>(
    path: string,
    getHeaders: () => Record<string, string>,
    options?: RequestInit,
): Promise<T> {
    const url = `${API_BASE}${path}`
    const res = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...options?.headers },
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    return apiFetch(path, getAuthHeaders, options)
}

/* =========================================================================
 * AUTHENTICATION
 * ========================================================================= */

export const authApi = {
    login: (data: { login: string; password: string; membershipId?: string }) =>
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
        request<ApiResponse<{ found: boolean; message: string }>>("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    resetPassword: (data: { token: string; password: string }) =>
        request<ApiResponse<void>>("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        request<ApiResponse<void>>("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    register: (data: {
        firstName: string; secondName?: string; lastName: string;
        phone: string; email?: string; password: string; schoolCode?: string;
    }) =>
        request<ApiResponse<LoginResponse>>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    listMemberships: () =>
        request<ApiResponse<{ memberships: Membership[]; schools: School[] }>>("/auth/memberships"),
    switchSchool: (data: { membershipId?: string; schoolId?: string; roleName?: string; sessionId?: string }) =>
        request<ApiResponse<{ accessToken: string; refreshToken: string; membership: Membership; school: School }>>("/auth/switch-school", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    switchRole: (data: { roleName: string; sessionId?: string }) =>
        request<ApiResponse<{ accessToken: string; refreshToken: string }>>("/auth/switch-role", {
            method: "POST",
            body: JSON.stringify(data),
        }),
}

// Decodes the JWT payload (header.payload.signature) without verifying the
// signature — used only to read non-trust-critical claims (activeRole,
// sessionId) that the backend re-issues authoritatively.
export function getTokenClaims(): { sub?: string; activeRole?: string; sessionId?: string; roles?: string[] } | null {
    try {
        const raw = localStorage.getItem("schoolpulse:auth")
        if (!raw) return null
        const token = JSON.parse(raw)?.accessToken as string | undefined
        if (!token) return null
        const payload = token.split(".")[1]
        if (!payload) return null
        const json = typeof atob === "function"
            ? atob(payload)
            : Buffer.from(payload, "base64").toString("utf-8")
        return JSON.parse(json)
    } catch {
        return null
    }
}

/* =========================================================================
 * JOIN REQUESTS
 * ========================================================================= */

export const joinRequestsApi = {
    create: (data: { schoolName: string; phone: string; email?: string; schoolLevel?: string; county?: string; country?: string; town?: string }) =>
        publicRequest<ApiResponse<JoinRequest>>("/join-requests", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    list: () => platformRequest<ApiResponse<JoinRequest[]>>("/join-requests"),
    approve: (id: string) =>
        platformRequest<ApiResponse<{ school: any; oneTimeCode: string }>>(`/platform/join-requests/${id}/approve`, {
            method: "POST",
        }),
    reject: (id: string, reason?: string) =>
        platformRequest<ApiResponse<{ rejected: boolean }>>(`/platform/join-requests/${id}/reject`, {
            method: "POST",
            body: JSON.stringify(reason ? { reason } : {}),
        }),
    markReview: (id: string) =>
        platformRequest<ApiResponse<{ underReview: boolean }>>(`/platform/join-requests/${id}/mark-review`, {
            method: "POST",
        }),
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
    verifyOtp: (data: { schoolCode: string; oneTimeCode: string }) =>
        request<ApiResponse<{ setupToken: string; schoolName: string; schoolCode: string }>>("/schools/verify-otp", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    setupAdmin: (data: { setupToken: string; firstName: string; lastName: string; phone: string; email?: string }) =>
        request<ApiResponse<{ message: string; accessToken: string; user: { id: string; firstName: string; lastName: string; phone: string }; schoolCode: string; onboardingRequired: boolean }>>("/schools/setup-admin", {
            method: "POST",
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
    delete: (schoolId: string, userId: string) =>
        request<ApiResponse<{ message: string }>>(`/schools/${schoolId}/users/${userId}`, {
            method: "DELETE",
        }),
    me: {
        get: (schoolId: string) =>
            request<ApiResponse<User>>(`/schools/${schoolId}/users/me`),
        update: (schoolId: string, data: Partial<User>) =>
            request<ApiResponse<User>>(`/schools/${schoolId}/users/me`, {
                method: "PATCH",
                body: JSON.stringify(data),
            }),
    },
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
 * ROLES
 * ========================================================================= */

export const rolesApi = {
    list: () => request<ApiResponse<Role[]>>("/roles"),
}

/* =========================================================================
 * STUDENTS
 * Backend returns: success(data) = { data: T, meta: { requestId, schoolId } }
 * ========================================================================= */

export const studentsApi = {
    list: (schoolId: string, includeArchived?: boolean) =>
        request<ApiResponse<Student[]>>(`/schools/${schoolId}/students${includeArchived ? "?includeArchived=true" : ""}`),
    my: (schoolId: string) =>
        request<ApiResponse<Student[]>>(`/schools/${schoolId}/students/my`),
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
        specialNeeds?: Record<string, string>
        guardians?: Array<{
            firstName: string
            lastName: string
            phone: string
            email?: string
            relationship?: string
        }>
    }) =>
        request<ApiResponse<Student>>(`/schools/${schoolId}/students`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    update: (schoolId: string, studentId: string, data: {
        firstName?: string
        secondName?: string
        lastName?: string
        gender?: "male" | "female"
        dateOfBirth?: string
        performanceExpectation?: "below_expectation" | "average" | "good" | "excellent" | "exceptional"
        specialNeeds?: Record<string, string>
    }) =>
        request<ApiResponse<Student>>(`/schools/${schoolId}/students/${studentId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    archive: (schoolId: string, studentId: string, data: { reason: string; details?: string }) =>
        request<ApiResponse<Student>>(`/schools/${schoolId}/students/${studentId}/archive`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    unarchive: (schoolId: string, studentId: string) =>
        request<ApiResponse<Student>>(`/schools/${schoolId}/students/${studentId}/unarchive`, {
            method: "POST",
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
    addGuardianByDetails: (schoolId: string, studentId: string, data: {
        firstName: string
        lastName: string
        phone: string
        email?: string
        relationship?: string
        isPrimary?: boolean
    }) =>
        request<ApiResponse<void>>(`/schools/${schoolId}/students/${studentId}/guardians/by-details`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    enroll: (schoolId: string, studentId: string, data: {
        classInstanceId: string
        academicYearId: string
        termId?: string
    }) =>
        request<ApiResponse<void>>(`/schools/${schoolId}/students/${studentId}/enrollments`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateEnrollment: (schoolId: string, studentId: string, enrollmentId: string, data: {
        classInstanceId?: string
        academicYearId?: string
        termId?: string
        status?: "active" | "suspended" | "transferred" | "expelled" | "on_leave" | "medical_leave" | "truant" | "dropped_out" | "graduated"
    }) =>
        request<ApiResponse<void>>(`/schools/${schoolId}/students/${studentId}/enrollments/${enrollmentId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    generateAdmissionNumber: (schoolId: string) =>
        request<ApiResponse<{ admissionNumber: string }>>(`/schools/${schoolId}/students/admission-number`),
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
        list: (schoolId: string, academicYearId?: string) => {
            const qs = academicYearId ? `?academicYearId=${academicYearId}` : ""
            return request<ApiResponse<Term[]>>(`/schools/${schoolId}/terms${qs}`)
        },
        create: (schoolId: string, data: { name: string; academicYearId: string; startDate: string; endDate: string }) =>
            request<ApiResponse<Term>>(`/schools/${schoolId}/terms`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        update: (schoolId: string, id: string, data: { name?: string; startDate?: string; endDate?: string }) =>
            request<ApiResponse<Term>>(`/schools/${schoolId}/terms/${id}`, {
                method: "PATCH",
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
        guardianList: (schoolId: string, studentId: string) =>
            request<ApiResponse<Invoice[]>>(`/schools/${schoolId}/finance/invoices/guardian/${studentId}`),
        generate: (schoolId: string, data: { studentId: string; feeStructureId: string; termId: string; enrollmentId?: string }) =>
            request<ApiResponse<Invoice>>(`/schools/${schoolId}/finance/invoices`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        generateBulk: (schoolId: string, data: { classId: string; termId: string; feeStructureId: string }) =>
            request<ApiResponse<{ generated: number; total: number; errors: { studentId: string; reason: string }[]; invoices: Invoice[] }>>(`/schools/${schoolId}/finance/invoices/bulk`, {
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
        initiateMpesa: (schoolId: string, data: { invoiceId: string; phoneNumber: string; amount: number }) =>
            request<ApiResponse<{ checkoutRequestId: string; paymentId: string }>>(`/schools/${schoolId}/finance/mpesa/stk-push`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        initiateBulkMpesa: (schoolId: string, data: { studentId: string; allocations: { invoiceId: string; amount: number }[]; phoneNumber: string; totalAmount: number }) =>
            request<ApiResponse<{ checkoutRequestId: string; paymentId: string }>>(`/schools/${schoolId}/finance/mpesa/bulk-stk-push`, {
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
    delete: (schoolId: string, conversationId: string) =>
        request<ApiResponse<{ deleted: boolean }>>(`/schools/${schoolId}/conversations/${conversationId}`, {
            method: "DELETE",
        }),
    messages: {
        list: (schoolId: string, conversationId: string) =>
            request<ApiResponse<Message[]>>(`/schools/${schoolId}/conversations/${conversationId}/messages`),
        send: (schoolId: string, conversationId: string, data: { content: string; channel?: string; priority?: string; recipientPhones?: string[] }) =>
            request<ApiResponse<Message>>(`/schools/${schoolId}/conversations/${conversationId}/messages`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        delete: (schoolId: string, messageId: string) =>
            request<ApiResponse<{ deleted: boolean }>>(`/schools/${schoolId}/messages/${messageId}`, {
                method: "DELETE",
            }),
        edit: (schoolId: string, messageId: string, data: { content: string }) =>
            request<ApiResponse<Message>>(`/schools/${schoolId}/messages/${messageId}`, {
                method: "PATCH",
                body: JSON.stringify(data),
            }),
    },
}

export const smsApi = {
    send: (schoolId: string, data: { recipients: string[]; message: string }) =>
        request<ApiResponse<SmsSendResult>>(`/schools/${schoolId}/sms/send`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    segmentInfo: (schoolId: string, data: { message: string }) =>
        request<ApiResponse<SmsSegmentInfo>>(`/schools/${schoolId}/sms/segment-info`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    balance: (schoolId: string) =>
        request<ApiResponse<{ balance: string }>>(`/schools/${schoolId}/sms/balance`),
    templates: {
        list: (schoolId: string) =>
            request<ApiResponse<SmsTemplate[]>>(`/schools/${schoolId}/sms/templates`),
        create: (schoolId: string, data: { name: string; message: string }) =>
            request<ApiResponse<SmsTemplate>>(`/schools/${schoolId}/sms/templates`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        delete: (schoolId: string, templateId: string) =>
            request<ApiResponse<{ deleted: boolean }>>(`/schools/${schoolId}/sms/templates/${templateId}`, {
                method: "DELETE",
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

/* =========================================================================
 * REPORTS
 * ========================================================================= */

export const reportsApi = {
    summary: (schoolId: string) =>
        request<ApiResponse<Array<{ type: string; label: string; count: number }>>>(`/schools/${schoolId}/reports`),
    attendance: (schoolId: string) =>
        request<ApiResponse<{
            totalSessions: number; totalRecords: number; present: number; absent: number; late: number; excused: number; averageRate: number
        }>>(`/schools/${schoolId}/reports/attendance`),
    finance: (schoolId: string) =>
        request<ApiResponse<{
            totalInvoiced: number; totalCollected: number; totalOutstanding: number; invoicesByStatus: Array<{ status: string; count: number; totalAmount: number; outstanding: number }>
        }>>(`/schools/${schoolId}/reports/finance`),
    academic: (schoolId: string) =>
        request<ApiResponse<{
            totalExams: number; completedExams: number; totalAssessments: number; totalResults: number; publishedResults: number
        }>>(`/schools/${schoolId}/reports/academic`),
    students: (schoolId: string) =>
        request<ApiResponse<{
            total: number; active: number; byGender: Array<{ gender: string; count: number }>; byClass: Array<{ classId: string; className: string; count: number }>
        }>>(`/schools/${schoolId}/reports/students`),
}

/* =========================================================================
 * PLATFORM ADMIN (SchoolPulse Internal)
 * ========================================================================= */

let platformToken: string | null = null

export function setPlatformToken(token: string | null) {
    platformToken = token
}

export function getPlatformToken(): string | null {
    return platformToken
}

function getPlatformHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (platformToken) {
        headers["Authorization"] = `Bearer ${platformToken}`
    }
    return headers
}

async function platformRequest<T>(path: string, options?: RequestInit): Promise<T> {
    return apiFetch(path, getPlatformHeaders, options)
}

async function publicRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const url = `${API_BASE}${path}`
    const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options?.headers },
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const message = body?.error?.message || `Request failed: ${res.status}`
        throw new Error(message)
    }
    return res.json() as Promise<T>
}

export const platformAdminApi = {
    login: (data: { email: string; password: string }) =>
        publicRequest<ApiResponse<{ accessToken: string; admin: any }>>("/platform/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    listAdmins: () =>
        platformRequest<ApiResponse<any[]>>("/platform/admins"),
    createAdmin: (data: { firstName: string; lastName: string; email: string; phone: string; role?: string }) =>
        platformRequest<ApiResponse<any>>("/platform/admins", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateAdmin: (id: string, data: Record<string, unknown>) =>
        platformRequest<ApiResponse<any>>(`/platform/admins/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    deleteAdmin: (id: string) =>
        platformRequest<ApiResponse<{ deleted: boolean }>>(`/platform/admins/${id}`, {
            method: "DELETE",
        }),
    resetPassword: (id: string) =>
        platformRequest<ApiResponse<{ temporaryPassword: string }>>(`/platform/admins/${id}/reset-password`, {
            method: "POST",
        }),
    listSchools: () =>
        platformRequest<ApiResponse<any[]>>("/platform/schools"),
    deleteSchool: (id: string) =>
        platformRequest<ApiResponse<{ deleted: boolean }>>(`/platform/schools/${id}`, {
            method: "DELETE",
        }),
    listTickets: (params?: { status?: string; category?: string; q?: string }) => {
        const query = new URLSearchParams()
        if (params?.status) query.set("status", params.status)
        if (params?.category) query.set("category", params.category)
        if (params?.q) query.set("q", params.q)
        const qs = query.toString()
        return platformRequest<ApiResponse<SupportTicket[]>>(`/platform/support/tickets${qs ? `?${qs}` : ""}`)
    },
    getTicket: (ticketId: string) =>
        platformRequest<ApiResponse<SupportTicket>>(`/platform/support/tickets/${ticketId}`),
    sendTicketMessage: (ticketId: string, data: { content: string }) =>
        platformRequest<ApiResponse<{ message: SupportTicketMessage; ticket: SupportTicket }>>(`/platform/support/tickets/${ticketId}/messages`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    updateTicketStatus: (ticketId: string, data: { status: string }) =>
        platformRequest<ApiResponse<SupportTicket>>(`/platform/support/tickets/${ticketId}/status`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
}

/* =========================================================================
 * BULK IMPORT / ADMISSIONS
 * ========================================================================= */

export const importApi = {
    sessions: {
        create: (schoolId: string, data: {
            fileName: string
            fileSize: number
            fileType: "csv" | "xls" | "xlsx"
            strategy?: string
            batchSize?: number
        }) =>
            request<ApiResponse<{ sessionId: string; session: ImportSession }>>(`/schools/${schoolId}/admissions/sessions`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        upload: {
            file: async (schoolId: string, sessionId: string, file: File) => {
                const formData = new FormData()
                formData.append("file", file)
                const token = getAccessToken()
                const res = await fetch(`/api/v1/schools/${schoolId}/admissions/sessions/${sessionId}/upload`, {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body?.error?.message || `Upload failed: ${res.status}`)
                }
                return res.json() as Promise<ApiResponse<{ sessionId: string; summary: PreviewSummary; mapping: ColumnMapping[] }>>
            },
        },
        progress: {
            get: (schoolId: string, sessionId: string) =>
                request<ApiResponse<ImportProgress>>(`/schools/${schoolId}/admissions/sessions/${sessionId}/progress`),
        },
        preview: {
            get: (schoolId: string, sessionId: string) =>
                request<ApiResponse<{ summary: PreviewSummary; rows: ValidatedRow[]; mapping: ColumnMapping[] }>>(`/schools/${schoolId}/admissions/sessions/${sessionId}/preview`),
        },
        confirm: (schoolId: string, sessionId: string, strategy?: string) =>
            request<ApiResponse<{ imported: number; skipped: number; failed: number; errors: any[]; totalRows: number }>>(`/schools/${schoolId}/admissions/sessions/${sessionId}/confirm`, {
                method: "POST",
                body: JSON.stringify(strategy ? { strategy } : {}),
            }),
        list: (schoolId: string, params?: { status?: string; page?: number; pageSize?: number }) => {
            const qs = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)]))).toString() : ""
            return request<ApiResponse<{ sessions: ImportSession[]; total: number; page: number; pageSize: number }>>(`/schools/${schoolId}/admissions/sessions${qs}`)
        },
        cancel: (schoolId: string, sessionId: string) =>
            request<ApiResponse<{ cancelled: boolean }>>(`/schools/${schoolId}/admissions/sessions/${sessionId}`, { method: "DELETE" }),
        retryFailed: (schoolId: string, sessionId: string, rowNumbers: number[]) =>
            request<ApiResponse<any>>(`/schools/${schoolId}/admissions/sessions/${sessionId}/retry-failed`, {
                method: "POST",
                body: JSON.stringify({ rowNumbers }),
            }),
        errorReport: (schoolId: string, sessionId: string) =>
            request<ApiResponse<{ errors: any[]; rows: ValidatedRow[] }>>(`/schools/${schoolId}/admissions/sessions/${sessionId}/error-report`),
        downloadUrl: (schoolId: string, sessionId: string) =>
            request<ApiResponse<{ downloadUrl: string }>>(`/schools/${schoolId}/admissions/sessions/${sessionId}/download`),
    },
    config: {
        get: (schoolId: string) =>
            request<ApiResponse<any>>(`/schools/${schoolId}/admissions/config`),
        supportedFormats: (schoolId: string) =>
            request<ApiResponse<any>>(`/schools/${schoolId}/admissions/supported-formats`),
    },
    stats: {
        get: (schoolId: string) =>
            request<ApiResponse<any>>(`/schools/${schoolId}/admissions/stats`),
    },
}

export const supportApi = {
    listTickets: (schoolId: string, params?: { status?: string; category?: string }) => {
        const query = new URLSearchParams()
        if (params?.status) query.set("status", params.status)
        if (params?.category) query.set("category", params.category)
        const qs = query.toString()
        return request<ApiResponse<SupportTicket[]>>(`/schools/${schoolId}/support/tickets${qs ? `?${qs}` : ""}`)
    },
    createTicket: (schoolId: string, data: { subject: string; category?: string; message: string }) =>
        request<ApiResponse<SupportTicket>>(`/schools/${schoolId}/support/tickets`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getTicket: (schoolId: string, ticketId: string) =>
        request<ApiResponse<SupportTicket>>(`/schools/${schoolId}/support/tickets/${ticketId}`),
    sendMessage: (schoolId: string, ticketId: string, data: { content: string }) =>
        request<ApiResponse<{ message: SupportTicketMessage; ticket: SupportTicket }>>(`/schools/${schoolId}/support/tickets/${ticketId}/messages`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
}
