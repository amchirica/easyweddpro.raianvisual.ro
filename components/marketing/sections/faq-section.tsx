"use client";

import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

type FaqItem = { question: string; answer: string };

export function FaqSection() {
  const { t, tm } = useI18n();
  const faq = tm<FaqItem[]>("marketing.faq.items") ?? [];

  return (
    <SectionShell muted>
      <SectionHeader title={t("marketing.faq.title")} />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {faq.map((item) => (
          <details
            key={item.question}
            className="surface-card group p-5 [&_summary]:cursor-pointer"
          >
            <summary className="flex list-none items-center justify-between font-heading text-base font-medium text-foreground marker:content-none">
              {item.question}
              <span
                className="ml-4 text-champagne transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
