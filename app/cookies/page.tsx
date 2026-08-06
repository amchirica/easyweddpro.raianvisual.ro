import Link from "next/link";
import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politica de cookies",
  description: `Cum folosește ${APP_NAME} cookie-uri și tehnologii similare.`,
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <BrandLogo href="/" size="sm" />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Înapoi
        </Link>
      </div>

      <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
        Politica de cookies
      </h1>
      <p className="mt-2 text-sm text-muted-soft">Ultima actualizare: 5 august 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">1. Ce sunt cookie-urile</h2>
          <p>
            Cookie-urile sunt fișiere mici stocate pe dispozitivul tău. Le folosim pentru
            autentificare, preferințe esențiale și măsurători agregate de performanță.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">2. Tipuri folosite</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Esențiale</span> — sesiune Supabase Auth, protecție CSRF /
              securitate.
            </li>
            <li>
              <span className="text-foreground">Funcționale</span> — preferințe de UI (ex. sidebar) când
              sunt necesare.
            </li>
            <li>
              <span className="text-foreground">Analitice</span> — doar dacă sunt activate explicit în
              producție; fără tracking agresiv pe paginile legale.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">3. Control</h2>
          <p>
            Poți șterge sau bloca cookie-urile din browser. Fără cookie-uri esențiale, autentificarea
            și dashboard-ul pot să nu funcționeze.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">4. Contact</h2>
          <p>
            Întrebări:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-4">
              {SUPPORT_EMAIL}
            </a>
            . Vezi și{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4">
              Politica de confidențialitate
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
