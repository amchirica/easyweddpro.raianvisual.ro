"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function RoadmapSection() {
  const { t, ta } = useI18n();
  const items = ta("marketing.roadmap.items");

  return (
    <SectionShell muted>
      <SectionHeader
        eyebrow={t("marketing.roadmap.eyebrow")}
        title={t("marketing.roadmap.title")}
        description={t("marketing.roadmap.description")}
      />
      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}
