import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_TAGLINE, EASYWEDD_CONSUMER_URL, SUPPORT_EMAIL } from "@/lib/constants";

const PRODUCT_LINKS = [
  { href: "/features", label: "Funcționalități" },
  { href: "/pricing", label: "Prețuri" },
  { href: "/login", label: "Autentificare" },
  { href: "/register", label: "Creează cont" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Confidențialitate" },
  { href: "/terms", label: "Termeni și condiții" },
  { href: "/cookies", label: "Cookies" },
  { href: "/dpa", label: "DPA" },
  { href: "/security", label: "Securitate" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-4">
            <BrandLogo href="/" size="sm" />
            <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
            <a
              href={EASYWEDD_CONSUMER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-champagne-soft hover:text-champagne"
            >
              Pentru miri → EasyWedd
            </a>
            <p className="text-sm text-muted-soft">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Produs
              </p>
              <ul className="space-y-2 text-sm text-muted-soft">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Legal
              </p>
              <ul className="space-y-2 text-sm text-muted-soft">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} EasyWedd Pro. Toate drepturile rezervate.</p>
          <p>Business OS pentru industria evenimentelor.</p>
        </div>
      </div>
    </footer>
  );
}
