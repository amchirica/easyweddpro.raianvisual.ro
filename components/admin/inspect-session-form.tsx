"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startInspectSessionAction } from "@/lib/actions/platform-admin";

export function InspectSessionForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 10) {
      setError("Motivul trebuie să aibă cel puțin 10 caractere.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await startInspectSessionAction({ workspaceId, reason: reason.trim() });
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast(result?.success ?? "Sesiune de inspectare deschisă.", "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Acțiunea a eșuat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inspect-reason">Motiv (obligatoriu)</Label>
        <Textarea
          id="inspect-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explică de ce inspectezi acest workspace (min. 10 caractere)…"
          rows={4}
          required
          minLength={10}
          maxLength={500}
        />
        <p className="text-xs text-muted-soft">
          Sesiunea este read-only, expiră în 60 de minute și este jurnalizată în audit.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Se deschide…" : "Pornește inspectarea"}
      </Button>
    </form>
  );
}
