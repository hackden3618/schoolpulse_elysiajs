export interface ApiResponse<T> {
  data: T
  meta: {
    requestId: string
    schoolId?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  meta: {
    requestId: string
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: { field: string; issue: string }[]
    requestId: string
  }
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  filter?: Record<string, string>
}

export type UserStatus = "active" | "inactive" | "archived"
export type MembershipStatus = "active" | "on_leave" | "suspended" | "resigned" | "terminated"
export type StudentStatus = "active" | "inactive" | "archived" | "graduated" | "deceased"
export type SubscriptionPlan = "free" | "monthly" | "termly" | "yearly" | "enterprise"
export type SubscriptionStatus = "trial" | "active" | "suspended" | "pending_review" | "defaulted" | "terminated"
export type SchoolLevel = "pre_primary" | "primary" | "junior_secondary" | "senior_secondary" | "mixed"
export type SchoolTier = "small" | "medium" | "large" | "enterprise"
export type Relationship = "father" | "mother" | "sibling" | "emergency" | "sponsor" | "legal_guardian" | "step_parent" | "relative" | "other"

export interface School {
  id: string
  schoolCode: string
  schoolName: string
  schoolPhone: string
  schoolEmail?: string
  schoolWebsite?: string
  schoolAddress?: string
  schoolLogo?: string
  postOffice?: string
  county: string
  town: string
  country: string
  currency: string
  timezone: string
  subscriptionPlan: SubscriptionPlan
  subscriptionStatus: SubscriptionStatus
  schoolTier: SchoolTier
  schoolLevel: SchoolLevel
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  firstName: string
  secondName?: string
  lastName?: string
  phone: string
  email?: string
  profilePic?: string
  status: UserStatus
  isGuardian?: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  createdAt: string
}

export interface SchoolMembershipRole {
  id: string
  membershipId: string
  roleId: string
  role: Role
}

export interface Membership {
  id: string
  schoolId: string
  userId: string
  status: MembershipStatus
  joinedAt: string
  leftAt?: string
  user: User
  roles: SchoolMembershipRole[]
}

export interface Student {
  id: string
  admissionNumber: string
  firstName: string
  secondName?: string
  lastName: string
  dateOfBirth: string
  gender?: "male" | "female"
  admissionDate: string
  status: StudentStatus
  performanceExpectation?: string
  archiveReason?: string
  currentEnrollment?: Enrollment
  guardians: Guardian[]
  enrollments?: Enrollment[]
  _count?: {
    enrollments: number
    invoices: number
    attendanceRecords: number
  }
  createdAt: string
  updatedAt: string
}

export interface Guardian {
  id: string
  relationship: Relationship
  isPrimary: boolean
  canPay: boolean
  receivesSms: boolean
  receivesEmail: boolean
  guardian: {
    id: string
    firstName: string
    secondName?: string
    lastName?: string
    phone: string
    email?: string
  }
}

export interface Enrollment {
  id: string
  studentId: string
  classInstanceId: string
  academicYearId: string
  termId?: string
  status: string
  classInstance: ClassInstance
  academicYear: AcademicYear
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export interface Term {
  id: string
  academicYearId: string
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export interface Class {
  id: string
  name: string
  level: number
}

export interface ClassInstance {
  id: string
  classId: string
  academicYearId: string
  streamName: string
  isCurrent: boolean
  class: Class
  academicYear?: AcademicYear
}

export interface Subject {
  id: string
  name: string
  code: string
  isCompulsory: boolean
}

export interface AttendanceSession {
  id: string
  schoolId: string
  classInstanceId: string
  markerMembershipId: string | null
  sessionDate: string
  sessionType: "morning" | "afternoon" | "lesson"
  status: "open" | "locked"
  lockedAt: string | null
  createdAt: string
  updatedAt: string
  classInstance: ClassInstance
  marker?: { id: string; user: { id: string; firstName: string; lastName: string } } | null
  records: AttendanceRecord[]
}

export interface AttendanceRecord {
  id: string
  schoolId: string
  sessionId: string
  studentId: string
  editedByMembershipId: string | null
  status: "present" | "absent" | "late" | "excused"
  checkInTime: string | null
  editReason: string | null
  editedAt: string | null
  createdAt: string
  updatedAt: string
  student?: { id: string; admissionNumber: string; firstName: string; lastName: string }
}

export interface Exam {
  id: string
  schoolId: string
  termId: string
  name: string
  type: "cat" | "midterm" | "endterm" | "mock" | "opener" | "continuous_assessment" | "practical" | "project" | "oral" | "national" | "custom"
  startDate: string
  endDate: string
  completed: boolean
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  term: Term
  assessments: Assessment[]
}

export interface Assessment {
  id: string
  schoolId: string
  examId: string
  subjectId: string
  classInstanceId: string
  totalMarks: number
  accountedInFinal: boolean
  createdAt: string
  updatedAt: string
  exam: Exam
  subject: Subject
  classInstance: ClassInstance
  results: AssessmentResult[]
}

export interface AssessmentResult {
  id: string
  schoolId: string
  studentId: string
  enrollmentId: string | null
  assessmentId: string
  attainedMarks: number
  performance: "excellent" | "good" | "average" | "below_average" | "poor" | null
  remarks: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  student: { id: string; admissionNumber: string; firstName: string; lastName: string }
}

export interface FeeStructure {
  id: string
  schoolId: string
  academicYearId: string
  termId: string
  classId: string | null
  isGlobal: boolean
  isLatest: boolean
  createdAt: string
  updatedAt: string
  academicYear: AcademicYear
  term: Term
  class: { id: string; name: string; level: number } | null
  feeItems: FeeItem[]
}

export interface FeeItem {
  id: string
  schoolId: string
  feeStructureId: string
  name: string
  amount: number
  optional: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  schoolId: string
  studentId: string
  enrollmentId: string | null
  termId: string
  feeStructureId: string | null
  totalAmount: number
  paidAmount: number
  balance: number
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "written_off"
  isCurrent: boolean
  dueDate: string
  createdAt: string
  updatedAt: string
  student: { id: string; admissionNumber: string; firstName: string; lastName: string }
  term: Term
  feeStructure: FeeStructure | null
  payments: Payment[]
}

export interface Payment {
  id: string
  schoolId: string
  studentId: string
  payerId: string | null
  invoiceId: string | null
  reversedPaymentId: string | null
  createdByMembershipId: string | null
  method: "mpesa_stk" | "mpesa_c2b" | "bank_transfer" | "bursary" | "cash" | "adjustment" | "credit"
  type: "subscription" | "fee" | "extra_curricular"
  status: "pending" | "confirmed" | "failed" | "reversed"
  provider: string | null
  transactionRef: string
  amount: number
  receivedAt: string
  createdAt: string
  student: { id: string; admissionNumber: string; firstName: string; lastName: string }
  invoice: Invoice | null
}

export interface Conversation {
  id: string
  schoolId: string
  type: "direct" | "group" | "announcement"
  subject: string | null
  createdAt: string
  updatedAt: string
  participants: {
    id: string
    userId: string | null
    membershipId: string | null
    participantType: string
    user: { id: string; firstName: string; lastName: string; phone: string } | null
    membership: { id: string; userId: string; user: { id: string; firstName: string; lastName: string } } | null
  }[]
  messages: Message[]
}

export interface Message {
  id: string
  schoolId: string
  conversationId: string | null
  senderMembershipId: string | null
  recipientUserId: string | null
  channel: "in_app" | "sms" | "whatsapp" | "email"
  messageType: "text" | "announcement" | "invoice" | "payment" | "attendance" | "assessment" | "system"
  priority: "low" | "normal" | "high" | "urgent"
  subject: string | null
  content: string
  payload: Record<string, unknown>
  isLatest: boolean
  createdAt: string
  updatedAt: string
  sender: { id: string; userId: string; user: { id: string; firstName: string; lastName: string } } | null
  receipts: {
    id: string
    recipientUserId: string | null
    status: "pending" | "sent" | "delivered" | "failed" | "read"
    channel: string
  }[]
}

export interface SmsRecipientResult {
  mobile: string
  success: boolean
  messageId?: number
  error?: string
}

export interface SmsSegmentInfo {
  characterCount: number
  segmentCount: number
  perSegmentMax: number
  remaining: number
}

export interface SmsSendResult {
  totalRecipients: number
  successful: number
  failed: number
  segmentInfo: SmsSegmentInfo
  results: SmsRecipientResult[]
}

export interface SmsTemplate {
  id: string
  name: string
  message: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface JoinRequest {
  id: string
  schoolName: string
  phone: string
  email?: string
  schoolLevel?: string
  county?: string
  country?: string
  town?: string
  status: string
  requestedBy: string
  processedBy?: string
  processedAt?: string
  requestedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
  membership: Membership
  school: School
}

export interface DashboardSummary {
  students: number
  activeStudents: number
  staff: number
  activeClasses: number
  activeAcademicYear: { id: string; name: string; startDate: string; endDate: string; active: boolean } | null
  activeTerm: { id: string; academicYearId: string; name: string; startDate: string; endDate: string; active: boolean } | null
  attendanceToday: number
  openInvoices: number
  pendingPayments: number
}

export interface RecentActivity {
  recentPayments: {
    id: string
    amount: number
    method: string
    transactionRef: string
    createdAt: string
    student: { firstName: string; lastName: string }
  }[]
}

export interface AuthState {
  user: User | null
  membership: Membership | null
  school: School | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  activeRole: Role | null
  roles: Role[]
}

export interface ReportSummaryItem {
  type: string
  label: string
  count: number
}

export interface AttendanceReport {
  totalSessions: number
  totalRecords: number
  present: number
  absent: number
  late: number
  excused: number
  averageRate: number
}

export interface FinanceReport {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  invoicesByStatus: { status: string; count: number; totalAmount: number; outstanding: number }[]
}

export interface AcademicReport {
  totalExams: number
  completedExams: number
  totalAssessments: number
  totalResults: number
  publishedResults: number
}

export interface StudentReport {
  total: number
  active: number
  byGender: { gender: string | null; count: number }[]
  byClass: { classId: string; className: string; count: number }[]
}
