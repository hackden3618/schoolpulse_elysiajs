// In-frontend sample data used by the bare-shell prototype. No backend is
// involved — these values exist only so the UI is clickable and demoable while
// features are rebuilt module by module.

export interface MockSchool {
  id: string
  name: string
  code: string
  level: string
  county: string
}

export interface MockRole {
  id: string
  name: string
  description: string
  permissions: string[]
  createdAt: string
}

export interface MockUser {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
}

export interface MockMembership {
  id: string
  userId: string
  schoolId: string
  roles: MockRole[]
}

export const MOCK_SCHOOLS: MockSchool[] = [
  { id: "sch_1", name: "Demo International Schools", code: "DIS", level: "Mixed", county: "Nairobi" },
  { id: "sch_2", name: "Second Test School", code: "STS", level: "Primary", county: "Kiambu" },
]

export const MOCK_ROLES: Record<string, MockRole> = {
  SuperAdmin: { id: "role_sa", name: "SuperAdmin", description: "Full school access", permissions: [], createdAt: new Date().toISOString() },
  Principal: { id: "role_pr", name: "Principal", description: "School leader", permissions: [], createdAt: new Date().toISOString() },
  Teacher: { id: "role_te", name: "Teacher", description: "Classroom staff", permissions: [], createdAt: new Date().toISOString() },
  Bursar: { id: "role_bu", name: "Bursar", description: "Finance staff", permissions: [], createdAt: new Date().toISOString() },
  Guardian: { id: "role_gu", name: "Guardian", description: "Parent/guardian", permissions: [], createdAt: new Date().toISOString() },
}

export const MOCK_USER: MockUser = {
  id: "user_1",
  firstName: "Amina",
  lastName: "Otieno",
  phone: "+254757030643",
  email: "amina@demoschool.ac.ke",
}

export const MOCK_MEMBERSHIPS: MockMembership[] = [
  {
    id: "mem_1",
    userId: MOCK_USER.id,
    schoolId: MOCK_SCHOOLS[0]!.id,
    roles: [MOCK_ROLES.SuperAdmin, MOCK_ROLES.Principal] as MockRole[],
  },
  {
    id: "mem_2",
    userId: MOCK_USER.id,
    schoolId: MOCK_SCHOOLS[1]!.id,
    roles: [MOCK_ROLES.Guardian] as MockRole[],
  },
]

// A small slice of dashboard metrics, rendered from local sample data.
export const MOCK_DASHBOARD = {
  stats: [
    { label: "Students", value: 842, hint: "Enrolled this term" },
    { label: "Staff", value: 47, hint: "Active members" },
    { label: "Outstanding Fees", value: "KES 1.24M", hint: "Across 312 accounts" },
    { label: "Attendance Today", value: "94.2%", hint: "1,280 of 1,360 present" },
  ],
  recentActivity: [
    { id: "a1", title: "Fee payment received", detail: "KES 12,000 — Jane Wairimu", time: "12 min ago" },
    { id: "a2", title: "New student admitted", detail: "Brian Kiptoo — Grade 4", time: "1 hr ago" },
    { id: "a3", title: "Attendance marked", detail: "Grade 7A — 38/40 present", time: "2 hr ago" },
    { id: "a4", title: "Announcement sent", detail: "Term 2 opens Monday", time: "Yesterday" },
  ],
}
