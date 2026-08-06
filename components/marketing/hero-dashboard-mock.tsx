import { formatCurrency } from "@/lib/format";

const KPIS = [
  { label: "Leaduri noi", value: "24", trend: "+6 săpt. aceasta" },
  { label: "Conversie", value: "38%", trend: "+4% vs. luna trecută" },
  { label: "Valoare pipeline", value: formatCurrency(64500), trend: "12 oferte în lucru" },
  { label: "Evenimente viitoare", value: "7", trend: "3 contracte active" },
];

const PIPELINE = [
  { stage: "Leaduri", count: 9, tone: "bg-muted-foreground/40" },
  { stage: "Oferte", count: 6, tone: "bg-champagne/50" },
  { stage: "Contracte", count: 5, tone: "bg-champagne/70" },
  { stage: "Proiecte", count: 4, tone: "bg-champagne" },
  { stage: "Plăți", count: 3, tone: "bg-success" },
];

const CALENDAR_ITEMS = [
  { day: "12", month: "AUG", title: "Eveniment Popescu", time: "10:00 – 23:00" },
  { day: "20", month: "AUG", title: "Corporate Nova Events", time: "17:00" },
  { day: "29", month: "AUG", title: "Rezervare Elysium Hall", time: "11:00 – 23:30" },
];

const ACTIVITY = [
  { text: "Ofertă „Pachet Full Service” vizualizată de Andreea & Mihai", time: "acum 12 min" },
  { text: "Plată avans confirmată — Laura & Paul Niculescu", time: "acum 2 ore" },
  { text: "Contract acceptat digital — Maria & Cristian Dobre", time: "ieri" },
  { text: "Task urgent: confirmare logistică — SoundCraft", time: "ieri" },
];

const TEAM = [
  { name: "Alex", role: "Sales" },
  { name: "Mara", role: "Ops" },
  { name: "Ion", role: "Proiect" },
];

export function HeroDashboardMock() {
  return (
    <div
      aria-hidden="true"
      className="surface-card glow-accent relative mx-auto w-full max-w-2xl overflow-hidden p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          EasyWedd Pro · Dashboard
        </p>
        <span className="rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-champagne-soft">
          Workspace demo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-surface-elevated/60 p-3">
            <p className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1.5 font-heading text-lg font-medium text-champagne sm:text-xl">
              {kpi.value}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-muted-soft">{kpi.trend}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-5">
        {PIPELINE.map((stage) => (
          <div
            key={stage.stage}
            className="rounded-xl border border-border bg-surface-elevated/60 p-2.5"
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${stage.tone}`} />
              <p className="truncate text-[0.62rem] text-muted-foreground">{stage.stage}</p>
            </div>
            <p className="mt-1.5 font-heading text-base font-medium text-foreground">
              {stage.count}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-elevated/60 p-3">
          <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Calendar & task-uri
          </p>
          <ul className="space-y-2">
            {CALENDAR_ITEMS.map((item) => (
              <li key={item.title} className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-champagne/25 bg-champagne/10 text-champagne">
                  <span className="text-[0.55rem] leading-none">{item.month}</span>
                  <span className="text-xs font-medium leading-none">{item.day}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-foreground">{item.title}</p>
                  <p className="text-[0.65rem] text-muted-soft">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface-elevated/60 p-3">
          <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Activitate recentă
          </p>
          <ul className="space-y-2.5">
            {ACTIVITY.map((item) => (
              <li key={item.text} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                <div className="min-w-0">
                  <p className="text-xs leading-snug text-foreground">{item.text}</p>
                  <p className="text-[0.65rem] text-muted-soft">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <p className="text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground">Echipă</p>
            <div className="flex -space-x-1.5">
              {TEAM.map((member) => (
                <span
                  key={member.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-champagne/15 text-[0.55rem] text-champagne"
                  title={`${member.name} · ${member.role}`}
                >
                  {member.name.slice(0, 1)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
