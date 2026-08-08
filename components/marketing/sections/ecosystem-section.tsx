"use client";

import Link from "next/link";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { EASYWEDD_CONSUMER_URL } from "@/lib/constants";

export function EcosystemSection() {
  const { t, ta } = useI18n();
  const bridge = ta("marketing.ecosystem.bridge");
  const available = ta("marketing.ecosystem.available");
  const coming = ta("marketing.ecosystem.coming");

  return (
    <SectionShell muted>
      <SectionHeader
        title={t("marketing.ecosystem.title")}
        description={t("marketing.ecosystem.description")}
      />

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="surface-card p-6 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {t("marketing.ecosystem.forCouples")}
          </p>
          <p className="mt-2 font-heading text-2xl text-foreground">EasyWedd</p>
          <Link
            href={EASYWEDD_CONSUMER_URL}
            className="mt-3 inline-block text-sm text-champagne-soft hover:text-champagne"
            rel="noopener noreferrer"
            target="_blank"
          >
            easywedd.raianvisual.ro
          </Link>
        </div>
        <p className="text-center text-2xl text-champagne/60" aria-hidden>
          ⇅
        </p>
        <div className="surface-card p-6 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {t("marketing.ecosystem.forVendors")}
          </p>
          <p className="mt-2 font-heading text-2xl text-foreground">EasyWedd Pro</p>
          <p className="mt-3 text-sm text-muted-soft">{t("marketing.ecosystem.proMeta")}</p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-2">
        {bridge.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-champagne-soft">
            {t("marketing.ecosystem.availableNow")}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {available.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-soft">
            {t("marketing.ecosystem.inDevelopment")}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {coming.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
