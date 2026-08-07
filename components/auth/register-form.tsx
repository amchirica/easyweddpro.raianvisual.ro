"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { resolvePostAuthPath } from "@/lib/auth/redirect";
import { hasSupabaseEnv } from "@/lib/env";
import {
  CONNECTION_ERROR_MESSAGE,
  logRequestFailure,
  toUserFacingRequestError,
} from "@/lib/network-error";
import { createClient } from "@/lib/supabase/client";
import { getSignupEmailRedirectTo } from "@/lib/url";
import { registerSchema } from "@/lib/validations/auth";

export function RegisterForm() {
  const { t } = useI18n();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = registerSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("validation.generic"));
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: { full_name: result.data.fullName },
          emailRedirectTo: getSignupEmailRedirectTo(),
        },
      });

      if (signUpError) {
        logRequestFailure({
          operation: "auth.signUp",
          url: "supabase.auth",
          error: signUpError,
        });
        setError(mapAuthError(signUpError.message));
        setPending(false);
        return;
      }

      if (data.session) {
        const destination = await resolvePostAuthPath(supabase, "/onboarding");
        router.replace(destination);
        router.refresh();
        return;
      }

      router.replace("/check-email");
    } catch (err) {
      logRequestFailure({
        operation: "auth.signUp",
        url: "supabase.auth",
        error: err,
      });
      setError(toUserFacingRequestError(err, CONNECTION_ERROR_MESSAGE));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("auth.fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          placeholder="Ana Popescu"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={pending}
        />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("auth.minPassword")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("auth.repeatPassword")}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
        {pending ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("auth.agreeTerms")}{" "}
        <Link href="/terms" className="underline underline-offset-4">
          {t("auth.terms")}
        </Link>{" "}
        {t("auth.and")}{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          {t("auth.privacy")}
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          {t("common.signIn")}
        </Link>
      </p>
    </form>
  );
}
