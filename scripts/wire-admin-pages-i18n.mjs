/**
 * Fix admin hooks and continue wiring admin pages.
 */
import fs from "node:fs";

function ensureClientHook(file) {
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes('"use client"')) return;
  if (!text.includes('t("') && !text.includes("t(`")) return;
  if (!text.includes("useI18n")) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  // Fix broken insertions like useI18n();{
  text = text.replace(/const \{ t \} = useI18n\(\);\{/g, "const { t } = useI18n();\n  {");
  text = text.replace(
    /export function (\w+)\(\s*const \{ t \} = useI18n\(\);/g,
    "export function $1({\n  // HOOK_MOVED",
  );

  if (!/\bconst \{ t \} = useI18n\(\)/.test(text)) {
    // Find first `{` after export function ... props
    const re = /export function \w+\([\s\S]*?\) \{/;
    const m = text.match(re);
    if (m) {
      text = text.replace(m[0], m[0] + "\n  const { t } = useI18n();");
      console.log("hook", file);
    } else {
      console.warn("NO INSERT", file);
    }
  }
  fs.writeFileSync(file, text);
}

const files = [
  "components/admin/workspace-admin-actions.tsx",
  "components/admin/settings-form.tsx",
  "components/admin/user-actions.tsx",
  "components/admin/feedback-actions.tsx",
  "components/admin/plan-edit-form.tsx",
  "components/admin/inspect-session-form.tsx",
  "components/admin/admin-role-actions.tsx",
  "components/admin/cron-run-now.tsx",
  "components/admin/system-error-actions.tsx",
  "components/admin/workspace-actions.tsx",
  "components/admin/admin-filters.tsx",
  "components/admin/inspect-banner.tsx",
];

for (const f of files) ensureClientHook(f);

// Fix inspect-banner specifically if still broken
{
  let text = fs.readFileSync("components/admin/inspect-banner.tsx", "utf8");
  text = text.replace(
    /export function InspectBanner\(\s*const \{ t \} = useI18n\(\);\{/,
    "export function InspectBanner({",
  );
  if (!text.includes("const { t } = useI18n()")) {
    text = text.replace(
      /export function InspectBanner\(([^)]*)\) \{/,
      (m, args) => `export function InspectBanner(${args}) {\n  const { t } = useI18n();`,
    );
  }
  // Clean duplicate hooks
  const parts = text.split("const { t } = useI18n();");
  if (parts.length > 2) {
    text = parts[0] + "const { t } = useI18n();" + parts.slice(1).join("");
  }
  fs.writeFileSync("components/admin/inspect-banner.tsx", text);
}

// Fix confirmLabel in workspace-admin-actions
{
  let text = fs.readFileSync("components/admin/workspace-admin-actions.tsx", "utf8");
  text = text.replace(
    /confirmLabel=\{isSuspended \? "Reactivează" : "Suspendă"\}/,
    'confirmLabel={isSuspended ? t("admin.reactivate") : t("admin.suspend")}',
  );
  // also single quotes variants
  text = text.replace(
    /confirmLabel=\{isSuspended \? 'Reactivează' : 'Suspendă'\}/,
    'confirmLabel={isSuspended ? t("admin.reactivate") : t("admin.suspend")}',
  );
  fs.writeFileSync("components/admin/workspace-admin-actions.tsx", text);
}

// Fix admin-confirm-dialog props if broken
{
  let text = fs.readFileSync("components/admin/admin-confirm-dialog.tsx", "utf8");
  // Read destructuring
  if (text.includes("confirmLabel: confirmLabelProp")) {
    // ok
  } else if (text.match(/confirmLabel,\n/) && !text.includes("confirmLabelProp")) {
    // already has confirmLabel without default - fine if optional
  }
  fs.writeFileSync("components/admin/admin-confirm-dialog.tsx", text);
}

function patch(file, reps) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) {
      console.warn("MISS", file, JSON.stringify(from).slice(0, 80));
      continue;
    }
    text = text.split(from).join(to);
    n += 1;
  }
  if (!text.includes("@/lib/i18n/t") && (text.includes('t("') || text.includes("t(`"))) {
    text = text.replace(/^(import .+;\n)/m, `$1import { getTranslator } from "@/lib/i18n/t";\n`);
  }
  if (!text.includes("const { t } = await getTranslator()") && (text.includes('t("') || text.includes("t(`"))) {
    const m = text.match(/export default async function \w+\([\s\S]*?\) \{/);
    if (m) {
      text = text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
    }
  }
  fs.writeFileSync(file, text);
  console.log("page", file, n);
}

// ---- pages ----
patch("app/admin/workspaces/[id]/page.tsx", [
  ['if (!status) return "Fără abonament";', 'if (!status) return t("admin.noSubscription");'],
  ['past_due: "Restanță",', 'past_due: "past_due",'],
  ["← Înapoi la workspace-uri", '{t("admin.backToWorkspaces")}'],
  ['label="Clienți"', 'label={t("common.clients")}'],
  ['label="Oferte"', 'label={t("nav.proposals")}'],
  ['label="Contracte"', 'label={t("nav.contracts")}'],
  ['{ label: "Oraș",', '{ label: t("common.city"),'],
  ['{ label: "Țară",', '{ label: t("admin.country"),'],
  ['{ label: "Monedă",', '{ label: t("common.currency"),'],
  [
    'description="Status facturare și trial."',
    'description={t("admin.billingTrialStatus")}',
  ],
  ['label: "Trial până la",', 'label: t("admin.trialUntil"),'],
  ['label: "Perioadă curentă până la",', 'label: t("admin.periodUntil"),'],
  [
    ">Nu există abonament pentru acest workspace.<",
    '>{t("admin.noSubForWorkspace")}<',
  ],
  ['title="Acțiuni admin"', 'title={t("admin.adminActions")}'],
  [
    'description="Schimbă planul, extinde trial-ul, suspendă sau inspectează workspace-ul."',
    'description={t("admin.adminActionsDesc")}',
  ],
]);

// Fix status label map usage for past_due on workspace detail - use t at call site
{
  let text = fs.readFileSync("app/admin/workspaces/[id]/page.tsx", "utf8");
  // subscriptionStatusLabel function - rewrite to use t
  text = text.replace(
    /function subscriptionStatusLabel\([\s\S]*?\n\}/,
    `function subscriptionStatusLabel(status: string | null | undefined, t: (k: string) => string): string {
  if (!status) return t("admin.noSubscription");
  if (status === "past_due") return t("admin.pastDue");
  const key = \`billing.status.\${status}\`;
  const label = t(key);
  return label === key ? status : label;
}`,
  );
  text = text.replace(
    /subscriptionStatusLabel\(([^),]+)\)/g,
    "subscriptionStatusLabel($1, t)",
  );
  // ensure getTranslator - subscriptionStatusLabel uses t from page scope for nested calls
  if (!text.includes("getTranslator")) {
    text = text.replace(/^(import .+;\n)/m, `$1import { getTranslator } from "@/lib/i18n/t";\n`);
  }
  if (!text.includes("const { t } = await getTranslator()")) {
    const m = text.match(/export default async function \w+\([\s\S]*?\) \{/);
    if (m) text = text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
  }
  fs.writeFileSync("app/admin/workspaces/[id]/page.tsx", text);
}

patch("app/admin/page.tsx", [
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca KPI-urile.";',
    'loadError = error instanceof Error ? error.message : t("admin.kpiLoadFailed");',
  ],
  [
    "Indicatori reali ai platformei. MRR este calculat în RON pe baza planurilor active.",
    '{t("admin.overviewHint")}',
  ],
  ['label="Plătite"', 'label={t("admin.paid")}'],
  ['label="Email eșuate 24h"', 'label={t("admin.emailsFailed24h")}'],
  ['label="Leaduri platformă"', 'label={t("admin.platformLeads")}'],
  [
    'label="Oferte / Contracte / Proiecte"',
    'label={t("admin.proposalsContractsProjects")}',
  ],
]);

// Note: loadError assignment may be before getTranslator - need t in scope
{
  let text = fs.readFileSync("app/admin/page.tsx", "utf8");
  // Move getTranslator to very top of function before try/catch
  if (text.includes('t("admin.kpiLoadFailed")') && text.includes("const { t } = await getTranslator()")) {
    // check order - if t used before declaration, move
    const tIdx = text.indexOf("const { t } = await getTranslator()");
    const useIdx = text.indexOf('t("admin.kpiLoadFailed")');
    if (useIdx >= 0 && tIdx > useIdx) {
      text = text.replace(/\n  const \{ t \} = await getTranslator\(\);\n/, "\n");
      const m = text.match(/export default async function \w+\([\s\S]*?\) \{/);
      if (m) text = text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
    }
  }
  fs.writeFileSync("app/admin/page.tsx", text);
}

patch("app/admin/emails/page.tsx", [
  [
    'description: "Invitație în workspace (echipă).",',
    'descriptionKey: "admin.emailInviteDesc",',
  ],
  [
    'description: "Ofertă trimisă către client.",',
    'descriptionKey: "admin.emailProposalDesc",',
  ],
  [
    'description: "Reminder plată scadentă azi.",',
    'descriptionKey: "admin.emailPaymentDueDesc",',
  ],
  [
    'description: "Reminder plată restantă.",',
    'descriptionKey: "admin.emailPaymentOverdueDesc",',
  ],
  [
    'description: "Reminder ofertă în așteptare.",',
    'descriptionKey: "admin.emailProposalPendingDesc",',
  ],
  [
    'description: "Reminder task scadență.",',
    'descriptionKey: "admin.emailTaskDueDesc",',
  ],
  [
    `Catalog documentar al template-urilor tranzacționale și de reminder folosite de platformă.
  Nu reprezintă volume de trimitere — vezi Deliveries pentru istoricul real.`,
    `{t("admin.emailsCatalogHint")}`,
  ],
]);

{
  let text = fs.readFileSync("app/admin/emails/page.tsx", "utf8");
  text = text.replace(/item\.description/g, "t(item.descriptionKey)");
  text = text.replace(/template\.description/g, "t(template.descriptionKey)");
  // also .description in map
  text = text.replace(/\{tpl\.description\}/g, "{t(tpl.descriptionKey)}");
  text = text.replace(/\{row\.description\}/g, "{t(row.descriptionKey)}");
  fs.writeFileSync("app/admin/emails/page.tsx", text);
}

patch("app/admin/plans/[id]/page.tsx", [
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca planul.";',
    'loadError = error instanceof Error ? error.message : t("admin.planLoadFailed");',
  ],
  ["← Înapoi la planuri", '{t("admin.backToPlans")}'],
  [
    '{canWrite ? "Editează" : "Plan"} {plan.name}',
    '{canWrite ? t("admin.editPlan") : "Plan"} {plan.name}',
  ],
  [
    "ID: {plan.id} · versiune curentă {plan.version}",
    '{t("admin.planIdVersion", { id: plan.id, version: plan.version })}',
  ],
  ['title="Setări plan"', 'title={t("admin.planSettings")}'],
  [
    'description="Modificările de preț creează o versiune nouă în plan_versions."',
    'description={t("admin.planSettingsDesc")}',
  ],
  [
    `Rolul tău permite doar citirea planului. Nume: {plan.name} ·{" "}
          {plan.priceMonthlyRon} RON / lună.`,
    `{t("admin.planReadOnly", { name: plan.name, price: plan.priceMonthlyRon })}`,
  ],
]);

patch("app/admin/subscriptions/[id]/page.tsx", [
  ['past_due: "Restanță",', 'past_due: "past_due",'],
  ["← Înapoi la abonamente", '{t("admin.backToSubscriptions")}'],
  ['label: "Valoare lunară",', 'label: t("admin.monthlyValue"),'],
  ['label: "Trial până la",', 'label: t("admin.trialUntil"),'],
  ['label: "Perioadă start",', 'label: t("admin.periodStart"),'],
  ['label: "Perioadă end",', 'label: t("admin.periodEnd"),'],
  ['label: "Anulare la final perioadă",', 'label: t("admin.cancelAtPeriodEnd"),'],
]);

patch("app/admin/subscriptions/page.tsx", [
  ['past_due: "Restanță",', 'past_due: "past_due",'],
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca abonamentele.";',
    'loadError = error instanceof Error ? error.message : t("admin.subsLoadFailed");',
  ],
  [
    "Facturare la nivel de platformă pentru toate workspace-urile.",
    '{t("admin.subsPageHint")}',
  ],
  ['label="Restanțe"', 'label={t("admin.pastDues")}'],
  ['hint="Necesită atenție"', 'hint={t("admin.needsAttention")}'],
  [
    'description="Nu există încă abonamente înregistrate."',
    'description={t("admin.noSubsYet")}',
  ],
  ['header: "Perioadă curentă până la",', 'header: t("admin.periodUntil"),'],
]);

patch("app/admin/system/health/page.tsx", [
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca starea sistemului.";',
    'loadError = error instanceof Error ? error.message : t("admin.healthLoadFailed");',
  ],
  [
    "Starea cron-ului, cozilor și integrărilor de producție.",
    '{t("admin.healthHint")}',
  ],
  [': "Nicio rulare încă"', ': t("admin.noRunYet")'],
  ['hint="evenimente procesate în 24h"', 'hint={t("admin.events24h")}'],
  [
    "Nicio execuție cron înregistrată.",
    '{t("admin.noCronRuns")}',
  ],
  ['header: "Durată",', 'header: t("admin.duration"),'],
]);

patch("app/admin/users/page.tsx", [
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca utilizatorii.";',
    'loadError = error instanceof Error ? error.message : t("admin.usersLoadFailed");',
  ],
  [
    "Conturi înregistrate pe platformă. Caută după nume sau email și filtrează după status.",
    '{t("admin.usersHint")}',
  ],
  ['label: "Căutare",', 'label: t("admin.search"),'],
  [
    ': "Nu există încă utilizatori înregistrați."',
    ': t("admin.noUsersYet")',
  ],
  ['{user.fullName ?? "Fără nume"}', '{user.fullName ?? t("admin.noName")}'],
  ['label="Admin platformă"', 'label={t("admin.platformAdmin")}'],
  [">Fără workspace<", '>{t("admin.noWorkspace")}<'],
]);

patch("app/admin/workspaces/page.tsx", [
  ['if (!status) return "Fără abonament";', 'if (!status) return t("admin.noSubscription");'],
  ['past_due: "Restanță",', 'past_due: "past_due",'],
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca workspace-urile.";',
    'loadError = error instanceof Error ? error.message : t("admin.workspacesLoadFailed");',
  ],
  [
    "Toate studiourile și agențiile înregistrate pe platformă.",
    '{t("admin.workspacesHint")}',
  ],
  [
    'description="Nu există încă workspace-uri înregistrate."',
    'description={t("admin.noWorkspacesYet")}',
  ],
  ['header: "Acțiuni",', 'header: t("common.actions"),'],
]);

patch("app/admin/audit/page.tsx", [
  [
    'activityError = error instanceof Error ? error.message : "Nu am putut încărca activity_logs.";',
    'activityError = error instanceof Error ? error.message : t("admin.activityLoadFailed");',
  ],
  [">Audit platformă<", '>{t("admin.auditTitle")}<'],
  [
    "Jurnalul principal din `platform_audit_logs`, plus activitate recentă din workspace-uri.",
    '{t("admin.auditHint")}',
  ],
  ['title="Fără audit"', 'title={t("admin.noAudit")}'],
  [
    'description="Nu există încă înregistrări în platform_audit_logs."',
    'description={t("admin.noAuditDesc")}',
  ],
  [
    'description="Secțiune opțională — activitate din toate workspace-urile."',
    'description={t("admin.activityOptional")}',
  ],
  [
    ">Nicio activitate workspace înregistrată.<",
    '>{t("admin.noWorkspaceActivity")}<',
  ],
]);

patch("app/admin/email-deliveries/page.tsx", [
  ['pending: "În așteptare",', 'pending: "pending",'],
  ['failed: "Eșuat",', 'failed: "failed",'],
  ['skipped: "Sărit",', 'skipped: "skipped",'],
  [
    "Ultimele livrări din `email_deliveries`. Destinatarii sunt mascați pentru confidențialitate.",
    '{t("admin.deliveriesHint")}',
  ],
  [
    'description="Nu există încă înregistrări în email_deliveries."',
    'description={t("admin.noDeliveries")}',
  ],
]);

{
  let text = fs.readFileSync("app/admin/email-deliveries/page.tsx", "utf8");
  // map delivery status labels at render
  text = text.replace(
    /DELIVERY_STATUS_LABELS\[([^\]]+)\]/g,
    '((s) => { const k = `admin.delivery${s[0].toUpperCase()}${s.slice(1)}`; /* noop */ return s; })($1)',
  );
  // simpler approach
  text = text.replace(
    /\(\(s\) => \{ const k = `admin\.delivery\$\{s\[0\]\.toUpperCase\(\)\}\$\{s\.slice\(1\)\}`; \/\* noop \*\/ return s; \}\)\(([^)]+)\)/g,
    'deliveryStatusLabel($1, t)',
  );
  if (!text.includes("function deliveryStatusLabel") && text.includes("deliveryStatusLabel(")) {
    text = text.replace(
      /^/,
      "",
    );
    // insert helper before export
    text = text.replace(
      /export default async function/,
      `function deliveryStatusLabel(status: string, t: (k: string) => string) {
  const map: Record<string, string> = {
    pending: "admin.deliveryPending",
    failed: "admin.deliveryFailed",
    skipped: "admin.deliverySkipped",
  };
  const key = map[status];
  return key ? t(key) : status;
}

export default async function`,
    );
  }
  fs.writeFileSync("app/admin/email-deliveries/page.tsx", text);
}

patch("app/admin/system/errors/page.tsx", [
  ['title="Nicio eroare deschisă"', 'title={t("admin.noOpenErrors")}'],
  [
    'description="Nu există erori nerezolvate în sistem."',
    'description={t("admin.noOpenErrorsDesc")}',
  ],
  ['header: "Occurențe",', 'header: t("admin.occurrences"),'],
  ['header: "Ultima apariție",', 'header: t("admin.lastSeen"),'],
  ['header: "Acțiuni",', 'header: t("common.actions"),'],
]);

patch("app/admin/users/[id]/page.tsx", [
  ["← Înapoi la utilizatori", '{t("admin.backToUsers")}'],
  ['{profile.full_name ?? "Fără nume"}', '{profile.full_name ?? t("admin.noName")}'],
  [
    'title="Profil" description="Date din profiles și auth."',
    'title={t("admin.profile")} description={t("admin.profileDesc")}',
  ],
  ['label: "Admin platformă",', 'label: t("admin.platformAdmin"),'],
  [
    'description="Workspace-urile în care este membru acest utilizator."',
    'description={t("admin.memberWorkspaces")}',
  ],
]);

patch("app/admin/feedback/page.tsx", [
  [
    'description="Nu există încă înregistrări de feedback."',
    'description={t("admin.noFeedbackYet")}',
  ],
  ['header: "Acțiuni",', 'header: t("common.actions"),'],
  [
    "Fără transcript. Module, unresolved, thumbs down — pentru îmbunătățirea UX.",
    '{t("admin.assistantHint")}',
  ],
  [
    'description="După ce utilizatorii întreabă, vei vedea modulele care generează confuzie."',
    'description={t("admin.assistantEmpty")}',
  ],
]);

patch("app/admin/settings/page.tsx", [
  [">Configurări<", '>{t("admin.configTitle")}<'],
  [
    "Setări non-secrete din `platform_settings`.",
    '{t("admin.configHint")}',
  ],
  ['title="Actualizare rapidă"', 'title={t("admin.quickUpdate")}'],
  [
    'description="Editează mentenanța și înregistrarea. Necesită motiv în audit."',
    'description={t("admin.quickUpdateDesc")}',
  ],
  [
    "Rolul tău permite doar citirea setărilor.",
    '{t("admin.settingsReadOnly")}',
  ],
]);

patch("app/admin/plans/page.tsx", [
  [
    'loadError = error instanceof Error ? error.message : "Nu am putut încărca planurile.";',
    'loadError = error instanceof Error ? error.message : t("admin.plansLoadFailed");',
  ],
  [
    'description="Nu există planuri definite."',
    'description={t("admin.noPlans")}',
  ],
  ["> /lună<", '>{t("admin.perMonth")}<'],
  [
    "Sursă: {plan.source === \"db\" ? \"bază de date\" : \"catalog cod\"} · v{plan.version}",
    '{t("admin.planSource", { source: plan.source === "db" ? t("admin.planSourceDb") : t("admin.planSourceCode"), version: plan.version })}',
  ],
]);

patch("app/admin/workspaces/[id]/inspect/page.tsx", [
  ["← Înapoi la workspace", '{t("admin.backToWorkspace")}'],
  [
    `Deschide o sesiune read-only în dashboard-ul workspace-ului. Nu poți modifica date, șterge
        înregistrări sau trimite invitații în timpul inspectării.`,
    `{t("admin.inspectIntro")}`,
  ],
]);

patch("app/admin/admins/page.tsx", [
  [
    'description="Nu există înregistrări în platform_admins."',
    'description={t("admin.noAdmins")}',
  ],
  ['header: "Acțiuni",', 'header: t("common.actions"),'],
]);

patch("app/admin/cron/page.tsx", [
  [
    'description="Nu există încă execuții pentru job-ul runner."',
    'description={t("admin.noCronExecutions")}',
  ],
  ['header: "Durată",', 'header: t("admin.duration"),'],
]);

patch("app/admin/jobs/page.tsx", [
  [
    'description="Nu există încă execuții înregistrate în cron_runs."',
    'description={t("admin.noJobExecutions")}',
  ],
  ['header: "Durată",', 'header: t("admin.duration"),'],
]);

patch("app/admin/webhooks/page.tsx", [
  [
    "Evenimente procesate din `stripe_webhook_events`. Nu se afișează secrete sau payload-uri complete.",
    '{t("admin.webhooksHint")}',
  ],
  [
    'description="Nu există încă evenimente Stripe procesate."',
    'description={t("admin.noWebhooks")}',
  ],
]);

patch("app/admin/layout.tsx", [
  ['title: "Admin platformă",', 'title: "EasyWedd Pro Admin",'],
]);

console.log("admin pages done");
