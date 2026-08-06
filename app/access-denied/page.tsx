import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata = {
  title: "Acces interzis",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
      <BrandLogo href="/" size="md" />
      <div className="max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-400">403</p>
        <h1 className="mt-2 font-heading text-3xl font-medium text-foreground">Acces interzis</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Nu ai permisiunea de a accesa panoul de administrare al platformei. Dacă crezi că este o
          eroare, contactează un super-admin.
        </p>
        <div className="mt-8 flex justify-center gap-4 text-sm">
          <Link href="/dashboard" className="text-champagne hover:underline">
            Mergi la dashboard
          </Link>
          <Link href="/" className="text-muted-soft hover:text-foreground">
            Acasă
          </Link>
        </div>
      </div>
    </div>
  );
}
