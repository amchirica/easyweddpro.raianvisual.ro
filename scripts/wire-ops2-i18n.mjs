/**
 * Wire templates, automations, team, feedback, notifications to t()/useI18n().
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
  if ((text.includes('t("') || text.includes("t(`")) && !text.includes("useI18n")) {
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
    console.warn("NO HOOK", file, marker.slice(0, 50));
    return;
  }
  text = text.replace(marker, marker + "\n  const { t } = useI18n();");
  fs.writeFileSync(file, text);
  console.log("hook", file);
}

mergeKeys("ro", "modules", {
  templates: {
    createHint: "Alege tipul și denumirea. Tipul nu mai poate fi schimbat după creare.",
    namePh: "Ex: Ofertă foto-video full day",
    businessType: "Tip business (opțional)",
    setDefaultForType: "Setează ca implicit pentru tipul {type}",
    content: "Conținut",
    contentHint:
      "Folosește variabile alocate din lista din dreapta — ex. {{client_name}}. Textul nu este executat ca și cod.",
    shortDescription: "Descriere scurtă (afișată în listă)",
    checklist: "Listă de verificare",
    pipelineStages: "Etape pipeline",
    checklistPh: "Ex: Trimite contract",
    pipelinePh: "Ex: Rezervare confirmată",
    removeAria: "Elimină",
    noItemsYet: "Niciun element adăugat încă.",
    bodyPh: "Text cu variabile alocate, ex: Bună {{client_name}}, ...",
    createTemplate: "Creează template",
    previewNote: "Doar variabilele permise sunt înlocuite, cu date exemplu. Fără cod executabil.",
    unresolvedVars: "Variabile nerezolvate în exemplu: {vars}",
  },
  automations: {
    namePh: "Ex: Email după lead nou",
    trigger: "Declanșator",
    descriptionOptional: "Descriere (opțional)",
    descriptionPh: "Notează scopul acestei automatizări.",
    active: "Activă",
    disabledHint: "Automatizările dezactivate nu rulează la niciun declanșator.",
    toggleAriaState: "Comută starea automatizării",
    conditionsOptional: "Condiții (opțional)",
    conditionsHint: "Toate condițiile trebuie să fie adevărate pentru ca automatizarea să ruleze.",
    condition: "Condiție",
    noConditions: "Fără condiții — automatizarea rulează de fiecare dată.",
    fieldPh: "câmp (ex: source)",
    actions: "Acțiuni",
    actionsHint: "Acțiunile rulează în ordine, la fiecare declanșare.",
    action: "Acțiune",
    notesOptional: "Note (opțional)",
    content: "Conținut",
    recipientOptional: "Destinatar (opțional — implicit clientul asociat)",
    resendHint:
      "Trimiterea reală necesită RESEND_API_KEY configurat. Fără el, emailul este doar jurnalizat.",
    createAutomation: "Creează automatizare",
    addActionRequired: "Adaugă cel puțin o acțiune validă.",
    selectStatus: "Selectează statusul",
  },
  team: {
    inviteFailed: "Nu am putut crea invitația.",
    inviteTitle: "Invită membru",
    inviteHint:
      "Trimite o invitație cu rol prestabilit. Linkul este valabil 7 zile și este afișat o singură dată.",
    inviteCreated:
      "Invitație creată pentru {email}. Copiază linkul acum — nu va mai fi afișat.",
    sendInvite: "Trimite invitația",
    sending: "Se trimite…",
    projectsOnTeam: "Proiecte în echipă",
    noTasksAssigned: "Nicio sarcină asignată.",
    noProjectsOnTeam: "Niciun proiect cu acest membru în echipă.",
  },
});

mergeKeys("en", "modules", {
  templates: {
    createHint: "Choose the type and name. The type cannot be changed after creation.",
    namePh: "E.g. Full-day photo-video proposal",
    businessType: "Business type (optional)",
    setDefaultForType: "Set as default for type {type}",
    content: "Content",
    contentHint:
      "Use allocated variables from the list on the right — e.g. {{client_name}}. Text is not executed as code.",
    shortDescription: "Short description (shown in list)",
    checklist: "Checklist",
    pipelineStages: "Pipeline stages",
    checklistPh: "E.g. Send contract",
    pipelinePh: "E.g. Booking confirmed",
    removeAria: "Remove",
    noItemsYet: "No items added yet.",
    bodyPh: "Text with allocated variables, e.g. Hi {{client_name}}, ...",
    createTemplate: "Create template",
    previewNote: "Only allowed variables are replaced with sample data. No executable code.",
    unresolvedVars: "Unresolved variables in sample: {vars}",
  },
  automations: {
    namePh: "E.g. Email after new lead",
    trigger: "Trigger",
    descriptionOptional: "Description (optional)",
    descriptionPh: "Note the purpose of this automation.",
    active: "Active",
    disabledHint: "Disabled automations do not run on any trigger.",
    toggleAriaState: "Toggle automation state",
    conditionsOptional: "Conditions (optional)",
    conditionsHint: "All conditions must be true for the automation to run.",
    condition: "Condition",
    noConditions: "No conditions — the automation runs every time.",
    fieldPh: "field (e.g. source)",
    actions: "Actions",
    actionsHint: "Actions run in order on each trigger.",
    action: "Action",
    notesOptional: "Notes (optional)",
    content: "Content",
    recipientOptional: "Recipient (optional — defaults to linked client)",
    resendHint:
      "Real sending requires RESEND_API_KEY configured. Without it, the email is only logged.",
    createAutomation: "Create automation",
    addActionRequired: "Add at least one valid action.",
    selectStatus: "Select status",
  },
  team: {
    inviteFailed: "Could not create the invitation.",
    inviteTitle: "Invite member",
    inviteHint:
      "Send an invitation with a preset role. The link is valid for 7 days and shown only once.",
    inviteCreated: "Invitation created for {email}. Copy the link now — it won't be shown again.",
    sendInvite: "Send invitation",
    sending: "Sending…",
    projectsOnTeam: "Projects on team",
    noTasksAssigned: "No tasks assigned.",
    noProjectsOnTeam: "No projects with this member on the team.",
  },
});

mergeKeys("ro", "common", {
  processing: "Se procesează…",
  update: "Actualizează",
  markAll: "Marchează tot",
});
mergeKeys("en", "common", {
  processing: "Processing…",
  update: "Update",
  markAll: "Mark all",
});

// feedback namespace - use common/feedback keys in a dedicated block under modules or admin
mergeKeys("ro", "common", {
  feedback: {
    bug: "Am găsit o problemă",
    needMore: "Descrie puțin mai mult, te rog.",
    betaIntro: "Suntem în beta — spune-ne ce funcționează, ce nu, sau ce ți-ar plăcea să vezi.",
    placeholder: "Descrie ce ai observat sau ce ai vrea să se schimbe…",
    ratingOptional: "Notă (opțional)",
    ratingAria: "Notă {value}",
  },
});
mergeKeys("en", "common", {
  feedback: {
    bug: "I found a problem",
    needMore: "Please describe a bit more.",
    betaIntro: "We're in beta — tell us what works, what doesn't, or what you'd like to see.",
    placeholder: "Describe what you noticed or what you'd like changed…",
    ratingOptional: "Rating (optional)",
    ratingAria: "Rating {value}",
  },
});

// ---- templates ----
patch("components/templates/template-form.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    "if (!window.confirm(`Ștergi template-ul „${initial.name}”? Această acțiune nu poate fi anulată.`)) return;",
    'if (!window.confirm(t("modules.templates.deleteConfirm", { name: initial.name }))) return;',
  ],
  [
    "Alege tipul și denumirea. Tipul nu mai poate fi schimbat după creare.",
    '{t("modules.templates.createHint")}',
  ],
  [
    'placeholder="Ex: Ofertă foto-video full day"',
    'placeholder={t("modules.templates.namePh")}',
  ],
  [">Tip business (opțional)<", '>{t("modules.templates.businessType")}<'],
  [
    "Setează ca implicit pentru tipul {TEMPLATE_TYPE_LABELS[form.type]}",
    '{t("modules.templates.setDefaultForType", { type: TEMPLATE_TYPE_LABELS[form.type] })}',
  ],
  [">Conținut<", '>{t("modules.templates.content")}<'],
  [
    `Folosește variabile alocate din lista din dreapta — ex. <code>{"{{client_name}}"}</code>. Textul nu
`,
    `{t("modules.templates.contentHint")}
`,
  ],
  [
    ">Descriere scurtă (afișată în listă)<",
    '>{t("modules.templates.shortDescription")}<',
  ],
  [
    '{listKey === "checklist" ? "Listă de verificare" : "Etape pipeline"}',
    '{listKey === "checklist" ? t("modules.templates.checklist") : t("modules.templates.pipelineStages")}',
  ],
  [
    'placeholder={listKey === "checklist" ? "Ex: Trimite contract" : "Ex: Rezervare confirmată"}',
    'placeholder={listKey === "checklist" ? t("modules.templates.checklistPh") : t("modules.templates.pipelinePh")}',
  ],
  ["Adaugă\n", '{t("common.add")}\n'],
  ['aria-label="Elimină"', 'aria-label={t("modules.templates.removeAria")}'],
  [">Niciun element adăugat încă.<", '>{t("modules.templates.noItemsYet")}<'],
  [
    'placeholder="Text cu variabile alocate, ex: Bună {{client_name}}, ..."',
    'placeholder={t("modules.templates.bodyPh")}',
  ],
  [
    '{submitting ? "Se salvează…" : mode === "create" ? "Creează template" : "Salvează modificările"}',
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.templates.createTemplate") : t("common.saveChanges")}',
  ],
  ["Anulează\n", '{t("common.cancel")}\n'],
  ["Setează implicit\n", '{t("modules.templates.setDefault")}\n'],
  ["Duplică\n", '{t("common.duplicate")}\n'],
  ["Restaurează din arhivă\n", '{t("modules.templates.restoreArchive")}\n'],
  ["Arhivează\n", '{t("common.archive")}\n'],
  ["Șterge\n", '{t("common.delete")}\n'],
]);
ensureHook("components/templates/template-form.tsx", "}: TemplateFormProps) {");

patch("components/templates/templates-list.tsx", [
  ["Editează\n", '{t("common.edit")}\n'],
  ["Duplică\n", '{t("common.duplicate")}\n'],
  ["Arhivează\n", '{t("common.archive")}\n'],
  ["Șterge\n", '{t("common.delete")}\n'],
]);
ensureHook("components/templates/templates-list.tsx", "}: TemplatesListProps) {");

patch("components/templates/template-preview.tsx", [
  [
    "Doar variabilele permise sunt înlocuite, cu date exemplu. Fără cod executabil.",
    '{t("modules.templates.previewNote")}',
  ],
  [
    "Variabile nerezolvate în exemplu: {unresolved.map((v) => `{{${v}}}`).join(\", \")}",
    '{t("modules.templates.unresolvedVars", { vars: unresolved.map((v) => `{{${v}}}`).join(", ") })}',
  ],
]);
ensureHook("components/templates/template-preview.tsx", "}: TemplatePreviewProps) {");

// ---- automations ----
patch("components/automations/automation-form.tsx", [
  [
    'setFormError(parsed.error.issues[0]?.message ?? "Verifică datele completate.");',
    'setFormError(parsed.error.issues[0]?.message ?? t("common.verifyData"));',
  ],
  [
    'setFormError("Adaugă cel puțin o acțiune validă.");',
    'setFormError(t("modules.automations.addActionRequired"));',
  ],
  [
    'placeholder="Ex: Email după lead nou"',
    'placeholder={t("modules.automations.namePh")}',
  ],
  [">Declanșator<", '>{t("modules.automations.trigger")}<'],
  [">Descriere (opțional)<", '>{t("modules.automations.descriptionOptional")}<'],
  [
    'placeholder="Notează scopul acestei automatizări."',
    'placeholder={t("modules.automations.descriptionPh")}',
  ],
  [">Activă<", '>{t("modules.automations.active")}<'],
  [
    "Automatizările dezactivate nu rulează la niciun declanșator.",
    '{t("modules.automations.disabledHint")}',
  ],
  [
    'aria-label="Comută starea automatizării"',
    'aria-label={t("modules.automations.toggleAriaState")}',
  ],
  [">Condiții (opțional)<", '>{t("modules.automations.conditionsOptional")}<'],
  [
    "Toate condițiile trebuie să fie adevărate pentru ca automatizarea să ruleze.",
    '{t("modules.automations.conditionsHint")}',
  ],
  ["Condiție\n", '{t("modules.automations.condition")}\n'],
  [
    ">Fără condiții — automatizarea rulează de fiecare dată.<",
    '>{t("modules.automations.noConditions")}<',
  ],
  [
    'placeholder="câmp (ex: source)"',
    'placeholder={t("modules.automations.fieldPh")}',
  ],
  [">Acțiuni<", '>{t("modules.automations.actions")}<'],
  [
    ">Acțiunile rulează în ordine, la fiecare declanșare.<",
    '>{t("modules.automations.actionsHint")}<',
  ],
  ["Acțiune\n", '{t("modules.automations.action")}\n'],
  [">Note (opțional)<", '>{t("modules.automations.notesOptional")}<'],
  [">Conținut<", '>{t("modules.automations.content")}<'],
  [
    ">Destinatar (opțional — implicit clientul asociat)<",
    '>{t("modules.automations.recipientOptional")}<',
  ],
  [
    `Trimiterea reală necesită RESEND_API_KEY configurat. Fără el, emailul este
`,
    `{t("modules.automations.resendHint")}
`,
  ],
  ["Anulează\n", '{t("common.cancel")}\n'],
  [
    '{submitting ? "Se salvează…" : mode === "create" ? "Creează automatizare" : "Salvează modificările"}',
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.automations.createAutomation") : t("common.saveChanges")}',
  ],
  [
    'placeholder="Selectează statusul"',
    'placeholder={t("modules.automations.selectStatus")}',
  ],
]);
ensureHook("components/automations/automation-form.tsx", "}: AutomationFormProps) {");

patch("components/automations/automations-list-client.tsx", [
  ["Automatizare nouă\n", '{t("modules.automations.new")}\n'],
  ["Editează\n", '{t("common.edit")}\n'],
  ["Duplică\n", '{t("common.duplicate")}\n'],
  ["Șterge\n", '{t("common.delete")}\n'],
]);
ensureHook("components/automations/automations-list-client.tsx", "}: AutomationsListClientProps) {");

// ---- team ----
patch("components/team/invite-member-dialog.tsx", [
  [
    'setFormError(result?.error ?? "Nu am putut crea invitația.");',
    'setFormError(result?.error ?? t("modules.team.inviteFailed"));',
  ],
  [">Invită membru<", '>{t("modules.team.inviteTitle")}<'],
  [
    `Trimite o invitație cu rol prestabilit. Linkul este valabil 7 zile și este afișat o
          singură dată.`,
    `{t("modules.team.inviteHint")}`,
  ],
  [
    `Invitație creată pentru <strong>{email}</strong>. Copiază linkul acum — nu va mai fi
`,
    `{t("modules.team.inviteCreated", { email })}
`,
  ],
  ["Anulează\n", '{t("common.cancel")}\n'],
  [
    '{submitting ? "Se trimite…" : "Trimite invitația"}',
    '{submitting ? t("modules.team.sending") : t("modules.team.sendInvite")}',
  ],
]);
ensureHook("components/team/invite-member-dialog.tsx", "}: InviteMemberDialogProps) {");

patch("components/team/member-detail.tsx", [
  ['todo: "De făcut",', 'todo: "todo",'],
  ['in_progress: "În lucru",', 'in_progress: "in_progress",'],
  [
    'const displayName = member.fullName ?? "Membru fără profil";',
    'const displayName = member.fullName ?? t("modules.team.memberNoProfile");',
  ],
  [
    "`Confirmă transferul de proprietate: „${displayName}” va deveni owner.`",
    't("modules.team.transferConfirm", { name: displayName })',
  ],
  [
    'label="Proiecte în echipă"',
    'label={t("modules.team.projectsOnTeam")}',
  ],
  [">Nicio sarcină asignată.<", '>{t("modules.team.noTasksAssigned")}<'],
  [">Proiecte în echipă<", '>{t("modules.team.projectsOnTeam")}<'],
  [
    ">Niciun proiect cu acest membru în echipă.<",
    '>{t("modules.team.noProjectsOnTeam")}<',
  ],
  ["Reactivează\n", '{t("modules.team.reactivate")}\n'],
  ["Dezactivează\n", '{t("modules.team.deactivate")}\n'],
  ["Elimină din workspace\n", '{t("modules.team.removeFromWorkspace")}\n'],
]);
ensureHook("components/team/member-detail.tsx", "}: MemberDetailProps) {");

// Fix task status labels to use t at render
{
  let text = fs.readFileSync("components/team/member-detail.tsx", "utf8");
  // If TASK_STATUS_LABELS still used for display, replace usage
  text = text.replace(
    /TASK_STATUS_LABELS\[([^\]]+)\]/g,
    't(`status.task.${$1}`)',
  );
  fs.writeFileSync("components/team/member-detail.tsx", text);
}

patch("components/team/team-page-client.tsx", [
  ["Reactivează\n", '{t("modules.team.reactivate")}\n'],
  ["Dezactivează\n", '{t("modules.team.deactivate")}\n'],
  [
    `{WORKSPACE_ROLE_LABELS[invitation.role]} · trimisă {formatDate(invitation.createdAt)} ·
            expiră {formatDate(invitation.expiresAt)}`,
    `{t("modules.team.sentExpires", { sent: formatDate(invitation.createdAt), expires: formatDate(invitation.expiresAt) })}`,
  ],
]);
ensureHook("components/team/team-page-client.tsx", "}: TeamPageClientProps) {");

// ---- feedback ----
patch("components/feedback/feedback-button.tsx", [
  ['bug: "Am găsit o problemă",', 'bug: "bug",'],
  [
    'setError("Descrie puțin mai mult, te rog.");',
    'setError(t("common.feedback.needMore"));',
  ],
  [
    "Suntem în beta — spune-ne ce funcționează, ce nu, sau ce ți-ar plăcea să vezi.",
    '{t("common.feedback.betaIntro")}',
  ],
  [
    'placeholder="Descrie ce ai observat sau ce ai vrea să se schimbe…"',
    'placeholder={t("common.feedback.placeholder")}',
  ],
  [">Notă (opțional)<", '>{t("common.feedback.ratingOptional")}<'],
  [
    "aria-label={`Notă ${value}`}",
    'aria-label={t("common.feedback.ratingAria", { value })}',
  ],
  ["Anulează\n", '{t("common.cancel")}\n'],
  [
    '{submitting ? "Se trimite…" : "Trimite"}',
    '{submitting ? t("modules.team.sending") : t("common.send")}',
  ],
]);
ensureHook("components/feedback/feedback-button.tsx", "export function FeedbackButton() {");

// Fix FEEDBACK_TYPE_LABELS usage
{
  let text = fs.readFileSync("components/feedback/feedback-button.tsx", "utf8");
  // Replace label map display - if FEEDBACK_TYPES has bug label used
  if (text.includes('bug: "bug"')) {
    text = text.replace(
      /FEEDBACK_TYPE_LABELS\[([^\]]+)\]/g,
      '( $1 === "bug" ? t("common.feedback.bug") : FEEDBACK_TYPE_LABELS[$1] )',
    );
  }
  fs.writeFileSync("components/feedback/feedback-button.tsx", text);
}

// ---- notifications ----
patch("components/notifications/notifications-bell.tsx", [
  ['aria-label="Notificări"', 'aria-label={t("common.notifications")}'],
  [">Notificări<", '>{t("common.notifications")}<'],
  ["Marchează tot\n", '{t("common.markAll")}\n'],
  [">Se încarcă…<", '>{t("common.loading")}<'],
  ["Nu ai notificări.", '{t("common.noNotifications")}'],
]);
ensureHook("components/notifications/notifications-bell.tsx", "export function NotificationsBell(");

console.log("templates/automations/team/feedback/notifications done");
