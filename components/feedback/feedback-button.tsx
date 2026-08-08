"use client";

import { useI18n } from "@/components/providers/i18n-provider";

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

const FEEDBACK_TYPE_KEYS: FeedbackType[] = ["bug", "idea", "unclear", "general"];


/** Discreet, always-available feedback entry point — beta hardening. */
export function FeedbackButton() {
  const { t } = useI18n();
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
      setError(t("common.feedback.needMore"));
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
              {t("common.feedback.betaIntro")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">{t("common.type")}</Label>
              <Select value={type} onValueChange={(value) => setType((value as FeedbackType) ?? "general")}>
                <SelectTrigger id="feedback-type" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPE_KEYS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`common.feedback.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">{t("common.feedback.message")}</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("common.feedback.placeholder")}
                rows={4}
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("common.feedback.ratingOptional")}</Label>
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
                    aria-label={t("common.feedback.ratingAria", { value })}
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send data-icon="inline-start" />
                {submitting ? t("modules.team.sending") : t("common.send")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
