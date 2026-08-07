import { SectionHeader, SectionShell } from "@/components/marketing/sections/section-shell";
import { APP_NAME } from "@/lib/constants";

const FAQ = [
  {
    question: "EasyWedd Pro este doar un CRM?",
    answer:
      "Nu. Este un Business OS pentru Weddings & Events: leaduri, oferte, contracte, plăți, calendar, proiecte, automatizări și portal client — pe verticala evenimentelor.",
  },
  {
    question: "Este doar pentru fotografi?",
    answer:
      "Nu. Platforma acoperă foto-video, DJ, formații, locații, planners, decor, beauty, catering, entertainment, transport, papetărie și agenții de evenimente.",
  },
  {
    question: "Pot configura platforma pentru tipul meu de business?",
    answer:
      "Da. La onboarding alegi categoria, iar workspace-ul poate primi pipeline, oferte, contracte, task-uri și automatizări recomandate.",
  },
  {
    question: "Clienții mei trebuie să își creeze cont?",
    answer:
      "Nu. Oferta, contractul și proiectul pot fi accesate prin portal pe link unic, fără parolă.",
  },
  {
    question: "Ce legătură are cu EasyWedd?",
    answer:
      `${APP_NAME} este pentru furnizori; EasyWedd este pentru cupluri. Formează un ecosistem — sincronizările avansate sunt marcate separat ca „în dezvoltare” unde e cazul.`,
  },
  {
    question: "Pot anula abonamentul oricând?",
    answer:
      "Da. Poți retrograda la planul Free din setări, fără contract pe termen lung.",
  },
];

export function FaqSection() {
  return (
    <SectionShell muted>
      <SectionHeader title="Întrebări frecvente" />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {FAQ.map((item) => (
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
