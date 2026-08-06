import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.14),transparent)]"
      />
      <div className="mb-8">
        <BrandLogo href="/" size="md" priority />
      </div>
      <div className="surface-card w-full max-w-md p-8">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-soft">
        <Link href="/" className="hover:text-foreground">
          Înapoi la pagina principală
        </Link>
      </p>
    </div>
  );
}
