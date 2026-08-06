import Link from "next/link";
import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description: "Cum colectează și utilizează EasyWedd Pro datele personale.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <BrandLogo href="/" size="sm" />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Înapoi
        </Link>
      </div>

      <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
        Politica de confidențialitate
      </h1>
      <p className="mt-2 text-sm text-muted-soft">Ultima actualizare: 5 august 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            1. Ce date colectăm
          </h2>
          <p>
            Colectăm datele necesare pentru funcționarea contului tău —
            nume, email, date despre companie și informațiile pe care le
            introduci în platformă despre leadurile, clienții și
            proiectele tale.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            2. Cum folosim datele
          </h2>
          <p>
            Folosim datele exclusiv pentru a oferi funcționalitățile
            EasyWedd Pro: gestionarea leadurilor, ofertelor, contractelor,
            plăților și comunicarea cu clienții tăi prin portalul dedicat.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            3. Partajarea datelor
          </h2>
          <p>
            Nu vindem datele tale. Le partajăm doar cu furnizori de
            infrastructură (hosting, autentificare, email tranzacțional)
            strict necesari pentru funcționarea serviciului.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            4. Drepturile tale
          </h2>
          <p>
            Poți solicita oricând accesul, corectarea sau ștergerea datelor
            tale personale, conform legislației aplicabile privind protecția
            datelor.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            5. Contact
          </h2>
          <p>
            Pentru orice întrebare legată de confidențialitate, scrie-ne la{" "}
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
