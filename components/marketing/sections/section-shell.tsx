import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  muted?: boolean;
};

export function SectionShell({ id, children, className, muted }: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 py-20",
        muted && "border-t border-border bg-background-secondary/40",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({ eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-champagne/25 bg-champagne/10 px-3 py-1 text-[0.7rem] font-medium tracking-wide text-champagne-soft">
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "font-heading text-3xl font-medium text-balance text-foreground sm:text-4xl",
          eyebrow && "mt-4",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
