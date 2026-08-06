"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Minim 8 caractere"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
  });

export function UpdatePasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!hasSupabaseEnv()) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-champagne/30 bg-champagne/10 p-4 text-sm text-champagne-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>Mod demo — Supabase nu este configurat, actualizarea parolei nu este disponibilă.</p>
      </div>
    );
  }

  if (success) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Parola a fost actualizată. Te redirecționăm către autentificare…
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Date invalide.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: result.data.password,
      });

      if (updateError) {
        setError(mapAuthError(updateError.message));
        setPending(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : undefined));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">Parolă nouă</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Minim 8 caractere"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmă parola nouă</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repetă parola"
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
        {pending ? "Se actualizează…" : "Actualizează parola"}
      </Button>
    </form>
  );
}
