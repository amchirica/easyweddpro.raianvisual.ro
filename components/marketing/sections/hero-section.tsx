"use client";

import Link from "next/link";

import { HeroDashboardMock } from "@/components/marketing/hero-dashboard-mock";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.16),transparent)]"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14">
        <div className="max-w-3xl text-center">
          <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
            {t("marketing.hero.eyebrow")}
          </span>
          <p className="animate-fade-in mt-4 text-sm text-muted-foreground">{APP_NAME}</p>
          <h1 className="animate-fade-up mt-3 font-heading text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
            {t("marketing.hero.heading")}
          </h1>
          <p className="animate-fade-up mt-3 font-heading text-xl text-champagne-soft sm:text-2xl">
            {t("marketing.hero.support")}
          </p>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {t("marketing.hero.promise")}
          </p>
          <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              {t("marketing.common.startFree")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#workflow" />}
              nativeButton={false}
            >
              {t("marketing.common.seeHowItWorks")}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-soft">{t("marketing.hero.noCard")}</p>
        </div>

        <HeroDashboardMock />
      </div>
    </section>
  );
}
