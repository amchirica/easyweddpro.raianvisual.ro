/**
 * Wire admin components + pages to t()/useI18n()/getTranslator().
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
  if (!fs.existsSync(file)) {
    console.warn("NOFILE", file);
    return;
  }
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) {
      console.warn("MISS", file, JSON.stringify(from).slice(0, 85));
      continue;
    }
    text = text.split(from).join(to);
    n += 1;
  }
  const needsClient =
    (text.includes('t("') || text.includes("t(`")) &&
    text.includes('"use client"') &&
    !text.includes("useI18n");
  if (needsClient) {
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
  }
  const needsServer =
    (text.includes('t("') || text.includes("t(`")) &&
    !text.includes('"use client"') &&
    !text.includes("getTranslator") &&
    file.startsWith("app/");
  if (needsServer) {
    // add import
    if (!text.includes("@/lib/i18n/t")) {
      const importLine = 'import { getTranslator } from "@/lib/i18n/t";\n';
      if (text.match(/^import /m)) {
        text = text.replace(/^(import .+;\n)/m, `$1${importLine}`);
      } else {
        text = importLine + text;
      }
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

function ensureServerT(file) {
  let text = fs.readFileSync(file, "utf8");
  if (text.includes("const { t } = await getTranslator()")) return;
  // insert after export default async function ... {
  const m = text.match(/export default async function \w+\([^)]*\) \{/);
  if (!m) {
    console.warn("NO SERVER T", file);
    return;
  }
  text = text.replace(m[0], m[0] + "\n  const { t } = await getTranslator();");
  if (!text.includes("@/lib/i18n/t")) {
    text = text.replace(/^(import .+;\n)/m, `$1import { getTranslator } from "@/lib/i18n/t";\n`);
  }
  fs.writeFileSync(file, text);
  console.log("serverT", file);
}

const adminRo = {
  changePlan: "Schimbă planul",
  changePlanTitle: "Schimbă planul workspace-ului",
  changePlanDesc: "Planul va fi actualizat imediat pentru workspace și abonament.",
  savePlan: "Salvează planul",
  extendTrialDesc: "Setează o nouă dată de expirare a trial-ului relativ la acum.",
  invalidDays: "Numărul de zile este invalid.",
  suspend: "Suspendă",
  reactivate: "Reactivează",
  reactivateWorkspace: "Reactivează workspace-ul",
  suspendWorkspace: "Suspendă workspace-ul",
  subToActive: "Abonamentul va trece în status activ.",
  subToSuspended: "Abonamentul va trece în status suspendat.",
  inspect: "Inspectează",
  targetPlan: "Plan țintă",
  maintenance: "Mentenanță",
  maintenanceActive: "Mod mentenanță activ",
  maintenanceMessagePh: "Mesaj afișat utilizatorilor…",
  saveMaintenance: "Salvează mentenanța",
  updateMaintenance: "Actualizează mentenanța",
  maintenanceDesc: "Setarea maintenance va fi scrisă în platform_settings.",
  registration: "Înregistrare",
  registrationActive: "Înregistrare activă",
  inviteOnly: "Doar pe invitație",
  saveRegistration: "Salvează înregistrarea",
  updateRegistration: "Actualizează înregistrarea",
  registrationDesc: "Setarea registration va fi scrisă în platform_settings.",
  reactivateUser: "Reactivează utilizatorul",
  reactivateUserDesc: "Contul va putea din nou să acceseze platforma.",
  suspendUser: "Suspendă utilizatorul",
  suspendUserDesc: "Contul nu va mai putea accesa platforma până la reactivare.",
  resetPassword: "Reset parolă",
  sendPasswordReset: "Trimite resetare parolă",
  sendEmail: "Trimite email",
  updateFeedback: "Actualizează feedback",
  updateFeedbackDesc: "Statusul și prioritatea vor fi salvate în jurnalul de audit.",
  adminNotesOptional: "Note admin (opțional)",
  reasonMin10: "Motivul trebuie să aibă cel puțin 10 caractere.",
  actionFailed: "Acțiunea a eșuat.",
  reasonPh: "Explică pe scurt de ce faci această acțiune…",
  monthlyPrice: "Preț lunar (RON)",
  highlighted: "Evidențiat",
  confirmPlanUpdate: "Confirmă actualizarea planului",
  planUpdateDesc: "Modificările de preț creează o versiune nouă. Acțiunea este jurnalizată.",
  invalidPrice: "Prețul este invalid.",
  inspectReasonPh: "Explică de ce inspectezi acest workspace (min. 10 caractere)…",
  inspectSessionHint: "Sesiunea este read-only, expiră în 60 de minute și este jurnalizată în audit.",
  startInspect: "Pornește inspectarea",
  changeAdminRole: "Schimbă rolul de admin",
  changeAdminRoleDesc: "Doar super-admin poate modifica rolurile. Acțiunea este jurnalizată.",
  saveRole: "Salvează rolul",
  runNow: "Rulează acum",
  runJobsTitle: "Rulează joburile de background",
  runJobsDesc: "Va executa runner-ul de cron imediat. Poate dura câteva secunde.",
  run: "Rulează",
  markResolved: "Marchează rezolvat",
  resolveErrorTitle: "Rezolvă eroarea de sistem",
  resolveErrorDesc: "Eroarea va fi marcată ca rezolvată. Poți adăuga o notă în motiv.",
  resolve: "Rezolvă",
  closeInspect: "Închide inspectarea",
  filter: "Filtrează",
  noSubscription: "Fără abonament",
  pastDue: "Restanță",
  backToWorkspaces: "← Înapoi la workspace-uri",
  billingTrialStatus: "Status facturare și trial.",
  trialUntil: "Trial până la",
  periodUntil: "Perioadă curentă până la",
  noSubForWorkspace: "Nu există abonament pentru acest workspace.",
  adminActions: "Acțiuni admin",
  adminActionsDesc: "Schimbă planul, extinde trial-ul, suspendă sau inspectează workspace-ul.",
  kpiLoadFailed: "Nu am putut încărca KPI-urile.",
  overviewHint: "Indicatori reali ai platformei. MRR este calculat în RON pe baza planurilor active.",
  paid: "Plătite",
  emailsFailed24h: "Email eșuate 24h",
  platformLeads: "Leaduri platformă",
  proposalsContractsProjects: "Oferte / Contracte / Proiecte",
  emailsCatalogHint:
    "Catalog documentar al template-urilor tranzacționale și de reminder folosite de platformă. Nu reprezintă volume de trimitere — vezi Deliveries pentru istoricul real.",
  planLoadFailed: "Nu am putut încărca planul.",
  backToPlans: "← Înapoi la planuri",
  editPlan: "Editează",
  planSettings: "Setări plan",
  planSettingsDesc: "Modificările de preț creează o versiune nouă în plan_versions.",
  planReadOnly: "Rolul tău permite doar citirea planului. Nume: {name} · {price} RON / lună.",
  planIdVersion: "ID: {id} · versiune curentă {version}",
  backToSubscriptions: "← Înapoi la abonamente",
  monthlyValue: "Valoare lunară",
  periodStart: "Perioadă start",
  periodEnd: "Perioadă end",
  cancelAtPeriodEnd: "Anulare la final perioadă",
  subsLoadFailed: "Nu am putut încărca abonamentele.",
  subsPageHint: "Facturare la nivel de platformă pentru toate workspace-urile.",
  pastDues: "Restanțe",
  needsAttention: "Necesită atenție",
  noSubsYet: "Nu există încă abonamente înregistrate.",
  healthLoadFailed: "Nu am putut încărca starea sistemului.",
  healthHint: "Starea cron-ului, cozilor și integrărilor de producție.",
  noRunYet: "Nicio rulare încă",
  events24h: "evenimente procesate în 24h",
  noCronRuns: "Nicio execuție cron înregistrată.",
  duration: "Durată",
  usersLoadFailed: "Nu am putut încărca utilizatorii.",
  usersHint: "Conturi înregistrate pe platformă. Caută după nume sau email și filtrează după status.",
  search: "Căutare",
  noUsersYet: "Nu există încă utilizatori înregistrați.",
  noName: "Fără nume",
  platformAdmin: "Admin platformă",
  noWorkspace: "Fără workspace",
  workspacesLoadFailed: "Nu am putut încărca workspace-urile.",
  workspacesHint: "Toate studiourile și agențiile înregistrate pe platformă.",
  noWorkspacesYet: "Nu există încă workspace-uri înregistrate.",
  auditTitle: "Audit platformă",
  auditHint: "Jurnalul principal din platform_audit_logs, plus activitate recentă din workspace-uri.",
  noAudit: "Fără audit",
  noAuditDesc: "Nu există încă înregistrări în platform_audit_logs.",
  activityOptional: "Secțiune opțională — activitate din toate workspace-urile.",
  noWorkspaceActivity: "Nicio activitate workspace înregistrată.",
  activityLoadFailed: "Nu am putut încărca activity_logs.",
  deliveriesHint:
    "Ultimele livrări din email_deliveries. Destinatarii sunt mascați pentru confidențialitate.",
  noDeliveries: "Nu există încă înregistrări în email_deliveries.",
  deliveryPending: "În așteptare",
  deliveryFailed: "Eșuat",
  deliverySkipped: "Sărit",
  noOpenErrors: "Nicio eroare deschisă",
  noOpenErrorsDesc: "Nu există erori nerezolvate în sistem.",
  occurrences: "Occurențe",
  lastSeen: "Ultima apariție",
  backToUsers: "← Înapoi la utilizatori",
  profile: "Profil",
  profileDesc: "Date din profiles și auth.",
  memberWorkspaces: "Workspace-urile în care este membru acest utilizator.",
  noFeedbackYet: "Nu există încă înregistrări de feedback.",
  assistantHint:
    "Fără transcript. Module, unresolved, thumbs down — pentru îmbunătățirea UX.",
  assistantEmpty: "După ce utilizatorii întreabă, vei vedea modulele care generează confuzie.",
  configTitle: "Configurări",
  configHint: "Setări non-secrete din platform_settings.",
  quickUpdate: "Actualizare rapidă",
  quickUpdateDesc: "Editează mentenanța și înregistrarea. Necesită motiv în audit.",
  settingsReadOnly: "Rolul tău permite doar citirea setărilor.",
  plansLoadFailed: "Nu am putut încărca planurile.",
  noPlans: "Nu există planuri definite.",
  perMonth: "/lună",
  planSourceDb: "bază de date",
  planSourceCode: "catalog cod",
  planSource: "Sursă: {source} · v{version}",
  backToWorkspace: "← Înapoi la workspace",
  inspectIntro:
    "Deschide o sesiune read-only în dashboard-ul workspace-ului. Nu poți modifica date, șterge înregistrări sau trimite invitații în timpul inspectării.",
  noAdmins: "Nu există înregistrări în platform_admins.",
  noCronExecutions: "Nu există încă execuții pentru job-ul runner.",
  noJobExecutions: "Nu există încă execuții înregistrate în cron_runs.",
  webhooksHint:
    "Evenimente procesate din stripe_webhook_events. Nu se afișează secrete sau payload-uri complete.",
  noWebhooks: "Nu există încă evenimente Stripe procesate.",
  layoutTitle: "Admin platformă",
  country: "Țară",
  emailInviteDesc: "Invitație în workspace (echipă).",
  emailProposalDesc: "Ofertă trimisă către client.",
  emailPaymentDueDesc: "Reminder plată scadentă azi.",
  emailPaymentOverdueDesc: "Reminder plată restantă.",
  emailProposalPendingDesc: "Reminder ofertă în așteptare.",
  emailTaskDueDesc: "Reminder task scadență.",
};

const adminEn = {
  changePlan: "Change plan",
  changePlanTitle: "Change workspace plan",
  changePlanDesc: "The plan will be updated immediately for the workspace and subscription.",
  savePlan: "Save plan",
  extendTrialDesc: "Set a new trial expiry date relative to now.",
  invalidDays: "The number of days is invalid.",
  suspend: "Suspend",
  reactivate: "Reactivate",
  reactivateWorkspace: "Reactivate workspace",
  suspendWorkspace: "Suspend workspace",
  subToActive: "The subscription will move to active status.",
  subToSuspended: "The subscription will move to suspended status.",
  inspect: "Inspect",
  targetPlan: "Target plan",
  maintenance: "Maintenance",
  maintenanceActive: "Maintenance mode on",
  maintenanceMessagePh: "Message shown to users…",
  saveMaintenance: "Save maintenance",
  updateMaintenance: "Update maintenance",
  maintenanceDesc: "The maintenance setting will be written to platform_settings.",
  registration: "Registration",
  registrationActive: "Registration enabled",
  inviteOnly: "Invite only",
  saveRegistration: "Save registration",
  updateRegistration: "Update registration",
  registrationDesc: "The registration setting will be written to platform_settings.",
  reactivateUser: "Reactivate user",
  reactivateUserDesc: "The account will be able to access the platform again.",
  suspendUser: "Suspend user",
  suspendUserDesc: "The account will not be able to access the platform until reactivated.",
  resetPassword: "Reset password",
  sendPasswordReset: "Send password reset",
  sendEmail: "Send email",
  updateFeedback: "Update feedback",
  updateFeedbackDesc: "Status and priority will be saved in the audit log.",
  adminNotesOptional: "Admin notes (optional)",
  reasonMin10: "The reason must be at least 10 characters.",
  actionFailed: "The action failed.",
  reasonPh: "Briefly explain why you are taking this action…",
  monthlyPrice: "Monthly price (RON)",
  highlighted: "Highlighted",
  confirmPlanUpdate: "Confirm plan update",
  planUpdateDesc: "Price changes create a new version. The action is audited.",
  invalidPrice: "The price is invalid.",
  inspectReasonPh: "Explain why you are inspecting this workspace (min. 10 characters)…",
  inspectSessionHint: "The session is read-only, expires in 60 minutes, and is audited.",
  startInspect: "Start inspection",
  changeAdminRole: "Change admin role",
  changeAdminRoleDesc: "Only a super-admin can change roles. The action is audited.",
  saveRole: "Save role",
  runNow: "Run now",
  runJobsTitle: "Run background jobs",
  runJobsDesc: "Will execute the cron runner immediately. May take a few seconds.",
  run: "Run",
  markResolved: "Mark resolved",
  resolveErrorTitle: "Resolve system error",
  resolveErrorDesc: "The error will be marked as resolved. You can add a note in the reason.",
  resolve: "Resolve",
  closeInspect: "Close inspection",
  filter: "Filter",
  noSubscription: "No subscription",
  pastDue: "Past due",
  backToWorkspaces: "← Back to workspaces",
  billingTrialStatus: "Billing and trial status.",
  trialUntil: "Trial until",
  periodUntil: "Current period until",
  noSubForWorkspace: "There is no subscription for this workspace.",
  adminActions: "Admin actions",
  adminActionsDesc: "Change plan, extend trial, suspend, or inspect the workspace.",
  kpiLoadFailed: "Could not load KPIs.",
  overviewHint: "Live platform indicators. MRR is calculated in RON from active plans.",
  paid: "Paid",
  emailsFailed24h: "Failed emails 24h",
  platformLeads: "Platform leads",
  proposalsContractsProjects: "Proposals / Contracts / Projects",
  emailsCatalogHint:
    "Documentary catalog of transactional and reminder templates used by the platform. Not send volumes — see Deliveries for real history.",
  planLoadFailed: "Could not load the plan.",
  backToPlans: "← Back to plans",
  editPlan: "Edit",
  planSettings: "Plan settings",
  planSettingsDesc: "Price changes create a new version in plan_versions.",
  planReadOnly: "Your role allows read-only access. Name: {name} · {price} RON / month.",
  planIdVersion: "ID: {id} · current version {version}",
  backToSubscriptions: "← Back to subscriptions",
  monthlyValue: "Monthly value",
  periodStart: "Period start",
  periodEnd: "Period end",
  cancelAtPeriodEnd: "Cancel at period end",
  subsLoadFailed: "Could not load subscriptions.",
  subsPageHint: "Platform-level billing for all workspaces.",
  pastDues: "Past due",
  needsAttention: "Needs attention",
  noSubsYet: "No subscriptions recorded yet.",
  healthLoadFailed: "Could not load system health.",
  healthHint: "Cron, queue, and production integration status.",
  noRunYet: "No runs yet",
  events24h: "events processed in 24h",
  noCronRuns: "No cron executions recorded.",
  duration: "Duration",
  usersLoadFailed: "Could not load users.",
  usersHint: "Accounts registered on the platform. Search by name or email and filter by status.",
  search: "Search",
  noUsersYet: "No users registered yet.",
  noName: "No name",
  platformAdmin: "Platform admin",
  noWorkspace: "No workspace",
  workspacesLoadFailed: "Could not load workspaces.",
  workspacesHint: "All studios and agencies registered on the platform.",
  noWorkspacesYet: "No workspaces registered yet.",
  auditTitle: "Platform audit",
  auditHint: "Main journal from platform_audit_logs, plus recent workspace activity.",
  noAudit: "No audit",
  noAuditDesc: "No records in platform_audit_logs yet.",
  activityOptional: "Optional section — activity from all workspaces.",
  noWorkspaceActivity: "No workspace activity recorded.",
  activityLoadFailed: "Could not load activity_logs.",
  deliveriesHint:
    "Latest deliveries from email_deliveries. Recipients are masked for privacy.",
  noDeliveries: "No records in email_deliveries yet.",
  deliveryPending: "Pending",
  deliveryFailed: "Failed",
  deliverySkipped: "Skipped",
  noOpenErrors: "No open errors",
  noOpenErrorsDesc: "There are no unresolved system errors.",
  occurrences: "Occurrences",
  lastSeen: "Last seen",
  backToUsers: "← Back to users",
  profile: "Profile",
  profileDesc: "Data from profiles and auth.",
  memberWorkspaces: "Workspaces where this user is a member.",
  noFeedbackYet: "No feedback records yet.",
  assistantHint: "No transcript. Modules, unresolved, thumbs down — for UX improvement.",
  assistantEmpty: "After users ask questions, you'll see modules that cause confusion.",
  configTitle: "Settings",
  configHint: "Non-secret settings from platform_settings.",
  quickUpdate: "Quick update",
  quickUpdateDesc: "Edit maintenance and registration. Requires an audit reason.",
  settingsReadOnly: "Your role allows read-only access to settings.",
  plansLoadFailed: "Could not load plans.",
  noPlans: "No plans defined.",
  perMonth: "/month",
  planSourceDb: "database",
  planSourceCode: "code catalog",
  planSource: "Source: {source} · v{version}",
  backToWorkspace: "← Back to workspace",
  inspectIntro:
    "Open a read-only session in the workspace dashboard. You cannot modify data, delete records, or send invites during inspection.",
  noAdmins: "No records in platform_admins.",
  noCronExecutions: "No executions for the runner job yet.",
  noJobExecutions: "No executions recorded in cron_runs yet.",
  webhooksHint:
    "Processed events from stripe_webhook_events. Secrets and full payloads are not shown.",
  noWebhooks: "No processed Stripe events yet.",
  layoutTitle: "Platform admin",
  country: "Country",
  emailInviteDesc: "Workspace team invitation.",
  emailProposalDesc: "Proposal sent to client.",
  emailPaymentDueDesc: "Payment due today reminder.",
  emailPaymentOverdueDesc: "Overdue payment reminder.",
  emailProposalPendingDesc: "Pending proposal reminder.",
  emailTaskDueDesc: "Task due reminder.",
};

mergeKeys("ro", "admin", adminRo);
mergeKeys("en", "admin", adminEn);

// ---- admin client components ----
patch("components/admin/workspace-admin-actions.tsx", [
  ["Schimbă planul\n", '{t("admin.changePlan")}\n'],
  ['title="Schimbă planul workspace-ului"', 'title={t("admin.changePlanTitle")}'],
  [
    'description="Planul va fi actualizat imediat pentru workspace și abonament."',
    'description={t("admin.changePlanDesc")}',
  ],
  ['confirmLabel="Salvează planul"', 'confirmLabel={t("admin.savePlan")}'],
  [
    'description="Setează o nouă dată de expirare a trial-ului relativ la acum."',
    'description={t("admin.extendTrialDesc")}',
  ],
  [
    'throw new Error("Numărul de zile este invalid.");',
    'throw new Error(t("admin.invalidDays"));',
  ],
  [
    '{isSuspended ? "Reactivează" : "Suspendă"}',
    '{isSuspended ? t("admin.reactivate") : t("admin.suspend")}',
  ],
  [
    'title={isSuspended ? "Reactivează workspace-ul" : "Suspendă workspace-ul"}',
    'title={isSuspended ? t("admin.reactivateWorkspace") : t("admin.suspendWorkspace")}',
  ],
  [
    '? "Abonamentul va trece în status activ."\n              : "Abonamentul va trece în status suspendat."',
    '? t("admin.subToActive")\n              : t("admin.subToSuspended")',
  ],
  [
    'confirmLabel={isSuspended ? "Reactivează" : "Suspendă"}',
    'confirmLabel={isSuspended ? t("admin.reactivate") : t("admin.suspend")}',
  ],
  ["Inspectează\n", '{t("admin.inspect")}\n'],
  [">Plan țintă<", '>{t("admin.targetPlan")}<'],
]);
ensureHook("components/admin/workspace-admin-actions.tsx", "}: WorkspaceAdminActionsProps) {");

patch("components/admin/settings-form.tsx", [
  [">Mentenanță<", '>{t("admin.maintenance")}<'],
  ["Mod mentenanță activ\n", '{t("admin.maintenanceActive")}\n'],
  [
    'placeholder="Mesaj afișat utilizatorilor…"',
    'placeholder={t("admin.maintenanceMessagePh")}',
  ],
  ["Salvează mentenanța\n", '{t("admin.saveMaintenance")}\n'],
  ['title="Actualizează mentenanța"', 'title={t("admin.updateMaintenance")}'],
  [
    'description="Setarea maintenance va fi scrisă în platform_settings."',
    'description={t("admin.maintenanceDesc")}',
  ],
  ['confirmLabel="Salvează"', 'confirmLabel={t("common.save")}'],
  [">Înregistrare<", '>{t("admin.registration")}<'],
  ["Înregistrare activă\n", '{t("admin.registrationActive")}\n'],
  ["Doar pe invitație\n", '{t("admin.inviteOnly")}\n'],
  ["Salvează înregistrarea\n", '{t("admin.saveRegistration")}\n'],
  ['title="Actualizează înregistrarea"', 'title={t("admin.updateRegistration")}'],
  [
    'description="Setarea registration va fi scrisă în platform_settings."',
    'description={t("admin.registrationDesc")}',
  ],
]);
ensureHook("components/admin/settings-form.tsx", "}: SettingsFormProps) {");

patch("components/admin/user-actions.tsx", [
  ["Reactivează\n", '{t("admin.reactivate")}\n'],
  ['title="Reactivează utilizatorul"', 'title={t("admin.reactivateUser")}'],
  [
    'description="Contul va putea din nou să acceseze platforma."',
    'description={t("admin.reactivateUserDesc")}',
  ],
  ['confirmLabel="Reactivează"', 'confirmLabel={t("admin.reactivate")}'],
  ["Suspendă\n", '{t("admin.suspend")}\n'],
  ['title="Suspendă utilizatorul"', 'title={t("admin.suspendUser")}'],
  [
    'description="Contul nu va mai putea accesa platforma până la reactivare."',
    'description={t("admin.suspendUserDesc")}',
  ],
  ['confirmLabel="Suspendă"', 'confirmLabel={t("admin.suspend")}'],
  ["Reset parolă\n", '{t("admin.resetPassword")}\n'],
  ['title="Trimite resetare parolă"', 'title={t("admin.sendPasswordReset")}'],
  ['confirmLabel="Trimite email"', 'confirmLabel={t("admin.sendEmail")}'],
]);
ensureHook("components/admin/user-actions.tsx", "}: UserActionsProps) {");

patch("components/admin/feedback-actions.tsx", [
  ['{ value: "low", label: "Scăzută" },', '{ value: "low", labelKey: "status.priority.low" },'],
  [
    '{ value: "normal", label: "Normală" },',
    '{ value: "normal", labelKey: "status.priority.normal" },',
  ],
  [
    '{ value: "high", label: "Ridicată" },',
    '{ value: "high", labelKey: "status.priority.high" },',
  ],
  [
    '{ value: "urgent", label: "Urgentă" },',
    '{ value: "urgent", labelKey: "status.priority.urgent" },',
  ],
  ["Actualizează\n", '{t("common.update")}\n'],
  ['title="Actualizează feedback"', 'title={t("admin.updateFeedback")}'],
  [
    'description="Statusul și prioritatea vor fi salvate în jurnalul de audit."',
    'description={t("admin.updateFeedbackDesc")}',
  ],
  ['confirmLabel="Salvează"', 'confirmLabel={t("common.save")}'],
  [
    ">Note admin (opțional)<",
    '>{t("admin.adminNotesOptional")}<',
  ],
]);
ensureHook("components/admin/feedback-actions.tsx", "}: FeedbackActionsProps) {");

{
  let text = fs.readFileSync("components/admin/feedback-actions.tsx", "utf8");
  text = text.replace(/option\.label/g, "t(option.labelKey)");
  fs.writeFileSync("components/admin/feedback-actions.tsx", text);
}

patch("components/admin/admin-confirm-dialog.tsx", [
  ['confirmLabel = "Confirmă"', 'confirmLabel'],
  [
    'setError("Motivul trebuie să aibă cel puțin 10 caractere.");',
    'setError(t("admin.reasonMin10"));',
  ],
  [
    'setError(err instanceof Error ? err.message : "Acțiunea a eșuat.");',
    'setError(err instanceof Error ? err.message : t("admin.actionFailed"));',
  ],
  [
    'placeholder="Explică pe scurt de ce faci această acțiune…"',
    'placeholder={t("admin.reasonPh")}',
  ],
  ["Anulează\n", '{t("common.cancel")}\n'],
  [
    '{busy ? "Se procesează…" : confirmLabel}',
    '{busy ? t("common.processing") : (confirmLabel ?? t("common.confirm"))}',
  ],
]);
ensureHook("components/admin/admin-confirm-dialog.tsx", "}: AdminConfirmDialogProps) {");

// Fix default confirmLabel prop type if broken
{
  let text = fs.readFileSync("components/admin/admin-confirm-dialog.tsx", "utf8");
  // if confirmLabel = without default broke, fix
  text = text.replace(
    /confirmLabel,\n/,
    "confirmLabel: confirmLabelProp,\n",
  );
  if (text.includes("confirmLabel: confirmLabelProp")) {
    // ensure we use confirmLabelProp in body - already using confirmLabel in ternary with ??
    text = text.replace(
      '{busy ? t("common.processing") : (confirmLabel ?? t("common.confirm"))}',
      '{busy ? t("common.processing") : (confirmLabelProp ?? t("common.confirm"))}',
    );
  }
  fs.writeFileSync("components/admin/admin-confirm-dialog.tsx", text);
}

patch("components/admin/plan-edit-form.tsx", [
  [">Preț lunar (RON)<", '>{t("admin.monthlyPrice")}<'],
  ["Evidențiat\n", '{t("admin.highlighted")}\n'],
  ["Salvează planul\n", '{t("admin.savePlan")}\n'],
  ['title="Confirmă actualizarea planului"', 'title={t("admin.confirmPlanUpdate")}'],
  [
    'description="Modificările de preț creează o versiune nouă. Acțiunea este jurnalizată."',
    'description={t("admin.planUpdateDesc")}',
  ],
  ['confirmLabel="Salvează"', 'confirmLabel={t("common.save")}'],
  [
    'throw new Error("Prețul este invalid.");',
    'throw new Error(t("admin.invalidPrice"));',
  ],
]);
ensureHook("components/admin/plan-edit-form.tsx", "}: PlanEditFormProps) {");

patch("components/admin/inspect-session-form.tsx", [
  [
    'setError("Motivul trebuie să aibă cel puțin 10 caractere.");',
    'setError(t("admin.reasonMin10"));',
  ],
  [
    'setError(err instanceof Error ? err.message : "Acțiunea a eșuat.");',
    'setError(err instanceof Error ? err.message : t("admin.actionFailed"));',
  ],
  [
    'placeholder="Explică de ce inspectezi acest workspace (min. 10 caractere)…"',
    'placeholder={t("admin.inspectReasonPh")}',
  ],
  [
    "Sesiunea este read-only, expiră în 60 de minute și este jurnalizată în audit.",
    '{t("admin.inspectSessionHint")}',
  ],
  [
    '{busy ? "Se deschide…" : "Pornește inspectarea"}',
    '{busy ? t("billing.opening") : t("admin.startInspect")}',
  ],
]);
ensureHook("components/admin/inspect-session-form.tsx", "}: InspectSessionFormProps) {");

patch("components/admin/admin-role-actions.tsx", [
  ["Actualizează\n", '{t("common.update")}\n'],
  ['title="Schimbă rolul de admin"', 'title={t("admin.changeAdminRole")}'],
  [
    'description="Doar super-admin poate modifica rolurile. Acțiunea este jurnalizată."',
    'description={t("admin.changeAdminRoleDesc")}',
  ],
  ['confirmLabel="Salvează rolul"', 'confirmLabel={t("admin.saveRole")}'],
]);
ensureHook("components/admin/admin-role-actions.tsx", "}: AdminRoleActionsProps) {");

patch("components/admin/cron-run-now.tsx", [
  ["Rulează acum\n", '{t("admin.runNow")}\n'],
  ['title="Rulează joburile de background"', 'title={t("admin.runJobsTitle")}'],
  [
    'description="Va executa runner-ul de cron imediat. Poate dura câteva secunde."',
    'description={t("admin.runJobsDesc")}',
  ],
  ['confirmLabel="Rulează"', 'confirmLabel={t("admin.run")}'],
]);
ensureHook("components/admin/cron-run-now.tsx", "export function CronRunNow(");

patch("components/admin/system-error-actions.tsx", [
  ["Marchează rezolvat\n", '{t("admin.markResolved")}\n'],
  ['title="Rezolvă eroarea de sistem"', 'title={t("admin.resolveErrorTitle")}'],
  [
    'description="Eroarea va fi marcată ca rezolvată. Poți adăuga o notă în motiv."',
    'description={t("admin.resolveErrorDesc")}',
  ],
  ['confirmLabel="Rezolvă"', 'confirmLabel={t("admin.resolve")}'],
]);
ensureHook("components/admin/system-error-actions.tsx", "}: SystemErrorActionsProps) {");

patch("components/admin/workspace-actions.tsx", [
  ['aria-label="Schimbă planul"', 'aria-label={t("admin.changePlan")}'],
  [
    '{isSuspended ? "Reactivează" : "Suspendă"}',
    '{isSuspended ? t("admin.reactivate") : t("admin.suspend")}',
  ],
]);
ensureHook("components/admin/workspace-actions.tsx", "}: WorkspaceActionsProps) {");

patch("components/admin/inspect-banner.tsx", [
  ["Închide inspectarea\n", '{t("admin.closeInspect")}\n'],
]);
ensureHook("components/admin/inspect-banner.tsx", "export function InspectBanner(");

patch("components/admin/admin-filters.tsx", [
  ["Filtrează\n", '{t("admin.filter")}\n'],
]);
ensureHook("components/admin/admin-filters.tsx", "}: AdminFiltersProps) {");

console.log("admin components done");
