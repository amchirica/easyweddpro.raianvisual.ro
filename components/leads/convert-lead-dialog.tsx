"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { convertLeadToClientAction, findMatchingClientsAction } from "@/lib/actions/leads";
import type { LeadViewModel } from "@/lib/crm/mappers";
import { cn } from "@/lib/utils";

type ClientMatch = { id: string; name: string; email: string | null; phone: string | null };

type ConvertLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadViewModel;
  mode: "live" | "demo";
  onSuccess?: (clientId: string) => void;
};

export function ConvertLeadDialog({
  open,
  onOpenChange,
  lead,
  mode,
  onSuccess,
}: ConvertLeadDialogProps) {
  const { t } = useI18n();
  const [choice, setChoice] = useState<"create" | "existing">("create");
  const [matches, setMatches] = useState<ClientMatch[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setChoice("create");
    setSelectedClientId(null);
    setError(null);
    setMatches([]);
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "live") return;

    let cancelled = false;

    async function loadMatches() {
      setLoadingMatches(true);
      try {
        const result = await findMatchingClientsAction(lead.id);
        if (cancelled) return;
        if (result?.error) {
          setError(result.error);
          return;
        }
        const found = result?.data?.matches ?? [];
        setMatches(found);
        if (found.length > 0) {
          setChoice("existing");
          setSelectedClientId(found[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    }

    void loadMatches();

    return () => {
      cancelled = true;
    };
  }, [open, mode, lead.id]);

  async function handleConvert() {
    if (submitting) return;

    if (mode !== "live") {
      toast(t("modules.leads.convertNeedAccount"), "info");
      return;
    }

    if (choice === "existing" && !selectedClientId) {
      setError(t("modules.leads.selectExisting"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await convertLeadToClientAction({
      leadId: lead.id,
      mode: choice,
      existingClientId: choice === "existing" ? selectedClientId : null,
    });

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setError(result?.error ?? t("modules.leads.convertFailed"));
      return;
    }

    toast(result.success ?? "Lead convertit în client.", "success");
    onOpenChange(false);
    onSuccess?.(result.data.clientId);
    router.push(`/dashboard/clients/${result.data.clientId}`);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("modules.leads.convertTitle")}</DialogTitle>
          <DialogDescription>
            {t("modules.leads.convertHint", { name: lead.name })}
          </DialogDescription>
        </DialogHeader>

        {mode !== "live" ? (
          <div className="space-y-4">
            <p className="rounded-md border border-border bg-background/40 px-3 py-3 text-sm text-muted-foreground">
              {t("modules.leads.convertDemo")}
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setChoice("create")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  choice === "create"
                    ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                    : "border-border text-muted-foreground hover:border-champagne/25",
                )}
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                Client nou
              </button>
              <button
                type="button"
                onClick={() => setChoice("existing")}
                disabled={matches.length === 0}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  choice === "existing"
                    ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                    : "border-border text-muted-foreground hover:border-champagne/25",
                )}
              >
                <UserCheck className="h-4 w-4" aria-hidden />
                Client existent
              </button>
            </div>

            {loadingMatches ? (
              <p className="text-sm text-muted-foreground">{t("modules.leads.searchingMatches")}</p>
            ) : choice === "existing" ? (
              matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("modules.leads.noMatches")}
                </p>
              ) : (
                <div className="space-y-2">
                  {matches.map((match) => (
                    <label
                      key={match.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                        selectedClientId === match.id
                          ? "border-champagne/40 bg-champagne/10"
                          : "border-border hover:border-champagne/25",
                      )}
                    >
                      <span>
                        <span className="block font-medium text-foreground">{match.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {match.email || match.phone || "—"}
                        </span>
                      </span>
                      <input
                        type="radio"
                        name="existing-client"
                        checked={selectedClientId === match.id}
                        onChange={() => setSelectedClientId(match.id)}
                        className="size-4 accent-[var(--champagne)]"
                      />
                    </label>
                  ))}
                </div>
              )
            ) : null}

            {error ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={handleConvert} disabled={submitting}>
                {submitting ? t("modules.leads.converting") : t("modules.leads.convert")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
