"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  showWordmark?: boolean;
  /**
   * sm — auth/admin compact (~120px mark area)
   * md — public header (~150px)
   * lg — hero/auth emphasis
   * collapsed — square white mark for sidebar rail
   */
  size?: "sm" | "md" | "lg" | "collapsed";
  priority?: boolean;
};

const sizeMap = {
  sm: { img: 120, box: "min-h-9 px-2.5 py-1.5", text: "text-base" },
  md: { img: 150, box: "min-h-10 px-3 py-2", text: "text-lg" },
  lg: { img: 170, box: "min-h-12 px-3.5 py-2.5", text: "text-xl" },
  collapsed: { img: 36, box: "h-10 w-10 p-1.5", text: "text-sm" },
};

/**
 * EasyWedd Pro mark must always sit on a white surface so /logo.png stays legible
 * on the dark app chrome. Do not recolor the PNG asset.
 */
export function BrandLogo({
  href = "/",
  className,
  showWordmark = true,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const sizes = sizeMap[size];
  const [failed, setFailed] = useState(false);
  const isCollapsed = size === "collapsed";

  const mark = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm",
        sizes.box,
      )}
    >
      {failed ? (
        <span
          className={cn(
            "font-heading font-semibold tracking-tight text-neutral-900",
            isCollapsed ? "text-xs" : "text-sm",
          )}
          aria-hidden
        >
          {isCollapsed ? "EP" : APP_NAME}
        </span>
      ) : (
        <Image
          src="/logo.png"
          alt={APP_NAME}
          width={sizes.img}
          height={Math.round(sizes.img * 0.35)}
          priority={priority}
          className={cn(
            "h-auto w-auto object-contain",
            isCollapsed ? "max-h-7 max-w-7" : "max-h-8",
            size === "md" && "max-h-9",
            size === "lg" && "max-h-10",
          )}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      {showWordmark && !isCollapsed ? (
        <span className={cn("font-heading font-medium tracking-tight text-foreground", sizes.text)}>
          {APP_NAME}
        </span>
      ) : (
        <span className="sr-only">{APP_NAME}</span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={APP_NAME}
    >
      {content}
    </Link>
  );
}
