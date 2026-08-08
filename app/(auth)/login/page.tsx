import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { getTranslator } from "@/lib/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("auth.signInTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage() {
  const { t } = await getTranslator();

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          {t("auth.signInTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
