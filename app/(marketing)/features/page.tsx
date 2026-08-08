import type { Metadata } from "next";

import { FeaturesPageClient } from "@/components/marketing/features-page-client";
import { getTranslator } from "@/lib/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("marketing.seo.featuresTitle"),
    description: t("marketing.seo.featuresDescription"),
  };
}

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
