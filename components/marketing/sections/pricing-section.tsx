"use client";

import { PricingGrid } from "@/components/marketing/pricing-grid";
import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function PricingSection() {
  const { t } = useI18n();

  return (
    <SectionShell id="pricing">
      <SectionHeader
        title={t("marketing.pricing.title")}
        description={t("marketing.pricing.description")}
      />
      <div className="mt-12">
        <PricingGrid />
      </div>
    </SectionShell>
  );
}
