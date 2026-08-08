"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function WorkflowSection() {
  const { t, ta } = useI18n();
  const steps = ta("marketing.workflow.steps");

  return (
    <SectionShell id="workflow">
      <SectionHeader
        eyebrow={t("marketing.workflow.eyebrow")}
        title={t("marketing.workflow.title")}
        description={t("marketing.workflow.description")}
      />
      <ol className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3">
        {steps.map((step, index) => (
          <li key={`${step}-${index}`} className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1.5 text-sm font-medium text-champagne-soft">
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span className="hidden text-muted-soft sm:inline" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
