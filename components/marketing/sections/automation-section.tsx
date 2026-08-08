"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

type AutomationItem = { trigger: string; action: string };

export function AutomationSection() {
  const { t, tm } = useI18n();
  const items = tm<AutomationItem[]>("marketing.automation.items") ?? [];

  return (
    <SectionShell muted>
      <SectionHeader
        title={t("marketing.automation.title")}
        description={t("marketing.automation.description")}
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.trigger}
            className="surface-card flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="text-sm text-foreground">{item.trigger}</span>
            <span className="text-xs text-muted-soft sm:text-right">→ {item.action}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
