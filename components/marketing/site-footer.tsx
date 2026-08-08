"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useI18n } from "@/components/providers/i18n-provider";
import { EASYWEDD_CONSUMER_URL, SUPPORT_EMAIL } from "@/lib/constants";

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const product = [
    { href: "/features", label: t("nav.features") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/login", label: t("common.signIn") },
    { href: "/register", label: t("auth.createAccount") },
  ];

  const legal = [
    { href: "/privacy", label: t("marketing.common.privacy") },
    { href: "/terms", label: t("marketing.common.terms") },
    { href: "/cookies", label: t("marketing.common.cookies") },
    { href: "/dpa", label: t("marketing.common.dpa") },
    { href: "/security", label: t("marketing.common.security") },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-4">
            <BrandLogo href="/" size="sm" />
            <p className="text-sm text-muted-foreground">{t("marketing.footer.tagline")}</p>
            <a
              href={EASYWEDD_CONSUMER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-champagne-soft hover:text-champagne"
            >
              {t("common.forCouples")}
            </a>
            <p className="text-sm text-muted-soft">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("marketing.common.product")}
              </p>
              <ul className="space-y-2 text-sm text-muted-soft">
                {product.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("marketing.common.legal")}
              </p>
              <ul className="space-y-2 text-sm text-muted-soft">
                {legal.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>{t("marketing.common.allRights", { year })}</p>
          <p>{t("marketing.common.footerTagline")}</p>
        </div>
      </div>
    </footer>
  );
}
