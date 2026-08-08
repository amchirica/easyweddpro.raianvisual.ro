/**
 * Wire tasks, calendar, onboarding, billing, portal.
 */
import fs from "node:fs";

function mergeKeys(loc, ns, keys) {
  const p = `messages/${loc}/${ns}.json`;
  const m = JSON.parse(fs.readFileSync(p, "utf8"));
  function deepAssign(target, source) {
    for (const [k, v] of Object.entries(source)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        if (!target[k] || typeof target[k] !== "object") target[k] = {};
        deepAssign(target[k], v);
      } else target[k] = v;
    }
  }
  deepAssign(m, keys);
  fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
}

function patch(file, reps) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) {
      console.warn("MISS", file, JSON.stringify(from).slice(0, 90));
      continue;
    }
    text = text.split(from).join(to);
    n += 1;
  }
  if ((text.includes('t("') || text.includes("t(`")) && !text.includes("useI18n") && !text.includes("getTranslator")) {
    if (text.includes('"use client"')) {
      text = text.replace(
        '"use client";\n',
        '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
      );
    }
  }
  fs.writeFileSync(file, text);
  console.log("patched", file, n);
}

function ensureHook(file, marker) {
  let text = fs.readFileSync(file, "utf8");
  if (/\bconst \{ t \} = useI18n\(\)/.test(text)) return;
  if (!text.includes(marker)) {
    console.warn("NO HOOK", file);
    return;
  }
  text = text.replace(marker, marker + "\n  const { t } = useI18n();");
  fs.writeFileSync(file, text);
  console.log("hook", file);
}

mergeKeys("ro", "modules", {
  tasks: {
    edit: "Editează task",
    createHint: "Adaugă un task nou pentru echipa ta.",
    editHint: "Actualizează detaliile acestui task.",
    dueDate: "Data limită",
    onlySelf: "Poți crea task-uri doar pentru tine.",
    createTask: "Creează task",
    reactivate: "Reactivează",
    complete: "Finalizează",
    noDeadline: "Fără termen",
  },
  calendar: {
    edit: "Editează eveniment",
    createHint: "Adaugă un eveniment, o întâlnire sau un termen limită în calendar.",
    editHint: "Actualizează detaliile acestui eveniment.",
    titlePh: "Ex: Ședință foto cuplu",
    starts: "Începe",
    ends: "Se termină",
    location: "Locație",
    locationPh: "Ex: Sala de evenimente, adresă…",
    reminder: "Memento (opțional)",
    internalNotes: "Notițe interne",
    createEvent: "Creează eveniment",
    noColor: "Fără culoare",
    colorGold: "Auriu",
    colorGreen: "Verde",
    colorYellow: "Galben",
    colorRed: "Roșu",
    colorGray: "Gri",
    typeEvent: "eveniment",
    typeMeeting: "întâlnire",
    typeCall: "apel",
    typeVenue: "vizionare locație",
    typeDeadline: "termen limită",
    typeReminder: "memento",
  },
  onboarding: {
    stepBusiness: "Business",
    stepBusinessDesc: "Ce tip de business administrezi.",
    stepServices: "Servicii",
    stepServicesDesc: "Detalii adaptate tipului tău de activitate.",
    stepBranding: "Branding & fiscal",
    stepBrandingDesc: "Identitate vizuală și date fiscale.",
    stepImport: "Import date",
    stepImportDesc: "Importă leaduri și clienți existenți.",
    stepFirst: "Primul pas",
    stepFirstDesc: "Creează primul pachet sau serviciu.",
    selectBusiness: "Selectează cel puțin un tip de business.",
    fillAll: "Completează toate câmpurile.",
    finishFailed: "Nu am putut finaliza onboarding-ul. Încearcă din nou.",
    multiCategory: "Poți selecta mai multe categorii.",
    vendorCategories: "Categorii de furnizor (opțional)",
    cityPh: "București",
    country: "Țară",
    countryPh: "România",
    servicesIntro: "Alege serviciile pe care le oferi — le poți edita oricând din setări.",
    teamSize: "Mărimea echipei",
    select: "Selectează",
    team2_5: "2-5 persoane",
    team6_15: "6-15 persoane",
    team15: "15+ persoane",
    lineup: "Componență / formație",
    performanceDuration: "Durată prestație",
    halls: "Săli",
    hallsPh: "2 săli + terasă",
    setupPh: "Montaj cu o zi înainte",
    decorPh: "Stâlpi, textile, flori…",
    hqAddress: "Adresă sediu",
    addressPh: "Str. Exemplu nr. 1, București",
    importTitle: "Importă leaduri și clienți din CSV",
    importHint: "Poți importa oricând mai târziu din Setări → Import date.",
    chooseCsv: "Alege fișier CSV",
    skipImport: "Sar peste acest pas — voi importa datele mai târziu",
    firstPackageIntro: "Creează primul pachet sau serviciu — îl poți folosi imediat într-o ofertă.",
    packagePrice: "Preț (RON)",
    skipPackage: "Poți sări și acest pas — pachetul se poate crea oricând din Dashboard → Template-uri.",
    continue: "Continuă",
    finishing: "Se finalizează…",
    finish: "Finalizează",
  },
});

mergeKeys("en", "modules", {
  tasks: {
    edit: "Edit task",
    createHint: "Add a new task for your team.",
    editHint: "Update this task's details.",
    dueDate: "Due date",
    onlySelf: "You can only create tasks for yourself.",
    createTask: "Create task",
    reactivate: "Reactivate",
    complete: "Complete",
    noDeadline: "No deadline",
  },
  calendar: {
    edit: "Edit event",
    createHint: "Add an event, meeting, or deadline to the calendar.",
    editHint: "Update this event's details.",
    titlePh: "E.g. Couple photo session",
    starts: "Starts",
    ends: "Ends",
    location: "Location",
    locationPh: "E.g. Event hall, address…",
    reminder: "Reminder (optional)",
    internalNotes: "Internal notes",
    createEvent: "Create event",
    noColor: "No color",
    colorGold: "Gold",
    colorGreen: "Green",
    colorYellow: "Yellow",
    colorRed: "Red",
    colorGray: "Gray",
    typeEvent: "event",
    typeMeeting: "meeting",
    typeCall: "call",
    typeVenue: "venue visit",
    typeDeadline: "deadline",
    typeReminder: "reminder",
  },
  onboarding: {
    stepBusiness: "Business",
    stepBusinessDesc: "What type of business you run.",
    stepServices: "Services",
    stepServicesDesc: "Details tailored to your activity type.",
    stepBranding: "Branding & fiscal",
    stepBrandingDesc: "Visual identity and fiscal details.",
    stepImport: "Import data",
    stepImportDesc: "Import existing leads and clients.",
    stepFirst: "First step",
    stepFirstDesc: "Create your first package or service.",
    selectBusiness: "Select at least one business type.",
    fillAll: "Fill in all fields.",
    finishFailed: "Could not finish onboarding. Please try again.",
    multiCategory: "You can select multiple categories.",
    vendorCategories: "Vendor categories (optional)",
    cityPh: "Bucharest",
    country: "Country",
    countryPh: "Romania",
    servicesIntro: "Choose the services you offer — you can edit them anytime in settings.",
    teamSize: "Team size",
    select: "Select",
    team2_5: "2-5 people",
    team6_15: "6-15 people",
    team15: "15+ people",
    lineup: "Lineup / formation",
    performanceDuration: "Performance duration",
    halls: "Halls",
    hallsPh: "2 halls + terrace",
    setupPh: "Setup one day before",
    decorPh: "Poles, textiles, flowers…",
    hqAddress: "Headquarters address",
    addressPh: "Example St. no. 1, Bucharest",
    importTitle: "Import leads and clients from CSV",
    importHint: "You can import anytime later from Settings → Import data.",
    chooseCsv: "Choose CSV file",
    skipImport: "Skip this step — I'll import data later",
    firstPackageIntro: "Create your first package or service — you can use it right away in a proposal.",
    packagePrice: "Price (RON)",
    skipPackage: "You can also skip this — the package can be created anytime from Dashboard → Templates.",
    continue: "Continue",
    finishing: "Finishing…",
    finish: "Finish",
  },
});

mergeKeys("ro", "billing", {
  status: {
    active: "Activ",
    trialing: "Perioadă de probă",
    past_due: "Plată întârziată",
    canceled: "Anulat",
    incomplete: "Incomplet",
    incomplete_expired: "Incomplet expirat",
    unpaid: "Neplătit",
    inactive: "Inactiv",
  },
  unlimited: "nelimitat",
  stripeNotConfigured:
    "Facturarea prin Stripe nu este configurată încă pe acest mediu. Upgrade-urile și portalul de facturare vor fi disponibile după configurare.",
  cancelsOn: "Se anulează pe {date}",
  renewsOn: "Se reînnoiește pe {date}",
  trialEndsOn: "Perioada de probă expiră pe {date}",
  choosePaidPlan: "Alege mai întâi un plan plătit pentru a activa facturarea.",
  opening: "Se deschide…",
  manageBilling: "Gestionează facturarea",
  currentUsage: "Utilizare curentă",
  activeProposals: "Oferte active",
  activeContracts: "Contracte active",
  perMonth: "/lună",
  basePlan: "Plan de bază",
  redirecting: "Se redirecționează…",
});

mergeKeys("en", "billing", {
  status: {
    active: "Active",
    trialing: "Trial period",
    past_due: "Past due",
    canceled: "Cancelled",
    incomplete: "Incomplete",
    incomplete_expired: "Incomplete expired",
    unpaid: "Unpaid",
    inactive: "Inactive",
  },
  unlimited: "unlimited",
  stripeNotConfigured:
    "Stripe billing is not configured on this environment yet. Upgrades and the billing portal will be available after setup.",
  cancelsOn: "Cancels on {date}",
  renewsOn: "Renews on {date}",
  trialEndsOn: "Trial ends on {date}",
  choosePaidPlan: "Choose a paid plan first to enable billing.",
  opening: "Opening…",
  manageBilling: "Manage billing",
  currentUsage: "Current usage",
  activeProposals: "Active proposals",
  activeContracts: "Active contracts",
  perMonth: "/month",
  basePlan: "Base plan",
  redirecting: "Redirecting…",
});

mergeKeys("ro", "portal", {
  payments: "Plăți",
  personalIntro: "Portalul tău personal — oferta, contractul și detaliile evenimentului, într-un singur loc.",
  overview: "Prezentare generală",
  noOffer: "Nu există ofertă asociată momentan.",
  pdfAfterPublish: "PDF-ul contractului va fi disponibil după publicarea linkului de către furnizor.",
  contractAfterAccept: "Contractul va apărea aici imediat după acceptarea ofertei.",
  noPaymentPlan: "Nu există încă un plan de plăți asociat.",
  dueOn: "Scadent la {date}",
  noDue: "Fără scadență",
  contactTeam: "Pentru întrebări despre ofertă, contract sau eveniment, contactează direct echipa {name}.",
  connectionFailed: "Conexiunea cu serverul nu a putut fi realizată. Verifică configurația și încearcă din nou.",
});

mergeKeys("en", "portal", {
  payments: "Payments",
  personalIntro: "Your personal portal — proposal, contract, and event details in one place.",
  overview: "Overview",
  noOffer: "There is no associated proposal at the moment.",
  pdfAfterPublish: "The contract PDF will be available after the provider publishes the link.",
  contractAfterAccept: "The contract will appear here right after the proposal is accepted.",
  noPaymentPlan: "There is no payment plan associated yet.",
  dueOn: "Due {date}",
  noDue: "No due date",
  contactTeam: "For questions about the proposal, contract, or event, contact the {name} team directly.",
  connectionFailed: "Could not connect to the server. Check the configuration and try again.",
});

// ---- tasks ----
patch("components/tasks/task-form-dialog.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    '{mode === "create" ? "Task nou" : "Editează task"}',
    '{mode === "create" ? t("modules.tasks.new") : t("modules.tasks.edit")}',
  ],
  [
    '? "Adaugă un task nou pentru echipa ta."\n              : "Actualizează detaliile acestui task."}',
    '? t("modules.tasks.createHint")\n              : t("modules.tasks.editHint")}',
  ],
  [">Data limită<", '>{t("modules.tasks.dueDate")}<'],
  [
    ">Poți crea task-uri doar pentru tine.<",
    '>{t("modules.tasks.onlySelf")}<',
  ],
  ['placeholder="Fără client"', 'placeholder={t("common.noClient")}'],
  ['placeholder="Fără proiect"', 'placeholder={t("modules.payments.noProject")}'],
  [">Notițe<", '>{t("modules.leads.notesLabel")}<'],
]);
ensureHook("components/tasks/task-form-dialog.tsx", "}: TaskFormDialogProps) {");
{
  let text = fs.readFileSync("components/tasks/task-form-dialog.tsx", "utf8");
  text = text.replace(
    /\{submitting\s*\n\s*\? "Se salvează…"\s*\n\s*: mode === "create"\s*\n\s*\? "Creează task"\s*\n\s*: "Salvează modificările"\}/,
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.tasks.createTask") : t("common.saveChanges")}',
  );
  text = text.replace(/Anulează\n/, '{t("common.cancel")}\n');
  fs.writeFileSync("components/tasks/task-form-dialog.tsx", text);
}

patch("components/tasks/task-detail.tsx", [
  [
    "if (!window.confirm(`Ștergi task-ul „${task.title}”?`)) return;",
    'if (!window.confirm(t("modules.tasks.deleteConfirm", { title: task.title }))) return;',
  ],
  ["Reactivează", '{t("modules.tasks.reactivate")}'],
  ["Finalizează", '{t("modules.tasks.complete")}'],
  ["Editează", '{t("common.edit")}'],
  ["Șterge", '{t("common.delete")}'],
  [
    '{task.dueDate ? formatDate(task.dueDate) : "Fără termen"}',
    '{task.dueDate ? formatDate(task.dueDate) : t("modules.tasks.noDeadline")}',
  ],
  [">Notițe<", '>{t("modules.leads.notesLabel")}<'],
]);
ensureHook("components/tasks/task-detail.tsx", "}: TaskDetailProps) {");

// ---- calendar ----
{
  let text = fs.readFileSync("components/calendar/calendar-event-dialog.tsx", "utf8");
  text = text.replace(
    /const STATUS_LABELS: Record<CalendarEventStatus, string> = \{[\s\S]*?\};/,
    `const STATUS_KEYS: CalendarEventStatus[] = ["confirmed", "tentative", "cancelled"];`,
  );
  text = text.replace(
    /const EVENT_TYPE_SUGGESTIONS = \[[\s\S]*?\];/,
    `const EVENT_TYPE_KEYS = ["typeEvent","typeMeeting","typeCall","typeVenue","typeDeadline","typeReminder"] as const;`,
  );
  text = text.replace(
    /const COLOR_OPTIONS: \{ value: string; label: string; swatch: string \}\[\] = \[[\s\S]*?\];/,
    `const COLOR_OPTION_DEFS: { value: string; labelKey: string; swatch: string }[] = [
  { value: "", labelKey: "noColor", swatch: "transparent" },
  { value: "#c6a76a", labelKey: "colorGold", swatch: "#c6a76a" },
  { value: "#62b58c", labelKey: "colorGreen", swatch: "#62b58c" },
  { value: "#d7a958", labelKey: "colorYellow", swatch: "#d7a958" },
  { value: "#d56f6f", labelKey: "colorRed", swatch: "#d56f6f" },
  { value: "#8a8f98", labelKey: "colorGray", swatch: "#8a8f98" },
];`,
  );
  // Replace usages roughly
  text = text.replaceAll("STATUS_LABELS[", 't(`modules.calendar.status${""}'); // bad - fix below
  fs.writeFileSync("components/calendar/calendar-event-dialog.tsx", text);
}

// Fix calendar more carefully with targeted patches after reading usages
patch("components/calendar/calendar-event-dialog.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    '{mode === "create" ? "Eveniment nou" : "Editează eveniment"}',
    '{mode === "create" ? t("modules.calendar.new") : t("modules.calendar.edit")}',
  ],
  [
    '? "Adaugă un eveniment, o întâlnire sau un termen limită în calendar."\n              : "Actualizează detaliile acestui eveniment."}',
    '? t("modules.calendar.createHint")\n              : t("modules.calendar.editHint")}',
  ],
  [
    'placeholder="Ex: Ședință foto cuplu"',
    'placeholder={t("modules.calendar.titlePh")}',
  ],
  ["Toată ziua", '{t("modules.calendar.allDay")}'],
  [">Începe<", '>{t("modules.calendar.starts")}<'],
  [">Se termină<", '>{t("modules.calendar.ends")}<'],
  [">Locație<", '>{t("modules.calendar.location")}<'],
  [
    'placeholder="Ex: Sala de evenimente, adresă…"',
    'placeholder={t("modules.calendar.locationPh")}',
  ],
  ['placeholder="Fără client"', 'placeholder={t("common.noClient")}'],
  [">Fără client<", '>{t("common.noClient")}<'],
  [">Memento (opțional)<", '>{t("modules.calendar.reminder")}<'],
  [">Notițe interne<", '>{t("modules.calendar.internalNotes")}<'],
]);
ensureHook("components/calendar/calendar-event-dialog.tsx", "}: CalendarEventDialogProps) {");

// Fix broken STATUS_LABELS replacement if any
{
  let text = fs.readFileSync("components/calendar/calendar-event-dialog.tsx", "utf8");
  // undo bad replace if present
  text = text.replaceAll('t(`modules.calendar.status${""}', "STATUS_LABELS_BROKEN[");
  if (text.includes("STATUS_LABELS_BROKEN") || text.includes("STATUS_LABELS[")) {
    text = text.replace(/STATUS_LABELS_BROKEN\[(\w+)\]/g, 't(`modules.calendar.status${$1 === $1 ? "" : ""}`)');
    // simpler: replace STATUS_LABELS[x] with t(`status...`) - calendar already has modules.calendar.statusConfirmed etc
    text = text.replace(/STATUS_LABELS\[([^\]]+)\]/g, 't(`modules.calendar.status${$1[0].toUpperCase()}${$1.slice(1)}`)');
    // That won't work as template in replace. Do explicit:
    text = text.replace(/STATUS_LABELS\[(\w+)\]/g, (_, k) => {
      const map = { confirmed: "statusConfirmed", tentative: "statusTentative", cancelled: "statusCancelled" };
      return `t("modules.calendar.${map[k] || k}")`;
    });
    text = text.replace(/STATUS_LABELS_BROKEN\[([^\]]+)\]/g, 't(`status.calendar.${$1}`)');
  }
  // COLOR_OPTIONS -> COLOR_OPTION_DEFS
  text = text.replaceAll("COLOR_OPTIONS", "COLOR_OPTION_DEFS");
  text = text.replace(/option\.label/g, 't(`modules.calendar.${option.labelKey}`)');
  // EVENT_TYPE_SUGGESTIONS
  text = text.replaceAll("EVENT_TYPE_SUGGESTIONS", "EVENT_TYPE_KEYS");
  // When rendering suggestion chips, values should be translated
  text = text.replace(
    /\{EVENT_TYPE_KEYS\.map\(([^)]+)\)/g,
    "{EVENT_TYPE_KEYS.map((typeKey) =>",
  );
  fs.writeFileSync("components/calendar/calendar-event-dialog.tsx", text);
}

// Submit button calendar
{
  let text = fs.readFileSync("components/calendar/calendar-event-dialog.tsx", "utf8");
  text = text.replace(
    /\{submitting\s*\n\s*\? "Se salvează…"\s*\n\s*: mode === "create"\s*\n\s*\? "Creează eveniment"\s*\n\s*: "Salvează modificările"\}/,
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.calendar.createEvent") : t("common.saveChanges")}',
  );
  text = text.replace(/(>\s*)Anulează(\s*<)/, '$1{t("common.cancel")}$2');
  // Fix event type chip: if it was `{type}` now keys
  if (text.includes("EVENT_TYPE_KEYS.map((typeKey)")) {
    // look for onClick setEventType(type) patterns
    text = text.replace(/setEventType\(type\)/g, 'setEventType(t(`modules.calendar.${typeKey}`))');
    text = text.replace(/\{type\}/g, '{t(`modules.calendar.${typeKey}`)}');
  }
  fs.writeFileSync("components/calendar/calendar-event-dialog.tsx", text);
}

// ---- billing ----
{
  let text = fs.readFileSync("components/billing/billing-page-client.tsx", "utf8");
  text = text.replace(
    /const STATUS_LABELS: Record<string, \{ label: string; tone:[\s\S]*?\};/,
    `const STATUS_TONES: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  active: "success",
  trialing: "accent",
  past_due: "warning",
  canceled: "danger",
  incomplete: "danger",
  incomplete_expired: "danger",
  unpaid: "danger",
  inactive: "neutral",
};`,
  );
  text = text.replace(
    /function statusMeta\(status: string\) \{\s*return STATUS_LABELS\[status\] \?\? \{ label: status, tone: "neutral" as const \};\s*\}/,
    `function statusMeta(status: string, t: (k: string) => string) {
  return {
    label: t(\`billing.status.\${status}\`) === \`billing.status.\${status}\` ? status : t(\`billing.status.\${status}\`),
    tone: STATUS_TONES[status] ?? ("neutral" as const),
  };
}`,
  );
  text = text.replace(
    /function limitLabel\(current: number, limit: number \| null\): string \{\s*return limit == null \? `\$\{current\} · nelimitat` : `\$\{current\} \/ \$\{limit\}`;\s*\}/,
    `function limitLabel(current: number, limit: number | null, unlimited: string): string {
  return limit == null ? \`\${current} · \${unlimited}\` : \`\${current} / \${limit}\`;
}`,
  );
  fs.writeFileSync("components/billing/billing-page-client.tsx", text);
}

patch("components/billing/billing-page-client.tsx", [
  [
    `Facturarea prin Stripe nu este configurată încă pe acest mediu. Upgrade-urile și portalul de
        facturare vor fi disponibile după configurare.`,
    `{t("billing.stripeNotConfigured")}`,
  ],
  [
    "Se anulează pe {formatDate(subscription.currentPeriodEnd)}",
    '{t("billing.cancelsOn", { date: formatDate(subscription.currentPeriodEnd) })}',
  ],
  [
    "Se reînnoiește pe {formatDate(subscription.currentPeriodEnd)}",
    '{t("billing.renewsOn", { date: formatDate(subscription.currentPeriodEnd) })}',
  ],
  [
    "<span>Perioada de probă expiră pe {formatDate(subscription.trialEnd)}</span>",
    '<span>{t("billing.trialEndsOn", { date: formatDate(subscription.trialEnd) })}</span>',
  ],
  [
    '? "Alege mai întâi un plan plătit pentru a activa facturarea."',
    '? t("billing.choosePaidPlan")',
  ],
  [
    '{portalBusy ? "Se deschide…" : "Gestionează facturarea"}',
    '{portalBusy ? t("billing.opening") : t("billing.manageBilling")}',
  ],
  [">Utilizare curentă<", '>{t("billing.currentUsage")}<'],
  [
    'label="Clienți" value={limitLabel(usage.clients, limits.clients)}',
    'label={t("common.clients")} value={limitLabel(usage.clients, limits.clients, t("billing.unlimited"))}',
  ],
  [
    'label="Oferte active"',
    'label={t("billing.activeProposals")}',
  ],
  [
    'label="Contracte active"',
    'label={t("billing.activeContracts")}',
  ],
  ["> /lună<", '>{t("billing.perMonth")}<'],
  [
    '{isCurrent ? "Plan curent" : "Plan de bază"}',
    '{isCurrent ? t("billing.currentPlan") : t("billing.basePlan")}',
  ],
  [
    '? "Se redirecționează…"',
    '? t("billing.redirecting")',
  ],
]);

// Fix statusMeta calls and remaining limitLabel
{
  let text = fs.readFileSync("components/billing/billing-page-client.tsx", "utf8");
  text = text.replace(/statusMeta\(([^)]+)\)/g, "statusMeta($1, t)");
  text = text.replace(/limitLabel\(([^,]+), ([^,)]+)\)/g, 'limitLabel($1, $2, t("billing.unlimited"))');
  // may double-replace already fixed ones - clean duplicates
  text = text.replace(
    /limitLabel\(([^,]+), ([^,]+), t\("billing\.unlimited"\), t\("billing\.unlimited"\)\)/g,
    'limitLabel($1, $2, t("billing.unlimited"))',
  );
  text = text.replace(/statusMeta\(([^,]+), t, t\)/g, "statusMeta($1, t)");
  fs.writeFileSync("components/billing/billing-page-client.tsx", text);
}

// ---- onboarding: replace STEPS and TEAM options ----
{
  let text = fs.readFileSync("components/onboarding/onboarding-wizard.tsx", "utf8");
  text = text.replace(
    /const TEAM_SIZE_OPTIONS = \[[\s\S]*?\];/,
    `const TEAM_SIZE_VALUES = ["Solo", "2-5", "6-15", "15+"] as const;`,
  );
  text = text.replace(
    /const STEPS = \[[\s\S]*?\];/,
    `const STEP_IDS = [1, 2, 3, 4, 5] as const;`,
  );
  if (!text.includes("useI18n")) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  fs.writeFileSync("components/onboarding/onboarding-wizard.tsx", text);
}

patch("components/onboarding/onboarding-wizard.tsx", [
  [
    '? "Selectează cel puțin un tip de business."\n            : (result.error?.issues[0]?.message ?? "Completează toate câmpurile."),',
    '? t("modules.onboarding.selectBusiness")\n            : (result.error?.issues[0]?.message ?? t("modules.onboarding.fillAll")),',
  ],
  [
    'setFinishError("Nu am putut finaliza onboarding-ul. Încearcă din nou.");',
    'setFinishError(t("modules.onboarding.finishFailed"));',
  ],
  [
    ">Poți selecta mai multe categorii.<",
    '>{t("modules.onboarding.multiCategory")}<',
  ],
  [">Categorii de furnizor (opțional)<", '>{t("modules.onboarding.vendorCategories")}<'],
  [">Oraș<", '>{t("common.city")}<'],
  ['placeholder="București"', 'placeholder={t("modules.onboarding.cityPh")}'],
  [">Țară<", '>{t("modules.onboarding.country")}<'],
  ['placeholder="România"', 'placeholder={t("modules.onboarding.countryPh")}'],
  [
    "Alege serviciile pe care le oferi — le poți edita oricând din setări.",
    '{t("modules.onboarding.servicesIntro")}',
  ],
  [">Mărimea echipei<", '>{t("modules.onboarding.teamSize")}<'],
  ['placeholder="Selectează"', 'placeholder={t("modules.onboarding.select")}'],
  [">Componență / formație<", '>{t("modules.onboarding.lineup")}<'],
  [">Durată prestație<", '>{t("modules.onboarding.performanceDuration")}<'],
  [">Săli<", '>{t("modules.onboarding.halls")}<'],
  ['placeholder="2 săli + terasă"', 'placeholder={t("modules.onboarding.hallsPh")}'],
  ['placeholder="Montaj cu o zi înainte"', 'placeholder={t("modules.onboarding.setupPh")}'],
  ['placeholder="Stâlpi, textile, flori…"', 'placeholder={t("modules.onboarding.decorPh")}'],
  [">Monedă<", '>{t("common.currency")}<'],
  [">Adresă sediu<", '>{t("modules.onboarding.hqAddress")}<'],
  [
    'placeholder="Str. Exemplu nr. 1, București"',
    'placeholder={t("modules.onboarding.addressPh")}',
  ],
  [
    ">Importă leaduri și clienți din CSV<",
    '>{t("modules.onboarding.importTitle")}<',
  ],
  [
    "Poți importa oricând mai târziu din Setări → Import date.",
    '{t("modules.onboarding.importHint")}',
  ],
  ["Alege fișier CSV", '{t("modules.onboarding.chooseCsv")}'],
  [
    "Sar peste acest pas — voi importa datele mai târziu",
    '{t("modules.onboarding.skipImport")}',
  ],
  [
    "Creează primul pachet sau serviciu — îl poți folosi imediat într-o ofertă.",
    '{t("modules.onboarding.firstPackageIntro")}',
  ],
  [">Preț (RON)<", '>{t("modules.onboarding.packagePrice")}<'],
  [
    "Poți sări și acest pas — pachetul se poate crea oricând din Dashboard → Template-uri.",
    '{t("modules.onboarding.skipPackage")}',
  ],
  ["Înapoi", '{t("common.back")}'],
  [">Continuă<", '>{t("modules.onboarding.continue")}<'],
  [
    '{finishing ? "Se finalizează…" : "Finalizează"}',
    '{finishing ? t("modules.onboarding.finishing") : t("modules.onboarding.finish")}',
  ],
]);
ensureHook("components/onboarding/onboarding-wizard.tsx", "export function OnboardingWizard(");

console.log("batch2 keys+patches done — portal/onboarding STEPS need manual fix pass");
