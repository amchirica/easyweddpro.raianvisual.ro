import type { Metadata } from "next";

import { AutomationSection } from "@/components/marketing/sections/automation-section";
import { BusinessFitSection } from "@/components/marketing/sections/business-fit-section";
import { CircularSection } from "@/components/marketing/sections/circular-section";
import { CompareSection } from "@/components/marketing/sections/compare-section";
import { EcosystemSection } from "@/components/marketing/sections/ecosystem-section";
import { EuropeSection } from "@/components/marketing/sections/europe-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { FinalCtaSection } from "@/components/marketing/sections/final-cta-section";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { ModulesSection } from "@/components/marketing/sections/modules-section";
import { PricingSection } from "@/components/marketing/sections/pricing-section";
import { ProblemSection } from "@/components/marketing/sections/problem-section";
import { RoadmapSection } from "@/components/marketing/sections/roadmap-section";
import { TemplatesSection } from "@/components/marketing/sections/templates-section";
import { WorkflowSection } from "@/components/marketing/sections/workflow-section";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import { getTranslator } from "@/lib/i18n/t";
import { getSiteUrl } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getTranslator();
  const title = t("marketing.seo.homeTitle");
  const description = t("marketing.seo.homeDescription");
  const ogTitle = t("marketing.seo.homeOgTitle");
  const ogDescription = t("marketing.seo.homeOgDescription");

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "ro_RO",
      url: getSiteUrl(),
      siteName: APP_NAME,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: "/logo.png", width: 64, height: 64, alt: APP_NAME }],
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: ogDescription,
      images: ["/logo.png"],
    },
  };
}

export default async function MarketingHomePage() {
  const { t } = await getTranslator();
  const siteUrl = getSiteUrl();
  const description = t("marketing.seo.homeDescription");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description,
      url: siteUrl,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "RON",
        lowPrice: "0",
        highPrice: "349",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: siteUrl,
      email: SUPPORT_EMAIL,
      logo: `${siteUrl}/logo.png`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <ProblemSection />
      <WorkflowSection />
      <AutomationSection />
      <ModulesSection />
      <BusinessFitSection />
      <TemplatesSection />
      <EcosystemSection />
      <CircularSection />
      <RoadmapSection />
      <EuropeSection />
      <CompareSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
