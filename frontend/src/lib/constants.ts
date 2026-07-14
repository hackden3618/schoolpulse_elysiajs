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
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
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
  Guardian: ["/dashboard", "/communication", "/support"],
  Teacher: ["/dashboard", "/attendance", "/assessments", "/communication", "/support", "/reports"],
  Bursar: ["/dashboard", "/finance", "/communication", "/support", "/reports"],
}

export function getNavigation(roleName?: string): NavGroup[] {
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
  { label: "Record Payment", href: "/finance/payments" },
  { label: "Mark Attendance", href: "/attendance" },
  { label: "Create Invoice", href: "/finance/invoices" },
  { label: "Add Staff", href: "/users/create" },
  { label: "Send Announcement", href: "/communication" },
]
