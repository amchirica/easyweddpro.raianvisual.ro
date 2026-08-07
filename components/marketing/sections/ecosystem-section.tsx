import Link from "next/link";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { EASYWEDD_CONSUMER_URL } from "@/lib/constants";

const AVAILABLE_NOW = ["Ofertă", "Contract", "Portal client", "Plăți", "Proiect"];
const IN_DEVELOPMENT = ["Chestionar cuplu", "Sincronizare program", "Documente bidirecționale"];

export function EcosystemSection() {
  return (
    <SectionShell muted>
      <SectionHeader
        title="Mai mult decât un Business OS. Un ecosistem."
        description="EasyWedd pentru cupluri. EasyWedd Pro pentru furnizori."
      />

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="surface-card p-6 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pentru cupluri</p>
          <p className="mt-2 font-heading text-2xl text-foreground">EasyWedd</p>
          <Link
            href={EASYWEDD_CONSUMER_URL}
            className="mt-3 inline-block text-sm text-champagne-soft hover:text-champagne"
            rel="noopener noreferrer"
            target="_blank"
          >
            easywedd.raianvisual.ro
          </Link>
        </div>
        <p className="text-center text-2xl text-champagne/60" aria-hidden>
          ⇅
        </p>
        <div className="surface-card p-6 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pentru furnizori</p>
          <p className="mt-2 font-heading text-2xl text-foreground">EasyWedd Pro</p>
          <p className="mt-3 text-sm text-muted-soft">Business OS · Weddings & Events</p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-2">
        {["Ofertă", "Contract", "Plată", "Program", "Chestionar", "Documente"].map((item) => (
          <span
            key={item}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-champagne-soft">
            Disponibil acum
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {AVAILABLE_NOW.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-soft">
            În dezvoltare
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {IN_DEVELOPMENT.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
