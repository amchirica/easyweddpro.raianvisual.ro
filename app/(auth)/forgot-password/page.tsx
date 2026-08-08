import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getTranslator } from "@/lib/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("auth.forgotTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage() {
  const { t } = await getTranslator();

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          {t("auth.forgotTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.forgotSubtitle")}</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
