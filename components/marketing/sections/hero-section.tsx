import Link from "next/link";

import { HeroDashboardMock } from "@/components/marketing/hero-dashboard-mock";
import { Button } from "@/components/ui/button";
import {
  APP_HERO_HEADING,
  APP_HERO_SUPPORT,
  APP_NAME,
  APP_PROMISE,
} from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.16),transparent)]"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14">
        <div className="max-w-3xl text-center">
          <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
            Business OS for Event Professionals
          </span>
          <p className="animate-fade-in mt-4 text-sm text-muted-foreground">
            {APP_NAME}
          </p>
          <h1 className="animate-fade-up mt-3 font-heading text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
            {APP_HERO_HEADING}
          </h1>
          <p className="animate-fade-up mt-3 font-heading text-xl text-champagne-soft sm:text-2xl">
            {APP_HERO_SUPPORT}
          </p>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {APP_PROMISE}
          </p>
          <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              Începe gratuit
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#workflow" />}
              nativeButton={false}
            >
              Vezi cum funcționează
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-soft">
            Fără card bancar pe planul Free. Configurare în câteva minute.
          </p>
        </div>

        <HeroDashboardMock />
      </div>
    </section>
  );
}
