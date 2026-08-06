import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/features", label: "Funcționalități" },
  { href: "/pricing", label: "Prețuri" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <BrandLogo href="/" size="sm" priority />

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
            Autentificare
          </Button>
          <Button render={<Link href="/register" />} nativeButton={false}>Începe gratuit</Button>
        </div>
      </div>
    </header>
  );
}
