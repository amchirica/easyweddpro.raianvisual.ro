"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function ProblemSection() {
  const { t, ta } = useI18n();
  const channels = ta("marketing.problem.channels");

  return (
    <SectionShell muted>
      <SectionHeader
        title={t("marketing.problem.title")}
        description={t("marketing.problem.description")}
      />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
        {channels.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-2xl space-y-4 text-center">
        <p className="font-heading text-xl text-foreground sm:text-2xl">
          {t("marketing.problem.highlight")}
        </p>
        <p className="text-base text-muted-foreground">{t("marketing.problem.closing")}</p>
      </div>
    </SectionShell>
  );
}
