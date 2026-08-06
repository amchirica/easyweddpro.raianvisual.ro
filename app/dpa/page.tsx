import Link from "next/link";
import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Acord de prelucrare a datelor (DPA)",
  description: `Cadru DPA pentru procesarea datelor pe ${APP_NAME}.`,
};

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <BrandLogo href="/" size="sm" />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Înapoi
        </Link>
      </div>

      <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
        Acord de prelucrare a datelor (DPA)
      </h1>
      <p className="mt-2 text-sm text-muted-soft">Ultima actualizare: 5 august 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">1. Roluri</h2>
          <p>
            Clientul (workspace-ul) acționează ca operator pentru datele pe care le introduce despre
            leaduri, clienți și evenimente. {APP_NAME} acționează ca persoană împuternicită
            (processor) pentru a furniza serviciul SaaS.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">2. Scop</h2>
          <p>
            Prelucrăm datele doar pentru a opera CRM-ul, contractele, portalul client, facturarea
            abonamentului și suportul tehnic, conform instrucțiunilor documentate ale operatorului.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">3. Sub-procesatori</h2>
          <p>
            Infrastructură tipică: Supabase (bază de date / auth / storage), Cloudflare (hosting),
            Resend (email), Stripe (plăți). Lista poate fi actualizată; vom anunța schimbările
            materiale.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">4. Securitate & retenție</h2>
          <p>
            Aplicăm controale tehnice și organizatorice rezonabile (RLS, acces pe roluri, secret
            management). La încetarea serviciului, datele sunt șterse sau returnate conform politicii
            de retenție și cerințelor legale.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">5. Contact</h2>
          <p>
            Pentru un DPA semnat sau întrebări GDPR:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-4">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
