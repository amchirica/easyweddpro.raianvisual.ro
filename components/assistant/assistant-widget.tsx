"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Send, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { submitAssistantFeedbackAction } from "@/lib/actions/assistant";
import {
  assistantMessages,
  assistantSubtitle,
  assistantTitle,
  normalizeLocale,
  type AssistantMessages,
} from "@/lib/assistant/i18n";
import type { AssistantLink, AssistantSurface } from "@/lib/assistant/knowledge/types";
import { suggestedForContext, buildAssistantContext } from "@/lib/assistant/context";
import { useOptionalI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: AssistantLink[];
  eventId?: string | null;
  feedback?: boolean | null;
};

type AssistantWidgetProps = {
  surface: AssistantSurface;
  locale?: string;
  className?: string;
};

export function AssistantWidget({ surface, locale: localeProp, className }: AssistantWidgetProps) {
  const pathname = usePathname() || (surface === "admin" ? "/admin" : "/dashboard");
  const i18n = useOptionalI18n();
  const locale = normalizeLocale(localeProp ?? i18n?.locale ?? "ro");
  const t: AssistantMessages = assistantMessages(locale);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [overrideSuggestions, setOverrideSuggestions] = useState<{
    path: string;
    items: string[];
  } | null>(null);

  const pageSuggestions = useMemo(() => {
    const ctx = buildAssistantContext({
      surface,
      pathname,
      locale,
      workspaceRole: null,
      plan: null,
    });
    return suggestedForContext(ctx);
  }, [surface, pathname, locale]);

  const suggestions =
    overrideSuggestions?.path === pathname ? overrideSuggestions.items : pageSuggestions;

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (text.length < 2 || loading) return;

      setError(null);
      setLoading(true);
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, pathname, locale, surface }),
        });

        if (res.status === 401) {
          setError(t.errorAuth);
          return;
        }
        if (res.status === 429) {
          setError(t.errorRateLimit);
          return;
        }
        if (!res.ok) {
          setError(t.errorGeneric);
          return;
        }

        const data = (await res.json()) as {
          answer: string;
          links?: AssistantLink[];
          suggestedQuestions?: string[];
          eventId?: string | null;
        };

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.answer,
            links: data.links ?? [],
            eventId: data.eventId ?? null,
            feedback: null,
          },
        ]);
        if (data.suggestedQuestions?.length) {
          setOverrideSuggestions({ path: pathname, items: data.suggestedQuestions });
        }
      } catch {
        setError(t.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [loading, pathname, locale, surface, t],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await ask(input);
  }

  async function sendFeedback(messageId: string, eventId: string, helpful: boolean) {
    const result = await submitAssistantFeedbackAction({ eventId, helpful });
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: helpful } : m)),
      );
    }
  }

  const fabOffset = "fixed bottom-4 left-4 z-40";

  return (
    <>
      <Button
        type="button"
        size="lg"
        className={cn(
          "gap-2 rounded-full shadow-lg",
          fabOffset,
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label={t.openPanel}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t.openPanel}</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="font-heading text-xl text-foreground">
              {assistantTitle(locale, surface)}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {assistantSubtitle(locale, surface)}
            </SheetDescription>
            <p className="text-[0.7rem] text-muted-soft">{t.readOnlyNote}</p>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t.whatCanIDo}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="rounded-full border border-border bg-surface-elevated/60 px-3 py-1.5 text-left text-xs text-foreground hover:border-champagne/40"
                      onClick={() => void ask(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-6 border-champagne/30 bg-champagne/10 text-foreground"
                    : "mr-2 border-border bg-surface-elevated/50 text-muted-foreground",
                )}
              >
                <div className="text-foreground">{m.content}</div>
                {m.links?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-xs font-medium text-champagne-soft hover:text-champagne"
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
                {m.role === "assistant" && m.eventId ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-soft">
                    <span>{t.useful}</span>
                    <button
                      type="button"
                      className={cn(
                        "rounded p-1 hover:bg-background",
                        m.feedback === true && "text-success",
                      )}
                      aria-label="thumbs up"
                      disabled={m.feedback != null}
                      onClick={() => void sendFeedback(m.id, m.eventId!, true)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "rounded p-1 hover:bg-background",
                        m.feedback === false && "text-destructive",
                      )}
                      aria-label="thumbs down"
                      disabled={m.feedback != null}
                      onClick={() => void sendFeedback(m.id, m.eventId!, false)}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? <p className="text-xs text-muted-soft">{t.thinking}</p> : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            {messages.length > 0 && suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => void ask(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={onSubmit}
            className="border-t border-border bg-background px-4 py-3"
          >
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                rows={2}
                className="min-h-[2.5rem] resize-none bg-surface-elevated/40"
              />
              <Button type="submit" size="icon" disabled={loading || input.trim().length < 2}>
                <Send className="h-4 w-4" aria-hidden />
                <span className="sr-only">{t.send}</span>
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
