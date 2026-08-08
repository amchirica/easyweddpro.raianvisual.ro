"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function CompareSection() {
  const { t, ta } = useI18n();
  const general = ta("marketing.compare.general");
  const pro = ta("marketing.compare.pro");

  return (
    <SectionShell muted>
      <SectionHeader title={t("marketing.compare.title")} />
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        <div className="surface-card p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-soft">
            {t("marketing.compare.generalLabel")}
          </p>
          <ul className="mt-4 space-y-2">
            {general.map((item) => (
              <li key={item} className="text-sm text-muted-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card border-champagne/20 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-champagne-soft">
            {t("marketing.compare.proLabel")}
          </p>
          <ul className="mt-4 space-y-2">
            {pro.map((item) => (
              <li key={item} className="text-sm text-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
