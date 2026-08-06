"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort; ignore registration failures in older browsers.
    });
  }, []);

  return null;
}
