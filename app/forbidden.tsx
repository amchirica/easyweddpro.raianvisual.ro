import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
      <BrandLogo href="/" size="sm" />
      <div className="max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-400">403</p>
        <h1 className="mt-2 font-heading text-2xl font-medium text-foreground">Acces interzis</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Nu ai dreptul necesar pentru această acțiune de administrare.
        </p>
        <Link href="/admin" className="mt-6 inline-block text-sm text-champagne hover:underline">
          Înapoi la admin
        </Link>
      </div>
    </div>
  );
}
