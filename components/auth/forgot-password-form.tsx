"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { z } from "zod";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { getPasswordResetRedirectTo } from "@/lib/url";

const emailSchema = z.email("Email invalid");

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-champagne/30 bg-champagne/10 p-4 text-sm text-champagne-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t("auth.demoNoSupabase")}</p>
        </div>
        <Button className="w-full" render={<Link href="/dashboard" />} nativeButton={false}>
          {t("auth.viewDemoDashboard")}
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted-foreground">{t("auth.resetSent")}</p>
        <Button variant="outline" className="w-full" render={<Link href="/login" />} nativeButton={false}>
          {t("auth.backToLogin")}
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("validation.email"));
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(result.data, {
        redirectTo: getPasswordResetRedirectTo(),
      });

      if (resetError) {
        setError(mapAuthError(resetError.message));
        setPending(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : undefined));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@studio.ro"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
        />
      </div>

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("common.loading") : t("auth.resetCta")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline underline-offset-4">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
