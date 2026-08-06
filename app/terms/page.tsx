import Link from "next/link";
import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: `Termenii și condițiile de utilizare a platformei ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <BrandLogo href="/" size="sm" />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Înapoi
        </Link>
      </div>

      <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
        Termeni și condiții
      </h1>
      <p className="mt-2 text-sm text-muted-soft">Ultima actualizare: 5 august 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            1. Acceptarea termenilor
          </h2>
          <p>
            Prin crearea unui cont și utilizarea {APP_NAME}, confirmi că ai
            citit și ești de acord cu acești termeni și condiții.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            2. Contul tău
          </h2>
          <p>
            Ești responsabil pentru confidențialitatea datelor de acces la
            contul tău și pentru toate activitățile desfășurate prin acel
            cont.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            3. Abonamente și facturare
          </h2>
          <p>
            Planurile plătite se facturează lunar. Poți face upgrade,
            downgrade sau anula abonamentul oricând din setările contului,
            fără penalizări.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            4. Conținut și date
          </h2>
          <p>
            Rămâi proprietarul datelor introduse în platformă (leaduri,
            clienți, contracte, materiale). Nu revendicăm drepturi de
            proprietate asupra conținutului tău.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            5. Limitarea răspunderii
          </h2>
          <p>
            {APP_NAME} este oferit „ca atare”. Nu garantăm disponibilitate
            neîntreruptă și nu suntem răspunzători pentru pierderi indirecte
            rezultate din utilizarea serviciului.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
            6. Contact
          </h2>
          <p>
            Pentru întrebări legate de acești termeni, scrie-ne la{" "}
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
