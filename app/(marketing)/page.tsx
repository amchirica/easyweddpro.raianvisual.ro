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
import { APP_NAME, APP_SEO_DESCRIPTION, SUPPORT_EMAIL } from "@/lib/constants";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Business OS pentru Weddings & Events",
  description: APP_SEO_DESCRIPTION,
};

export default function MarketingHomePage() {
  const siteUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: APP_SEO_DESCRIPTION,
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
