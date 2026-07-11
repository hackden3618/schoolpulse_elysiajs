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
  classInstanceId: string
  sessionDate: string
  sessionType: "morning" | "afternoon" | "lesson"
  status: "open" | "locked"
  records: AttendanceRecord[]
}

export interface AttendanceRecord {
  id: string
  studentId: string
  status: "present" | "absent" | "late" | "excused"
  reason?: string
}

export interface Exam {
  id: string
  name: string
  termId: string
  type: string
  startDate: string
  endDate: string
  completed: boolean
  published: boolean
  assessments: Assessment[]
}

export interface Assessment {
  id: string
  examId: string
  subjectId: string
  classInstanceId: string
  totalMarks: number
  results: AssessmentResult[]
}

export interface AssessmentResult {
  id: string
  studentId: string
  attainedMarks: number
  performance?: string
  remarks?: string
  published: boolean
}

export interface FeeStructure {
  id: string
  name: string
  termId: string
  academicYearId: string
  classId?: string
  isGlobal: boolean
  items: FeeItem[]
}

export interface FeeItem {
  id: string
  name: string
  amount: number
  optional: boolean
  description?: string
}

export interface Invoice {
  id: string
  studentId: string
  termId: string
  totalAmount: number
  paidAmount: number
  balance: number
  status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "written_off"
  dueDate: string
}

export interface Payment {
  id: string
  invoiceId?: string
  studentId: string
  amount: number
  method: "mpesa_stk" | "mpesa_c2b" | "bank_transfer" | "bursary" | "cash" | "adjustment" | "credit"
  reference: string
  status: "pending" | "confirmed" | "failed" | "reversed"
  paidAt: string
}

export interface Conversation {
  id: string
  type: "direct" | "group" | "announcement"
  subject?: string
  participants: User[]
  lastMessage?: Message
}

export interface Message {
  id: string
  conversationId?: string
  senderId: string
  content: string
  channel?: string
  messageType?: string
  priority?: string
  createdAt: string
  readAt?: string
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
  status: string
  requestedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
  membership: Membership
  school: School
}

export interface AuthState {
  user: User | null
  membership: Membership | null
  school: School | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
