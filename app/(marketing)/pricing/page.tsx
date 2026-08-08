import type { Metadata } from "next";

import { PricingPageClient } from "@/components/marketing/pricing-page-client";
import { getTranslator } from "@/lib/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("marketing.seo.pricingTitle"),
    description: t("marketing.seo.pricingDescription"),
  };
}

export default function PricingPage() {
  return <PricingPageClient />;
}
