import type { KnowledgeModule } from "@/lib/assistant/knowledge/types";

const GENERIC_RO = [
  "Ce pot face aici?",
  "Ce drepturi am pe acest modul?",
  "Unde găsesc ajutor?",
  "Cum încep?",
  "Ce înseamnă statusurile?",
  "Cum filtrez lista?",
  "Cum editez o înregistrare?",
  "Ce se întâmplă dacă greșesc?",
  "Există limitări pe plan?",
  "Cum leg asta de alte module?",
];

const GENERIC_EN = [
  "What can I do here?",
  "What permissions do I have on this module?",
  "Where do I find help?",
  "How do I get started?",
  "What do the statuses mean?",
  "How do I filter the list?",
  "How do I edit a record?",
  "What if I make a mistake?",
  "Are there plan limits?",
  "How does this connect to other modules?",
];

const EXTRA_BY_KEY: Record<string, { ro: string[]; en: string[] }> = {
  dashboard: {
    ro: [
      "Cum citesc KPI-urile?",
      "Unde văd evenimentele de azi?",
      "Cum deschid un lead din dashboard?",
      "De ce unele carduri sunt goale?",
      "Unde văd plățile restante?",
    ],
    en: [
      "How do I read the KPIs?",
      "Where are today's events?",
      "How do I open a lead from the dashboard?",
      "Why are some cards empty?",
      "Where are overdue payments?",
    ],
  },
  leads: {
    ro: [
      "Cum adaug o notă pe lead?",
      "Cum schimb sursa leadului?",
      "Ce se întâmplă la conversie?",
      "Cum șterg un lead?",
      "Cum caut un lead după telefon?",
      "Care e diferența dintre new și contacted?",
    ],
    en: [
      "How do I add a note on a lead?",
      "How do I change the lead source?",
      "What happens on conversion?",
      "How do I delete a lead?",
      "How do I search a lead by phone?",
      "What is the difference between new and contacted?",
    ],
  },
  clients: {
    ro: [
      "Cum leg un client de un proiect?",
      "Unde văd plățile clientului?",
      "Cum actualizez emailul?",
      "Ce statusuri are un client?",
      "Cum deschid istoricul?",
    ],
    en: [
      "How do I link a client to a project?",
      "Where are the client's payments?",
      "How do I update the email?",
      "What statuses does a client have?",
      "How do I open the history?",
    ],
  },
  proposals: {
    ro: [
      "Cum trimit oferta clientului?",
      "Ce înseamnă draft vs sent?",
      "Cum adaug linii de preț?",
      "Cum expiră o ofertă?",
      "Pot folosi un template?",
      "Unde văd linkul public?",
    ],
    en: [
      "How do I send the proposal to the client?",
      "What does draft vs sent mean?",
      "How do I add line items?",
      "How does a proposal expire?",
      "Can I use a template?",
      "Where is the public link?",
    ],
  },
  contracts: {
    ro: [
      "Cum trimit contractul la semnare?",
      "Ce secțiuni are un contract?",
      "Cum văd dacă a fost acceptat?",
      "Pot edita după trimitere?",
      "Cum leg contractul de plăți?",
      "Unde e portalul client?",
    ],
    en: [
      "How do I send the contract for signing?",
      "What sections does a contract have?",
      "How do I see if it was accepted?",
      "Can I edit after sending?",
      "How do I link the contract to payments?",
      "Where is the client portal?",
    ],
  },
  calendar: {
    ro: [
      "Cum creez un eveniment?",
      "Cum leg evenimentul de un proiect?",
      "Ce tipuri de evenimente există?",
      "Cum mut un eveniment?",
      "Cum văd evenimentele pe săptămână?",
    ],
    en: [
      "How do I create an event?",
      "How do I link an event to a project?",
      "What event types exist?",
      "How do I move an event?",
      "How do I view events by week?",
    ],
  },
  projects: {
    ro: [
      "Cum arhivez un proiect?",
      "Cum adaug task-uri pe proiect?",
      "Ce statusuri are proiectul?",
      "Cum leg clientul?",
      "Unde văd locația evenimentului?",
    ],
    en: [
      "How do I archive a project?",
      "How do I add tasks to a project?",
      "What statuses does a project have?",
      "How do I link the client?",
      "Where is the event location?",
    ],
  },
  tasks: {
    ro: [
      "Cum marchează un task ca done?",
      "Cum filtrez task-urile mele?",
      "Ce înseamnă overdue?",
      "Cum asign un coleg?",
      "Cum setez termenul?",
    ],
    en: [
      "How do I mark a task as done?",
      "How do I filter my tasks?",
      "What does overdue mean?",
      "How do I assign a teammate?",
      "How do I set the due date?",
    ],
  },
  payments: {
    ro: [
      "Cum înregistrez o plată parțială?",
      "Cum marchez ca paid?",
      "Ce monede sunt suportate?",
      "Cum leg plata de contract?",
      "Unde văd restantele?",
    ],
    en: [
      "How do I record a partial payment?",
      "How do I mark as paid?",
      "What currencies are supported?",
      "How do I link a payment to a contract?",
      "Where are overdue amounts?",
    ],
  },
  automations: {
    ro: [
      "Ce planuri includ automatizări?",
      "Cum dezactivez o regulă?",
      "Pot trimite email automat?",
      "Ce condiții pot seta?",
      "Cum testez o automatizare?",
    ],
    en: [
      "Which plans include automations?",
      "How do I disable a rule?",
      "Can I send email automatically?",
      "What conditions can I set?",
      "How do I test an automation?",
    ],
  },
  templates: {
    ro: [
      "Ce tipuri de template există?",
      "Cum setez un default?",
      "Cum arhivez un template?",
      "Pot folosi variabile?",
      "Cum editez un template de email?",
    ],
    en: [
      "What template types exist?",
      "How do I set a default?",
      "How do I archive a template?",
      "Can I use variables?",
      "How do I edit an email template?",
    ],
  },
  team: {
    ro: [
      "Ce roluri există?",
      "Cum revoc o invitație?",
      "Ce poate face un viewer?",
      "Cum schimb rolul unui membru?",
      "Cine poate invita?",
    ],
    en: [
      "What roles exist?",
      "How do I revoke an invite?",
      "What can a viewer do?",
      "How do I change a member's role?",
      "Who can invite?",
    ],
  },
  analytics: {
    ro: [
      "Ce planuri includ analytics?",
      "Cum citesc conversia?",
      "Unde văd sursele de leaduri?",
      "Cum văd venitul pe perioadă?",
      "De ce nu am date?",
    ],
    en: [
      "Which plans include analytics?",
      "How do I read conversion?",
      "Where are lead sources?",
      "How do I see revenue by period?",
      "Why is there no data?",
    ],
  },
  settings: {
    ro: [
      "Cum schimb numele workspace-ului?",
      "Unde e moneda?",
      "Cum deschid billing?",
      "Ce preferințe pot seta?",
      "Cum actualizez profilul business?",
    ],
    en: [
      "How do I change the workspace name?",
      "Where is the currency?",
      "How do I open billing?",
      "What preferences can I set?",
      "How do I update the business profile?",
    ],
  },
  billing: {
    ro: [
      "Ce include Free?",
      "Cum fac upgrade la Agency?",
      "Unde văd limitele?",
      "Ce se întâmplă la downgrade?",
      "Cum gestionez Stripe?",
    ],
    en: [
      "What does Free include?",
      "How do I upgrade to Agency?",
      "Where are usage limits?",
      "What happens on downgrade?",
      "How do I manage Stripe?",
    ],
  },
  "admin-dashboard": {
    ro: [
      "Cum citesc semnalele?",
      "Unde văd health-ul?",
      "Cum deschid un workspace?",
      "Ce rol am pe platformă?",
      "Unde e feedback-ul?",
      "Cum ajung la audit?",
    ],
    en: [
      "How do I read signals?",
      "Where is health?",
      "How do I open a workspace?",
      "What is my platform role?",
      "Where is feedback?",
      "How do I reach audit?",
    ],
  },
  "admin-users": {
    ro: [
      "Cum filtrez după status?",
      "Ce înseamnă platform admin?",
      "Unde văd membership-urile?",
      "Pot edita un user?",
      "Cum deschid detalii?",
    ],
    en: [
      "How do I filter by status?",
      "What does platform admin mean?",
      "Where are memberships?",
      "Can I edit a user?",
      "How do I open details?",
    ],
  },
  "admin-workspaces": {
    ro: [
      "Ce face inspect?",
      "Cine poate suspenda?",
      "Unde văd planul workspace-ului?",
      "Cum ies din inspect?",
      "Ce date sunt read-only?",
    ],
    en: [
      "What does inspect do?",
      "Who can suspend?",
      "Where is the workspace plan?",
      "How do I exit inspect?",
      "What data is read-only?",
    ],
  },
  "admin-subscriptions": {
    ro: [
      "Cum leg abonamentul de Stripe?",
      "Ce înseamnă past_due?",
      "Unde văd perioada curentă?",
      "Cum filtrez după plan?",
      "Ce workspace e asociat?",
    ],
    en: [
      "How is a subscription linked to Stripe?",
      "What does past_due mean?",
      "Where is the current period?",
      "How do I filter by plan?",
      "Which workspace is linked?",
    ],
  },
  "admin-plans": {
    ro: [
      "Ce include Agency?",
      "Cum se calculează limitele?",
      "Unde editez prețurile?",
      "Ce e Solo vs Studio?",
      "Cum afectează upgrade-ul modulele?",
    ],
    en: [
      "What does Agency include?",
      "How are limits calculated?",
      "Where do I edit prices?",
      "What is Solo vs Studio?",
      "How does upgrade affect modules?",
    ],
  },
  "admin-emails": {
    ro: [
      "Ce template-uri de email există?",
      "Cum văd istoricul?",
      "Unde configurez senderul?",
      "Ce se întâmplă la eșec?",
      "Cum testez un email?",
    ],
    en: [
      "What email templates exist?",
      "How do I see history?",
      "Where do I configure the sender?",
      "What happens on failure?",
      "How do I test an email?",
    ],
  },
  "admin-email-deliveries": {
    ro: [
      "Cum filtrez după status?",
      "Ce înseamnă bounced?",
      "Cum investighez un eșec?",
      "Unde văd destinatarul?",
      "Cum leg livrarea de workspace?",
    ],
    en: [
      "How do I filter by status?",
      "What does bounced mean?",
      "How do I investigate a failure?",
      "Where is the recipient?",
      "How do I link a delivery to a workspace?",
    ],
  },
  "admin-cron": {
    ro: [
      "Ce joburi rulează?",
      "Cum văd ultima rulare?",
      "Ce fac dacă un cron eșuează?",
      "Unde e programul?",
      "Cine poate declanșa manual?",
    ],
    en: [
      "What jobs run?",
      "How do I see the last run?",
      "What if a cron fails?",
      "Where is the schedule?",
      "Who can trigger manually?",
    ],
  },
  "admin-jobs": {
    ro: [
      "Cum văd joburile eșuate?",
      "Ce statusuri există?",
      "Cum reîncerci un job?",
      "Unde e payload-ul?",
      "Cum filtrez după tip?",
    ],
    en: [
      "How do I see failed jobs?",
      "What statuses exist?",
      "How do I retry a job?",
      "Where is the payload?",
      "How do I filter by type?",
    ],
  },
  "admin-webhooks": {
    ro: [
      "Ce evenimente Stripe primesc?",
      "Cum văd eșecurile?",
      "Unde e logul?",
      "Cum reîncerci un webhook?",
      "Ce payload se salvează?",
    ],
    en: [
      "What Stripe events do we receive?",
      "How do I see failures?",
      "Where is the log?",
      "How do I retry a webhook?",
      "What payload is stored?",
    ],
  },
  "admin-feedback": {
    ro: [
      "Unde văd feedback-ul asistentului?",
      "Cum filtrez thumbs down?",
      "Ce metadata se salvează?",
      "Cum leg feedback-ul de un user?",
      "Ce fac cu semnalele negative?",
    ],
    en: [
      "Where is assistant feedback?",
      "How do I filter thumbs down?",
      "What metadata is stored?",
      "How do I link feedback to a user?",
      "What do I do with negative signals?",
    ],
  },
  "admin-audit": {
    ro: [
      "Ce evenimente apar în audit?",
      "Cum filtrez după actor?",
      "Unde văd acțiunile admin?",
      "Ce retenție are logul?",
      "Cum investighez un acces interzis?",
    ],
    en: [
      "What events appear in audit?",
      "How do I filter by actor?",
      "Where are admin actions?",
      "What retention does the log have?",
      "How do I investigate a forbidden access?",
    ],
  },
  "admin-health": {
    ro: [
      "Ce verifică health-ul?",
      "Cum citesc un semnal roșu?",
      "Unde văd erorile recente?",
      "Ce fac dacă DB e down?",
      "Cum verific cron-ul?",
    ],
    en: [
      "What does health check?",
      "How do I read a red signal?",
      "Where are recent errors?",
      "What if DB is down?",
      "How do I verify cron?",
    ],
  },
  "admin-errors": {
    ro: [
      "Cum grupez erorile?",
      "Ce stack se salvează?",
      "Cum marchează ca rezolvat?",
      "Unde e frecvența?",
      "Cum leg de un workspace?",
    ],
    en: [
      "How do I group errors?",
      "What stack is stored?",
      "How do I mark as resolved?",
      "Where is frequency?",
      "How do I link to a workspace?",
    ],
  },
  "admin-system": {
    ro: [
      "Ce setări pot schimba?",
      "Cine are drept de write?",
      "Cum afectează feature flags?",
      "Unde e mediul (prod/preview)?",
      "Ce e read-only?",
    ],
    en: [
      "What settings can I change?",
      "Who has write access?",
      "How do feature flags apply?",
      "Where is the environment (prod/preview)?",
      "What is read-only?",
    ],
  },
  "admin-admins": {
    ro: [
      "Cum adaug un admin?",
      "Ce roluri de platformă există?",
      "Cum dezactivez un admin?",
      "Cine e super admin?",
      "Ce poate face support?",
    ],
    en: [
      "How do I add an admin?",
      "What platform roles exist?",
      "How do I disable an admin?",
      "Who is super admin?",
      "What can support do?",
    ],
  },
};

function uniqueMerge(base: string[], extras: string[], min = 8, max = 15): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of [...base, ...extras]) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
    if (out.length >= max) break;
  }
  while (out.length < min) {
    const filler = extras[out.length % Math.max(extras.length, 1)] ?? `Q${out.length + 1}`;
    const key = `${filler}-${out.length}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(filler);
    } else break;
  }
  return out.slice(0, max);
}

export function enrichKnowledgeModules(modules: KnowledgeModule[]): KnowledgeModule[] {
  return modules.map((mod) => {
    const extra = EXTRA_BY_KEY[mod.key] ?? { ro: [], en: [] };
    return {
      ...mod,
      suggestedQuestions: uniqueMerge(mod.suggestedQuestions, [...extra.ro, ...GENERIC_RO]),
      suggestedQuestionsEn: uniqueMerge(mod.suggestedQuestionsEn, [...extra.en, ...GENERIC_EN]),
      actions: uniqueMerge(mod.actions, [], 3, 12),
      actionsEn: uniqueMerge(mod.actionsEn, [], 3, 12),
    };
  });
}
