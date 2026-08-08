"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function TemplatesSection() {
  const { t, ta } = useI18n();
  const templates = ta("marketing.templates.items");

  return (
    <SectionShell>
      <SectionHeader
        title={t("marketing.templates.title")}
        description={t("marketing.templates.description")}
      />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
        {templates.map((item) => (
          <span
            key={item}
            className="rounded-full border border-champagne/25 bg-champagne/10 px-3 py-1.5 text-xs text-champagne-soft"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-xl text-center text-base text-muted-foreground">
        {t("marketing.templates.closing")}
      </p>
    </SectionShell>
  );
}
