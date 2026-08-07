import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Contact,
  FileText,
  ScrollText,
  CalendarDays,
  FolderKanban,
  CheckSquare,
  Wallet,
  Zap,
  LayoutTemplate,
  UsersRound,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** i18n key under `nav.*` */
  labelKey: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", labelKey: "leads", icon: Users },
  { href: "/dashboard/clients", labelKey: "clients", icon: Contact },
  { href: "/dashboard/proposals", labelKey: "proposals", icon: FileText },
  { href: "/dashboard/contracts", labelKey: "contracts", icon: ScrollText },
  { href: "/dashboard/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/dashboard/projects", labelKey: "projects", icon: FolderKanban },
  { href: "/dashboard/tasks", labelKey: "tasks", icon: CheckSquare },
  { href: "/dashboard/payments", labelKey: "payments", icon: Wallet },
  { href: "/dashboard/automations", labelKey: "automations", icon: Zap },
  { href: "/dashboard/templates", labelKey: "templates", icon: LayoutTemplate },
  { href: "/dashboard/team", labelKey: "team", icon: UsersRound },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];
