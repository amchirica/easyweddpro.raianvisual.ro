import Link from "next/link";
import type { Metadata } from "next";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Contact,
  FileText,
  FolderKanban,
  LayoutTemplate,
  ScrollText,
  Users,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Funcționalități",
  description:
    "Descoperă modulele EasyWedd Pro: leaduri, oferte, contracte, calendar, proiecte, plăți, automatizări și portal de client pentru furnizori de evenimente.",
};

const FEATURE_GROUPS = [
  {
    title: "Vânzări",
    description: "Transformă mai multe leaduri în contracte semnate.",
    items: [
      {
        icon: Users,
        title: "Pipeline de leaduri",
        description:
          "Capturezi leaduri din formular, rețele sociale sau recomandări și le urmărești pe stagii — de la contact la câștigat sau pierdut.",
      },
      {
        icon: Contact,
        title: "Dosare de clienți",
        description:
          "Istoric complet al conversațiilor, ofertelor și contractelor pentru fiecare client, într-un singur loc.",
      },
      {
        icon: FileText,
        title: "Oferte cu link public",
        description:
          "Trimiți pachete personalizate cu preț și termeni pe un link elegant, urmăribil — vezi exact când a fost vizualizată oferta.",
      },
      {
        icon: ScrollText,
        title: "Contracte digitale",
        description:
          "Statusuri clare de la trimis la semnat, fără hârtii pierdute și fără schimb interminabil de emailuri.",
      },
    ],
  },
  {
    title: "Operațiuni",
    description: "Coordonezi echipa de la rezervare la închiderea proiectului.",
    items: [
      {
        icon: CalendarDays,
        title: "Calendar unificat",
        description:
          "Evenimente, deadline-uri și scadențe de plată — toate într-un singur calendar al businessului.",
      },
      {
        icon: FolderKanban,
        title: "Pipeline de proiecte",
        description:
          "Urmărești fiecare proiect prin etape configurabile — generice sau specializate pe tipul de business.",
      },
      {
        icon: CheckSquare,
        title: "Task-uri de echipă",
        description:
          "Alocă sarcini colegilor, cu priorități și termene, pentru ca nimic să nu rămână neterminat.",
      },
      {
        icon: UsersRound,
        title: "Roluri de echipă",
        description:
          "Fiecare membru al echipei vede exact ce trebuie să facă, cu permisiuni adaptate rolului.",
      },
    ],
  },
  {
    title: "Financiar",
    description: "Ai control complet asupra plăților și veniturilor.",
    items: [
      {
        icon: Wallet,
        title: "Plăți și scadențe",
        description:
          "Urmărești avansuri, tranșe și restanțe automat, cu alerte pentru plățile care întârzie.",
      },
      {
        icon: BarChart3,
        title: "Analytics",
        description:
          "Vezi venitul lunar, rata de conversie și sursele de leaduri care performează cel mai bine.",
      },
    ],
  },
  {
    title: "Experiența clientului",
    description: "Impresionează clienții fără efort suplimentar.",
    items: [
      {
        icon: Zap,
        title: "Automatizări",
        description:
          "Remindere pentru oferte netratate, mesaje pre-eveniment și solicitări de recenzie trimise automat.",
      },
      {
        icon: LayoutTemplate,
        title: "Portal de client",
        description:
          "Fiecare client accesează un portal dedicat — ofertă, contract, plăți, calendar și livrare finală, fără cont sau parolă.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
          Funcționalități
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          Tot fluxul de business, într-un singur produs
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          De la primul mesaj al unui potențial client până la recenzia finală
          — fiecare etapă are un modul dedicat, conectat cu restul.
        </p>
      </section>

      {FEATURE_GROUPS.map((group, index) => (
        <section
          key={group.title}
          className={
            index % 2 === 1
              ? "border-t border-border bg-background-secondary/40 px-6 py-16"
              : "border-t border-border px-6 py-16"
          }
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-medium text-foreground sm:text-3xl">
                {group.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {group.items.map((item) => (
                <div key={item.title} className="surface-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="mt-4 font-heading text-lg font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-border px-6 py-20">
        <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
          <h2 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
            Vezi toate modulele în acțiune
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Creează un cont gratuit — nu ai nevoie de card bancar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              Începe gratuit
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/pricing" />} nativeButton={false}>
              Vezi prețurile
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
