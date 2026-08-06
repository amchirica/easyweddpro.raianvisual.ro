"use client";

import { useState, type FormEvent } from "react";
import { MessageSquarePlus, Send } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "@/lib/actions/feedback";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "idea" | "unclear" | "general";

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Am găsit o problemă",
  idea: "Am o idee / sugestie",
  unclear: "Ceva nu e clar",
  general: "Altceva",
};

/** Discreet, always-available feedback entry point — beta hardening. */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  function resetAndClose() {
    setOpen(false);
    setType("general");
    setMessage("");
    setRating(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (message.trim().length < 5) {
      setError("Descrie puțin mai mult, te rog.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await submitFeedbackAction({
      type,
      message: message.trim(),
      rating,
      pageUrl: typeof window !== "undefined" ? window.location.pathname : null,
    });
    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    toast(result?.success ?? "Mulțumim pentru feedback!", "success");
    resetAndClose();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-40 rounded-full bg-background/90 shadow-lg backdrop-blur-md"
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus data-icon="inline-start" />
        Trimite feedback
      </Button>

      <Dialog open={open} onOpenChange={(next) => !submitting && (next ? setOpen(true) : resetAndClose())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trimite feedback</DialogTitle>
            <DialogDescription>
              Suntem în beta — spune-ne ce funcționează, ce nu, sau ce ți-ar plăcea să vezi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Tip</Label>
              <Select value={type} onValueChange={(value) => setType((value as FeedbackType) ?? "general")}>
                <SelectTrigger id="feedback-type" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[]).map((option) => (
                    <SelectItem key={option} value={option}>
                      {FEEDBACK_TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Mesaj</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Descrie ce ai observat sau ce ai vrea să se schimbe…"
                rows={4}
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notă (opțional)</Label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating((current) => (current === value ? null : value))}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors",
                      rating === value
                        ? "border-champagne bg-champagne/15 text-champagne"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                    aria-pressed={rating === value}
                    aria-label={`Notă ${value}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAndClose} disabled={submitting}>
                Anulează
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send data-icon="inline-start" />
                {submitting ? "Se trimite…" : "Trimite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
