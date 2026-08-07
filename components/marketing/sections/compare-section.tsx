import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const GENERAL = [
  "configurare manuală",
  "workflow generic",
  "template-uri generale",
  "fără context evenimente",
];

const PRO = [
  "configurare pe tip business",
  "workflow evenimente",
  "template-uri specifice",
  "calendar evenimente",
  "portal client",
  "ecosistem EasyWedd",
];

export function CompareSection() {
  return (
    <SectionShell muted>
      <SectionHeader title="CRM general vs. EasyWedd Pro" />
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        <div className="surface-card p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-soft">
            CRM general
          </p>
          <ul className="mt-4 space-y-2">
            {GENERAL.map((item) => (
              <li key={item} className="text-sm text-muted-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card border-champagne/20 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-champagne-soft">
            EasyWedd Pro
          </p>
          <ul className="mt-4 space-y-2">
            {PRO.map((item) => (
              <li key={item} className="text-sm text-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
