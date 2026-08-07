import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";

const CHANNELS = [
  "Instagram",
  "WhatsApp",
  "Facebook",
  "Email",
  "Formulare",
  "Follow-up manual",
  "Verificare dată",
  "Ofertă",
  "Discuții",
  "Contract",
  "Avans",
  "Remindere",
  "Deadline",
];

export function ProblemSection() {
  return (
    <SectionShell muted>
      <SectionHeader
        title="Prea mult timp pierdut înainte să înceapă munca propriu-zisă."
        description="Cereri pe canale diferite, follow-up manual și pași comerciali care îți consumă ore — înainte să ajungi la eveniment."
      />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
        {CHANNELS.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-2xl space-y-4 text-center">
        <p className="font-heading text-xl text-foreground sm:text-2xl">
          Un lead care nu răspunde nu ar trebui să îți consume ore întregi.
        </p>
        <p className="text-base text-muted-foreground">
          EasyWedd Pro transformă procesul comercial într-un workflow clar și automatizabil.
        </p>
      </div>
    </SectionShell>
  );
}
