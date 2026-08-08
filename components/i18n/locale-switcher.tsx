"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const OPTIONS: AppLocale[] = ["ro", "en"];

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchLocale(code: AppLocale) {
    if (code === locale || pending) return;
    setLocale(code);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border/80 p-0.5", className)}
      role="group"
      aria-label={t("common.language")}
    >
      {OPTIONS.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={locale === code ? "secondary" : "ghost"}
          className="h-7 min-w-9 px-2 text-xs uppercase"
          disabled={pending}
          onClick={() => switchLocale(code)}
          aria-pressed={locale === code}
        >
          {code}
        </Button>
      ))}
    </div>
  );
}
