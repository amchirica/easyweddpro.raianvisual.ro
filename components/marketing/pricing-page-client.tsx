"use client";

import Link from "next/link";

import { PricingGrid } from "@/components/marketing/pricing-grid";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type ComparisonRow = {
  label: string;
  free: string;
  solo: string;
  studio: string;
  agency: string;
};

type FaqItem = { question: string; answer: string };

export function PricingPageClient() {
  const { t, tm } = useI18n();
  const rows = tm<ComparisonRow[]>("marketing.pricing.comparison") ?? [];
  const faq = tm<FaqItem[]>("marketing.pricing.faq") ?? [];

  return (
    <>
      <section className="px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
          {t("marketing.pricing.pageEyebrow")}
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          {t("marketing.pricing.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          {t("marketing.pricing.pageDescription")}
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <PricingGrid />
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-2xl font-medium text-foreground sm:text-3xl">
            {t("marketing.pricing.compareTitle")}
          </h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">{t("marketing.pricing.featureColumn")}</th>
                  <th className="py-3 pr-4 text-center font-medium">Free</th>
                  <th className="py-3 pr-4 text-center font-medium">Solo</th>
                  <th className="py-3 pr-4 text-center font-medium">Studio</th>
                  <th className="py-3 pr-4 text-center font-medium">Agency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/60">
                    <td className="py-3 pr-4 text-foreground">{row.label}</td>
                    <td className="py-3 pr-4 text-center text-muted-foreground">{row.free}</td>
                    <td className="py-3 pr-4 text-center text-muted-foreground">{row.solo}</td>
                    <td className="py-3 pr-4 text-center text-champagne">{row.studio}</td>
                    <td className="py-3 pr-4 text-center text-champagne">{row.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-2xl font-medium text-foreground sm:text-3xl">
            {t("marketing.pricing.faqTitle")}
          </h2>
          <div className="mt-8 space-y-3">
            {faq.map((item) => (
              <details key={item.question} className="surface-card group p-5">
                <summary className="flex list-none cursor-pointer items-center justify-between font-heading text-base font-medium text-foreground marker:content-none">
                  {item.question}
                  <span className="ml-4 text-champagne transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      <section className="px-6 py-20">
        <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            {t("marketing.pricing.unsureTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            {t("marketing.pricing.unsureDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              {t("marketing.common.startFree")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
