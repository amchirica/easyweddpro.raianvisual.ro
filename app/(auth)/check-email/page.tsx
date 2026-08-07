import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Check email",
  robots: { index: false, follow: false },
};

export default async function CheckEmailPage() {
  const { t } = await getTranslator();

  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-champagne/30 bg-champagne/10 text-champagne">
        <MailCheck className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="font-heading text-2xl font-medium text-foreground">
        {t("auth.checkEmail")}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("auth.checkEmailBody")}</p>
      <div className="mt-8 space-y-3">
        <Button className="w-full" render={<Link href="/login" />} nativeButton={false}>
          {t("auth.backToLogin")}
        </Button>
      </div>
    </div>
  );
}
