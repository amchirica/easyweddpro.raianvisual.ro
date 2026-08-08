"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function CircularSection() {
  const { t, ta } = useI18n();
  const steps = ta("marketing.circular.steps");

  return (
    <SectionShell>
      <SectionHeader
        title={t("marketing.circular.title")}
        description={t("marketing.circular.description")}
      />
      <ol className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-2 sm:gap-1">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-col items-center">
            <span className="rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-sm font-medium text-champagne-soft">
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span className="py-1 text-muted-soft" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
