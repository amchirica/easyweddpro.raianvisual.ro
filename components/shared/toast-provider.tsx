"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md animate-fade-in",
              item.tone === "success" &&
                "border-success/30 bg-background/95 text-success",
              item.tone === "error" &&
                "border-destructive/30 bg-background/95 text-destructive",
              item.tone === "info" &&
                "border-border bg-background/95 text-foreground",
            )}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (message: string, tone?: ToastTone) => {
        if (process.env.NODE_ENV === "development") {
          console.info(`[toast:${tone ?? "info"}]`, message);
        }
      },
    };
  }
  return ctx;
}
