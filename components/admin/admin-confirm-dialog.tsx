"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  requireReason?: boolean;
  destructive?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
};

export function AdminConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmă",
  requireReason = true,
  destructive = false,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (requireReason && reason.trim().length < 10) {
      setError("Motivul trebuie să aibă cel puțin 10 caractere.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Acțiunea a eșuat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={<span className="inline-flex" />}
      >
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason ? (
          <div className="space-y-2">
            <Label htmlFor="admin-reason">Motiv (obligatoriu)</Label>
            <Textarea
              id="admin-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explică pe scurt de ce faci această acțiune…"
              rows={3}
            />
          </div>
        ) : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Anulează
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy ? "Se procesează…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
