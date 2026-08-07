import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const AUTOMATIONS = [
  { trigger: "Lead nou", action: "task automat" },
  { trigger: "Oferta nu a fost vizualizată", action: "follow-up" },
  { trigger: "Contract trimis", action: "reminder" },
  { trigger: "Avans scadent", action: "notificare" },
  { trigger: "Eveniment peste 7 zile", action: "checklist" },
  { trigger: "Eveniment finalizat", action: "solicitare review" },
];

export function AutomationSection() {
  return (
    <SectionShell muted>
      <SectionHeader
        title="Nu mai urmări manual fiecare client."
        description="Automatizări pe triggeri reali din workflow — fără pretinde integrări externe inactive."
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
        {AUTOMATIONS.map((item) => (
          <div
            key={item.trigger}
            className="surface-card flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="text-sm text-foreground">{item.trigger}</span>
            <span className="text-xs text-muted-soft sm:text-right">→ {item.action}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
