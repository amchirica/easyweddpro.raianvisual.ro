import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { getTranslator } from "@/lib/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("auth.updatePasswordTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage() {
  const { t } = await getTranslator();

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          {t("auth.updatePasswordTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("auth.updatePasswordSubtitle")}
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
