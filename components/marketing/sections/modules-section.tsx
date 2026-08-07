import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  ScrollText,
  Users,
  Wallet,
  Zap,
  LayoutTemplate,
} from "lucide-react";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const MODULES = [
  {
    icon: Users,
    title: "CRM",
    items: ["pipeline", "leaduri", "surse", "status", "follow-up"],
  },
  {
    icon: FileText,
    title: "Oferte",
    items: ["pachete", "extraopțiuni", "discount", "link public", "acceptare"],
  },
  {
    icon: ScrollText,
    title: "Contracte",
    items: ["template", "acceptare digitală", "versiuni", "PDF"],
  },
  {
    icon: Wallet,
    title: "Plăți",
    items: ["avans", "tranșe", "restante", "remindere"],
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    items: ["evenimente", "întâlniri", "deadline-uri", "task-uri"],
  },
  {
    icon: FolderKanban,
    title: "Proiecte",
    items: ["workflow", "echipă", "checklist", "deadline"],
  },
  {
    icon: Zap,
    title: "Automatizări",
    items: ["trigger", "condiții", "acțiuni"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    items: ["conversie", "pipeline", "venit", "surse", "rezultate"],
  },
  {
    icon: LayoutTemplate,
    title: "Portal Client",
    items: ["ofertă", "contract", "plăți", "proiect", "documente"],
  },
];

export function ModulesSection() {
  return (
    <SectionShell>
      <SectionHeader
        title="Modulele platformei"
        description="Un Business OS complet pentru Weddings & Events — CRM-ul e doar o parte din workflow."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <div key={module.title} className="surface-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
              <module.icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-4 font-heading text-lg font-medium text-foreground">{module.title}</p>
            <ul className="mt-2 space-y-1">
              {module.items.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
