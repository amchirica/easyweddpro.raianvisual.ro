import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";

export const metadata: Metadata = {
  title: "Portal client",
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.12),transparent)]"
      />
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <BrandLogo size="sm" />
          <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium text-champagne-soft">
            Portal client
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
