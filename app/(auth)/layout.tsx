import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { getTranslator } from "@/lib/i18n/t";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t } = await getTranslator();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.14),transparent)]"
      />
      <div className="mb-6 flex w-full max-w-md items-center justify-between gap-3">
        <BrandLogo href="/" size="md" priority />
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
      <div className="surface-card w-full max-w-md p-8">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-soft">
        <Link href="/" className="hover:text-foreground">
          {t("common.back")}
        </Link>
      </p>
    </div>
  );
}
