import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section className="px-6 py-24">
      <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
        <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
          Organizează-ți întregul business de evenimente.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Lead → ofertă → contract → avans → proiect → eveniment → follow-up. Începe gratuit.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
            Începe gratuit
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/features" />} nativeButton={false}>
            Vezi funcționalitățile
          </Button>
        </div>
      </div>
    </section>
  );
}
