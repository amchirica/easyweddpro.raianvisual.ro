"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { mapAuthQueryError, mapAuthQueryMessage } from "@/lib/auth/query-errors";
import { getSafeRedirectPath, resolvePostAuthPath } from "@/lib/auth/redirect";
import { hasSupabaseEnv } from "@/lib/env";
import {
  CONNECTION_ERROR_MESSAGE,
  logRequestFailure,
  toUserFacingRequestError,
} from "@/lib/network-error";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeRedirectPath(searchParams.get("next")) ?? "/dashboard";
  const queryError = mapAuthQueryError(searchParams.get("error"));
  const queryMessage = mapAuthQueryMessage(searchParams.get("message"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(queryError);
  const [info] = useState<string | null>(queryMessage);
  const [pending, setPending] = useState(false);

  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-champagne/30 bg-champagne/10 p-4 text-sm text-champagne-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Mod demo — Supabase nu este configurat în acest mediu. Poți
            explora produsul direct, fără autentificare.
          </p>
        </div>
        <Button className="w-full" render={<Link href="/dashboard" />} nativeButton={false}>
          Vezi dashboard-ul demo
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Date invalide.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (signInError) {
        logRequestFailure({
          operation: "auth.signInWithPassword",
          url: "supabase.auth",
          error: signInError,
        });
        setError(mapAuthError(signInError.message));
        setPending(false);
        return;
      }

      const destination = await resolvePostAuthPath(supabase, next);
      router.replace(destination);
      router.refresh();
    } catch (err) {
      logRequestFailure({
        operation: "auth.signInWithPassword",
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
        <Label htmlFor="email">Email</Label>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Parolă</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ai uitat parola?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      {info && !error ? (
        <p
          className="rounded-md border border-champagne/30 bg-champagne/10 px-3 py-2 text-sm text-champagne-soft"
          role="status"
        >
          {info}
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Se conectează…" : "Autentificare"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nu ai cont?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Creează cont gratuit
        </Link>
      </p>
    </form>
  );
}
