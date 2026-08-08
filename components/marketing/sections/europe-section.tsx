"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function EuropeSection() {
  const { t, ta } = useI18n();
  const items = ta("marketing.europe.items");

  return (
    <SectionShell>
      <SectionHeader
        title={t("marketing.europe.title")}
        description={t("marketing.europe.description")}
      />
      <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="surface-card px-5 py-4 text-sm text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
