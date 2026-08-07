"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import { EASYWEDD_CONSUMER_URL } from "@/lib/constants";

export function SiteHeader() {
  const { t } = useI18n();

  const navLinks = [
    { href: "/features", label: t("nav.features") },
    { href: "/pricing", label: t("nav.pricing") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <BrandLogo href="/" size="sm" priority />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={EASYWEDD_CONSUMER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-champagne-soft"
          >
            {t("common.forCouples")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <ThemeSwitcher />
          <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
            {t("common.signIn")}
          </Button>
          <Button render={<Link href="/register" />} nativeButton={false}>
            {t("common.getStarted")}
          </Button>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-2 md:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <a
            href={EASYWEDD_CONSUMER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-champagne-soft"
          >
            {t("common.forCouples")}
          </a>
        </div>
      </div>
    </header>
  );
}
