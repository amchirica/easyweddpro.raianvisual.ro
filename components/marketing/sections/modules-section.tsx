"use client";

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
import { useI18n } from "@/components/providers/i18n-provider";

const MODULE_ICONS = [
  Users,
  FileText,
  ScrollText,
  Wallet,
  CalendarDays,
  FolderKanban,
  Zap,
  BarChart3,
  LayoutTemplate,
] as const;

type ModuleItem = { title: string; items: string[] };

export function ModulesSection() {
  const { t, tm } = useI18n();
  const modules = tm<ModuleItem[]>("marketing.modules.items") ?? [];

  return (
    <SectionShell>
      <SectionHeader
        title={t("marketing.modules.title")}
        description={t("marketing.modules.description")}
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => {
          const Icon = MODULE_ICONS[index] ?? Users;
          return (
            <div key={module.title} className="surface-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                <Icon className="h-4 w-4" aria-hidden />
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
          );
        })}
      </div>
    </SectionShell>
  );
}
