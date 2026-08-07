"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { searchPlatformAction, searchWorkspaceAction } from "@/lib/actions/search";
import { useOptionalI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PlatformSearchGroup } from "@/lib/search/platform-search";
import type { SearchGroup } from "@/lib/search/workspace-search";

type GlobalSearchProps = {
  mode?: "workspace" | "platform";
  className?: string;
  compact?: boolean;
  /** Only one instance should handle Cmd/Ctrl+K (avoid double dialogs). */
  enableShortcut?: boolean;
};

type FlatHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  groupKey: string;
};

function flattenGroups(groups: Array<SearchGroup | PlatformSearchGroup>): FlatHit[] {
  return groups.flatMap((g) =>
    g.items.map((item) => ({
      id: `${g.key}-${item.id}`,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      groupKey: g.key,
    })),
  );
}

const emptySubscribe = () => () => {};

export function GlobalSearch({
  mode = "workspace",
  className,
  compact = false,
  enableShortcut = true,
}: GlobalSearchProps) {
  const router = useRouter();
  const i18n = useOptionalI18n();
  const t = (key: string, params?: Record<string, string | number>) =>
    i18n?.t(key, params) ?? key;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<Array<SearchGroup | PlatformSearchGroup>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const listId = useId();
  const isMac = useSyncExternalStore(
    emptySubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );

  const hits = flattenGroups(groups);

  const runSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      if (q.length < 2) {
        setGroups([]);
        setError(null);
        return;
      }
      const requestId = ++requestIdRef.current;
      startTransition(async () => {
        const result =
          mode === "platform"
            ? await searchPlatformAction(q)
            : await searchWorkspaceAction(q);
        if (requestId !== requestIdRef.current) return;
        if (result.error || !result.data) {
          setGroups([]);
          setError(result.error ?? "error");
          return;
        }
        setError(null);
        setGroups(result.data.groups);
        setActiveIndex(0);
      });
    },
    [mode],
  );

  useEffect(() => {
    if (!enableShortcut) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enableShortcut]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setGroups([]);
    router.push(href);
  }

  const shortcutLabel = isMac ? "⌘K" : t("search.shortcut");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "relative h-10 w-full justify-start gap-2 bg-card/60 px-3 text-muted-foreground",
          compact && "w-10 justify-center px-0",
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label={t("search.title")}
      >
        <Search className="h-4 w-4 shrink-0" />
        {!compact ? (
          <>
            <span className="truncate text-sm">{t("search.placeholder")}</span>
            <kbd className="pointer-events-none ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              {shortcutLabel}
            </kbd>
          </>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("search.title")}</DialogTitle>
            <DialogDescription>{t("search.placeholder")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
              aria-controls={listId}
              aria-autocomplete="list"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && hits[activeIndex]) {
                  e.preventDefault();
                  go(hits[activeIndex].href);
                }
              }}
            />
            {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>

          <div id={listId} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
            {query.trim().length > 0 && query.trim().length < 2 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t("search.minChars")}
              </p>
            ) : null}
            {error ? (
              <p className="px-3 py-6 text-center text-sm text-destructive">
                {error === "forbidden" ? t("admin.noAccess") : error}
              </p>
            ) : null}
            {!error && query.trim().length >= 2 && !pending && hits.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t("search.noResults")}
              </p>
            ) : null}

            {groups.map((group) => (
              <div key={group.key} className="mb-2">
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t(`search.groups.${group.key}`)}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const flatId = `${group.key}-${item.id}`;
                    const index = hits.findIndex((h) => h.id === flatId);
                    const active = index === activeIndex;
                    return (
                      <li key={flatId}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={cn(
                            "flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors",
                            active ? "bg-accent/20 text-foreground" : "hover:bg-muted/60",
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(item.href)}
                        >
                          <span className="text-sm text-foreground">{item.title}</span>
                          {item.subtitle ? (
                            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
