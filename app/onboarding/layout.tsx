import { BrandLogo } from "@/components/brand/brand-logo";

export const dynamic = "force-dynamic";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center px-6 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.14),transparent)]"
      />
      <div className="mb-10">
        <BrandLogo size="md" />
      </div>
      {children}
    </div>
  );
}
