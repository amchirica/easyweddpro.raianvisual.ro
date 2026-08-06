"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useToast } from "@/components/shared/toast-provider";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  variant?: "menu-item" | "button";
  className?: string;
};

export function LogoutButton({ variant = "menu-item", className }: LogoutButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);

    try {
      const response = await fetch("/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Logout failed", { status: response.status });
        }
        toast("Deconectarea a eșuat. Încearcă din nou.", "error");
        setPending(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Logout failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
      toast("Deconectarea a eșuat. Încearcă din nou.", "error");
      setPending(false);
    }
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={pending}
        onClick={handleLogout}
      >
        <LogOut data-icon="inline-start" />
        {pending ? "Se deconectează…" : "Deconectare"}
      </Button>
    );
  }

  return (
    <DropdownMenuItem
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        void handleLogout();
      }}
      className={cn("cursor-pointer", className)}
    >
      <LogOut className="h-3.5 w-3.5" />
      {pending ? "Se deconectează…" : "Deconectare"}
    </DropdownMenuItem>
  );
}
