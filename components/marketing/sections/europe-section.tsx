import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const ADVANTAGES = [
  "GDPR — proiectat cu confidențialitatea în minte",
  "EUR / RON și alte monede",
  "Timezone și localizare",
  "Limbi configurabile",
  "Contracte configurabile",
  "TVA și fluxuri de plată",
  "Plăți manuale + Stripe",
  "Business european",
];

export function EuropeSection() {
  return (
    <SectionShell>
      <SectionHeader
        title="Construit pentru piața europeană"
        description="Localizare, monede și practici de business europene. Nu pretindem conformitate juridică absolută — îți dăm controlul să configurezi."
      />
      <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        {ADVANTAGES.map((item) => (
          <li key={item} className="surface-card px-5 py-4 text-sm text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
