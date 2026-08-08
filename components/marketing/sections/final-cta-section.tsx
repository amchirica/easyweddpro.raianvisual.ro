"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  const { t } = useI18n();

  return (
    <section className="px-6 py-24">
      <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
        <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
          {t("marketing.finalCta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          {t("marketing.finalCta.description")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
            {t("marketing.common.startFree")}
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/features" />} nativeButton={false}>
            {t("marketing.common.seeFeatures")}
          </Button>
        </div>
      </div>
    </section>
  );
}
