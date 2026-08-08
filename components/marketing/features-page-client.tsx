"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Contact,
  FileText,
  FolderKanban,
  LayoutTemplate,
  ScrollText,
  Users,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

const GROUP_ICONS = [
  [Users, Contact, FileText, ScrollText],
  [CalendarDays, FolderKanban, CheckSquare, UsersRound],
  [Wallet, BarChart3],
  [Zap, LayoutTemplate],
] as const;

type FeatureItem = { title: string; description: string };
type FeatureGroup = { title: string; description: string; items: FeatureItem[] };

export function FeaturesPageClient() {
  const { t, tm } = useI18n();
  const groups = tm<FeatureGroup[]>("marketing.featuresPage.groups") ?? [];

  return (
    <>
      <section className="px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
          {t("marketing.featuresPage.eyebrow")}
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          {t("marketing.featuresPage.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          {t("marketing.featuresPage.description")}
        </p>
      </section>

      {groups.map((group, index) => (
        <section
          key={group.title}
          className={
            index % 2 === 1
              ? "border-t border-border bg-background-secondary/40 px-6 py-16"
              : "border-t border-border px-6 py-16"
          }
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-medium text-foreground sm:text-3xl">
                {group.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {group.items.map((item, itemIndex) => {
                const Icon = GROUP_ICONS[index]?.[itemIndex] ?? Users;
                return (
                  <div key={item.title} className="surface-card p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <p className="mt-4 font-heading text-lg font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-border px-6 py-20">
        <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            {t("marketing.featuresPage.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            {t("marketing.featuresPage.ctaDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              {t("marketing.common.startFree")}
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/pricing" />} nativeButton={false}>
              {t("marketing.featuresPage.seePricing")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
