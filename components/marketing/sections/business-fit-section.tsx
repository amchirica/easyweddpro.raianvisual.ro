"use client";

import { Camera, Flower2, MapPin, Music4, Sparkles, UtensilsCrossed, Users } from "lucide-react";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

const FIT_ICONS = [Camera, Music4, Users, MapPin, Flower2, UtensilsCrossed, Sparkles] as const;

type FitItem = { title: string; items: string[] };

export function BusinessFitSection() {
  const { t, tm } = useI18n();
  const fits = tm<FitItem[]>("marketing.businessFit.items") ?? [];

  return (
    <SectionShell muted>
      <SectionHeader
        title={t("marketing.businessFit.title")}
        description={t("marketing.businessFit.description")}
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fits.map((fit, index) => {
          const Icon = FIT_ICONS[index] ?? Users;
          return (
            <div key={fit.title} className="surface-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <p className="mt-4 font-heading text-lg font-medium text-foreground">{fit.title}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {fit.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border/80 px-2.5 py-0.5 text-[0.7rem] text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-10 text-center font-heading text-xl text-champagne-soft sm:text-2xl">
        {t("marketing.businessFit.closing")}
      </p>
    </SectionShell>
  );
}
