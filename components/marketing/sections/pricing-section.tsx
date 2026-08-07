import { PricingGrid } from "@/components/marketing/pricing-grid";
import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

export function PricingSection() {
  return (
    <SectionShell id="pricing">
      <SectionHeader
        title="Prețuri simple, fără surprize"
        description="Începe gratuit — fără card pe planul Free. Treci la un plan plătit când businessul crește."
      />
      <div className="mt-12">
        <PricingGrid />
      </div>
    </SectionShell>
  );
}
