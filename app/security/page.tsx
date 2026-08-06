import Link from "next/link";
import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Securitate",
  description: `Practici de securitate pentru ${APP_NAME}.`,
};

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <BrandLogo href="/" size="sm" />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Înapoi
        </Link>
      </div>

      <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">Securitate</h1>
      <p className="mt-2 text-sm text-muted-soft">Ultima actualizare: 5 august 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">1. Principii</h2>
          <p>
            Acces pe baza rolului, separare pe workspace, fără service role în browser, jurnale de
            activitate pentru acțiuni sensibile și token-uri publice stocate ca hash.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">2. Date & acces</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Row Level Security (RLS) pe tabelele multi-tenant</li>
            <li>Invitații și linkuri publice cu token hash + expirare</li>
            <li>Webhook Stripe verificat cu semnătură; cron protejat cu `CRON_SECRET`</li>
            <li>Upload-uri de logo prin URL semnat, tipuri MIME restrânse (fără SVG)</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">3. Raportare vulnerabilități</h2>
          <p>
            Trimite detalii la{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-4">
              {SUPPORT_EMAIL}
            </a>
            . Nu testa pe date reale ale clienților; cere un mediu de staging dacă ai nevoie.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">4. Documente conexe</h2>
          <p>
            <Link href="/privacy" className="text-foreground underline underline-offset-4">
              Confidențialitate
            </Link>
            {" · "}
            <Link href="/dpa" className="text-foreground underline underline-offset-4">
              DPA
            </Link>
            {" · "}
            <Link href="/cookies" className="text-foreground underline underline-offset-4">
              Cookies
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
