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
  UserCircle,
} from "lucide-react"
import type { Permission } from "./permissions"
import { getEffectivePermissions } from "./permissions"

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
  {
    label: "Personal",
    items: [
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
  },
]

// Dashboard is always shown.
const DASHBOARD_HREF = "/dashboard"

// Permission required to reveal each route. My Profile is universal.
const ROUTE_PERMISSION: Record<string, Permission | null> = {
  "/dashboard": null,
  "/payments": "finance:guardian_view",
  "/students": "student:read",
  "/users": "user:read",
  "/academics": "academic-year:write",
  "/attendance": "attendance:mark",
  "/assessments": "assessment:write",
  "/finance": "finance:report",
  "/communication": "communication:write",
  "/support": "school:read",
  "/reports": "attendance:report",
  "/settings": "school:read",
  "/settings/system": "school:admin",
  "/profile": null,
}

function routeVisible(href: string, perms: Set<Permission>): boolean {
  if (href === DASHBOARD_HREF || href === "/profile") return true
  const req = ROUTE_PERMISSION[href]
  if (!req) return true
  return perms.has(req)
}

/**
 * Builds navigation from the caller's effective permissions (derived from the
 * JWT claims), NOT from a role name. If a permission disappears, the route
 * disappears — exactly mirroring backend authorization.
 */
export function getNavigation(
  roleNames?: string[],
  activeRole?: string | null
): NavGroup[] {
  const perms = new Set<Permission>(
    roleNames ? getEffectivePermissions(roleNames, activeRole) : []
  )

  return ALL_NAV
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => routeVisible(item.href, perms)),
    }))
    .filter((group) => group.items.length > 0)
}

export const quickActions = [
  { label: "Admit Student", href: "/students/create" },
  { label: "Bulk Import", href: "/students/import" },
  { label: "Record Payment", href: "/finance/payments" },
  { label: "Mark Attendance", href: "/attendance" },
  { label: "Create Invoice", href: "/finance/invoices" },
  { label: "Add Staff", href: "/users/create" },
  { label: "Send Announcement", href: "/communication" },
]
