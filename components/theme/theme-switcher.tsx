"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { useOptionalI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_COOKIE, type AppTheme } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function persistTheme(theme: AppTheme) {
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;samesite=lax`;
}

const emptySubscribe = () => () => {};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const i18n = useOptionalI18n();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const label = (key: string, fallback: string) =>
    i18n ? i18n.t(`theme.${key}`) : fallback;

  const current = (theme as AppTheme | undefined) ?? "dark";
  const Icon =
    !mounted ? Moon : current === "light" || resolvedTheme === "light" ? Sun : current === "system" ? Monitor : Moon;

  function choose(next: AppTheme) {
    persistTheme(next);
    setTheme(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", className)}
            aria-label={label("label", "Theme")}
          />
        }
      >
        <Icon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem onClick={() => choose("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {label("dark", "Dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => choose("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {label("light", "Light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => choose("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {label("system", "System")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
