"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startInspectSessionAction } from "@/lib/actions/platform-admin";

export function InspectSessionForm({ workspaceId }: { workspaceId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 10) {
      setError(t("admin.reasonMin10"));
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
      setError(err instanceof Error ? err.message : t("admin.actionFailed"));
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
          placeholder={t("admin.inspectReasonPh")}
          rows={4}
          required
          minLength={10}
          maxLength={500}
        />
        <p className="text-xs text-muted-soft">
          {t("admin.inspectSessionHint")}
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? t("billing.opening") : t("admin.startInspect")}
      </Button>
    </form>
  );
}
