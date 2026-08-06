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
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leaduri", icon: Users },
  { href: "/dashboard/clients", label: "Clienți", icon: Contact },
  { href: "/dashboard/proposals", label: "Oferte", icon: FileText },
  { href: "/dashboard/contracts", label: "Contracte", icon: ScrollText },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/projects", label: "Proiecte", icon: FolderKanban },
  { href: "/dashboard/tasks", label: "Task-uri", icon: CheckSquare },
  { href: "/dashboard/payments", label: "Plăți", icon: Wallet },
  { href: "/dashboard/automations", label: "Automatizări", icon: Zap },
  { href: "/dashboard/templates", label: "Template-uri", icon: LayoutTemplate },
  { href: "/dashboard/team", label: "Echipă", icon: UsersRound },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Setări", icon: Settings },
];
