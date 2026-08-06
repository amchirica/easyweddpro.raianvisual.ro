"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const sizeMap = {
  sm: { box: "h-7 w-7", text: "text-base", px: 28 },
  md: { box: "h-9 w-9", text: "text-lg", px: 36 },
  lg: { box: "h-11 w-11", text: "text-xl", px: 44 },
};

export function BrandLogo({
  href = "/",
  className,
  showWordmark = true,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const sizes = sizeMap[size];
  const [failed, setFailed] = useState(false);

  const mark = failed ? (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-champagne/30 bg-gradient-to-br from-champagne/20 to-champagne/5 font-heading font-semibold text-champagne",
        sizes.box,
        "text-xs",
      )}
      aria-hidden
    >
      EP
    </span>
  ) : (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", sizes.box)}>
      <Image
        src="/logo.png"
        alt=""
        width={sizes.px}
        height={sizes.px}
        priority={priority}
        className="h-full w-auto object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      {showWordmark ? (
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
