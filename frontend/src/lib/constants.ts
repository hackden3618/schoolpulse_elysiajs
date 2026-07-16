import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  CalendarCheck,
  Shield,
  Building2,
  LifeBuoy,
  Wallet,
} from "lucide-react"

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number | string
}

const ALL_NAV: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Fee Payments", href: "/payments", icon: Wallet },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Students", href: "/students", icon: Users },
      { label: "Staff Users", href: "/users", icon: Shield },
      { label: "Academics", href: "/academics", icon: GraduationCap },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck },
      { label: "Assessments", href: "/assessments", icon: BookOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Finance", href: "/finance", icon: DollarSign },
      { label: "Communication", href: "/communication", icon: MessageSquare },
      { label: "Support", href: "/support", icon: LifeBuoy },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "School Profile", href: "/settings", icon: Building2 },
      { label: "Settings", href: "/settings/system", icon: Settings },
    ],
  },
]

const NAV_BY_ROLE: Record<string, string[]> = {
  // Guardians / Parents see only their children's financial + communication surface.
  Guardian: ["/dashboard", "/payments", "/communication", "/support"],
  Parent: ["/dashboard", "/payments", "/communication", "/support"],
  // Teachers: classroom + assessment + messaging.
  Teacher: ["/dashboard", "/attendance", "/assessments", "/communication", "/support", "/reports"],
  // Bursars: finance only.
  Bursar: ["/dashboard", "/finance", "/communication", "/support", "/reports"],
  // Admissions / Reception: student data + messaging, no finance/reports/academics.
  Admissions: ["/dashboard", "/students", "/communication", "/support"],
  Reception: ["/dashboard", "/students", "/communication", "/support"],
  // Academic Master: academics + classroom, no finance/users/system.
  AcademicMaster: ["/dashboard", "/students", "/academics", "/attendance", "/assessments", "/communication", "/support", "/reports"],
  // Deputy Principal: broad but not user-mgmt / system settings / bulk import.
  DeputyPrincipal: ["/dashboard", "/students", "/academics", "/attendance", "/assessments", "/finance", "/communication", "/support", "/reports"],
  // Full access tiers.
  SuperAdmin: [],
  Principal: [],
  PlatformAdmin: [],
}

// Roles that receive the complete navigation (everything).
const FULL_NAV_ROLES = new Set(["SuperAdmin", "Principal", "PlatformAdmin"])

export function getNavigation(roleName?: string): NavGroup[] {
  // Admin-tier roles get the full navigation.
  if (roleName && FULL_NAV_ROLES.has(roleName)) return ALL_NAV

  const allowed = roleName ? NAV_BY_ROLE[roleName] : undefined
  if (!allowed) return ALL_NAV

  return ALL_NAV
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.includes(item.href)),
    }))
    .filter((group) => group.items.length > 0)
}

export const navigation = ALL_NAV

export const quickActions = [
  { label: "Admit Student", href: "/students/create" },
  { label: "Bulk Import", href: "/students/import" },
  { label: "Record Payment", href: "/finance/payments" },
  { label: "Mark Attendance", href: "/attendance" },
  { label: "Create Invoice", href: "/finance/invoices" },
  { label: "Add Staff", href: "/users/create" },
  { label: "Send Announcement", href: "/communication" },
]
