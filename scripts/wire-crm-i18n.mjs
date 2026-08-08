/**
 * Wire leads, clients, payments, projects critical UI to t().
 * Skips persistence markers (Invitați:/Durată:).
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
    text = text.replace(
      '"use client";\n',
      '"use client";\n\nimport { useI18n } from "@/components/providers/i18n-provider";\n',
    );
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
  // Only insert after a complete `{` that closes props
  text = text.replace(marker, marker + "\n  const { t } = useI18n();");
  fs.writeFileSync(file, text);
  console.log("hook", file);
}

mergeKeys("ro", "modules", {
  leads: {
    edit: "Editează lead",
    createHint: "Adaugă un lead nou în pipeline.",
    editHint: "Actualizează detaliile acestui lead.",
    selectType: "Selectează tipul",
    eventVenue: "Locație eveniment",
    venuePlaceholder: "Sală, restaurant, locație",
    guestCount: "Număr invitați",
    optional: "Opțional",
    duration: "Durată",
    servicesComma: "Servicii (separate prin virgulă)",
    tagsComma: "Etichete (separate prin virgulă)",
    notesLabel: "Notițe",
    createLead: "Creează lead",
    backToList: "Înapoi la leaduri",
    createProposal: "Creează ofertă",
    dateUnspecified: "Dată nespecificată",
    sourceLabel: "Sursă: {source}",
    confirmLost: "Confirmă pierdut",
    noNotesYet: "Nicio notă încă.",
    addNotePh: "Adaugă o notă…",
    addNote: "Adaugă notă",
    noActivity: "Fără activitate",
    deleteTitle: "Ștergi acest lead?",
    deleteConfirm: "Această acțiune nu poate fi anulată. {name} va fi eliminat din pipeline.",
    deleteLead: "Șterge lead",
    deleting: "Se șterge…",
    convertTitle: "Convertește în client",
    convertHint: "Alege dacă {name} devine un client nou sau se leagă de unul existent.",
    convertDemo:
      "Conversia leadurilor în clienți este disponibilă doar pentru workspace-uri conectate. Creează-ți un cont pentru a folosi această funcție.",
    selectExisting: "Selectează clientul existent.",
    convertFailed: "Conversia a eșuat.",
    searchingMatches: "Se caută potriviri…",
    noMatches: "Nu am găsit clienți existenți cu acest email sau telefon.",
    converting: "Se convertește…",
  },
  clients: {
    edit: "Editează client",
    createHint: "Adaugă un client nou în evidență.",
    editHint: "Actualizează detaliile acestui client.",
    country: "Țară",
    tagsComma: "Etichete (separate prin virgulă)",
    createClient: "Creează client",
    selectType: "Selectează tipul",
  },
  payments: {
    edit: "Editează plata",
    createHint: "Înregistrează un avans, o tranșă sau o plată.",
    editHint: "Actualizează detaliile acestei plăți.",
    totalAmount: "Sumă totală",
    paidAmount: "Sumă încasată",
    overpayWarn:
      "Suma încasată depășește suma totală. Confirmă că este o suprasumă intenționată.",
    dueDate: "Termen scadență",
    selectMethod: "Selectează metoda",
    noContract: "Fără contract",
    noProject: "Fără proiect",
    currencyLabel: "Valută",
    reference: "Referință",
    referencePh: "Ex: OP 1234, factură #45",
    proofUrl: "Link dovadă plată",
    createPayment: "Creează plată",
    partial: "Plată parțială",
    markPaid: "Marchează plătit",
    noDeadline: "Fără termen",
    paidAt: "Plătit la",
    proof: "Dovadă plată",
    partialTitle: "Plată parțială",
    partialHint: "Actualizează suma încasată pentru „{label}”.",
    overTotal: "Suma depășește totalul. Confirmă suprasuma.",
  },
  projects: {
    saveFailed: "Proiectul nu a putut fi salvat. Verifică datele și încearcă din nou.",
    noPermissionEdit:
      "Nu ai permisiunea de a edita acest proiect. Poți vizualiza datele, dar salvarea este dezactivată.",
    titlePh: "Nuntă Ana & Radu",
    selectClient: "Selectează clientul",
    noClientsYet: "Niciun client disponibil încă.",
    location: "Locație",
    locationPh: "Sala Regia, București",
    teamComma: "Echipă (separată prin virgulă)",
    createProject: "Creează proiect",
    createShort: "Creează",
    needAccountArchive: "Arhivarea proiectelor necesită un cont conectat.",
    needAccountRestore: "Restaurarea proiectelor necesită un cont conectat.",
    needAccountDelete: "Ștergerea proiectelor necesită un cont conectat.",
    backToList: "Înapoi la proiecte",
    margin: "Marjă",
    noDateSet: "Fără dată setată",
    team: "Echipă",
    noAssignees: "Nicio persoană asignată încă.",
    archiveConfirm: "Proiectul rămâne disponibil în istoric, dar nu va mai apărea în lista activă.",
    archiving: "Se arhivează…",
    archiveProject: "Arhivează proiect",
    deleteTitle: "Ștergi acest proiect?",
    deleteConfirm: "Proiectul va fi marcat ca șters și eliminat din listă. Poate fi restaurat ulterior.",
    deleteProject: "Șterge proiect",
    deleting: "Se șterge…",
    restoring: "Se restaurează…",
  },
});

mergeKeys("en", "modules", {
  leads: {
    edit: "Edit lead",
    createHint: "Add a new lead to the pipeline.",
    editHint: "Update this lead's details.",
    selectType: "Select type",
    eventVenue: "Event venue",
    venuePlaceholder: "Hall, restaurant, venue",
    guestCount: "Guest count",
    optional: "Optional",
    duration: "Duration",
    servicesComma: "Services (comma-separated)",
    tagsComma: "Tags (comma-separated)",
    notesLabel: "Notes",
    createLead: "Create lead",
    backToList: "Back to leads",
    createProposal: "Create proposal",
    dateUnspecified: "Date unspecified",
    sourceLabel: "Source: {source}",
    confirmLost: "Confirm lost",
    noNotesYet: "No notes yet.",
    addNotePh: "Add a note…",
    addNote: "Add note",
    noActivity: "No activity",
    deleteTitle: "Delete this lead?",
    deleteConfirm: "This action cannot be undone. {name} will be removed from the pipeline.",
    deleteLead: "Delete lead",
    deleting: "Deleting…",
    convertTitle: "Convert to client",
    convertHint: "Choose whether {name} becomes a new client or links to an existing one.",
    convertDemo:
      "Converting leads to clients is only available for connected workspaces. Create an account to use this feature.",
    selectExisting: "Select the existing client.",
    convertFailed: "Conversion failed.",
    searchingMatches: "Searching for matches…",
    noMatches: "No existing clients found with this email or phone.",
    converting: "Converting…",
  },
  clients: {
    edit: "Edit client",
    createHint: "Add a new client to your records.",
    editHint: "Update this client's details.",
    country: "Country",
    tagsComma: "Tags (comma-separated)",
    createClient: "Create client",
    selectType: "Select type",
  },
  payments: {
    edit: "Edit payment",
    createHint: "Record a deposit, installment, or payment.",
    editHint: "Update this payment's details.",
    totalAmount: "Total amount",
    paidAmount: "Amount collected",
    overpayWarn:
      "Collected amount exceeds the total. Confirm this overpayment is intentional.",
    dueDate: "Due date",
    selectMethod: "Select method",
    noContract: "No contract",
    noProject: "No project",
    currencyLabel: "Currency",
    reference: "Reference",
    referencePh: "E.g. transfer 1234, invoice #45",
    proofUrl: "Payment proof link",
    createPayment: "Create payment",
    partial: "Partial payment",
    markPaid: "Mark paid",
    noDeadline: "No deadline",
    paidAt: "Paid at",
    proof: "Payment proof",
    partialTitle: "Partial payment",
    partialHint: "Update the collected amount for \"{label}\".",
    overTotal: "Amount exceeds the total. Confirm the overpayment.",
  },
  projects: {
    saveFailed: "The project could not be saved. Check the data and try again.",
    noPermissionEdit:
      "You don't have permission to edit this project. You can view the data, but saving is disabled.",
    titlePh: "Ana & Radu wedding",
    selectClient: "Select client",
    noClientsYet: "No clients available yet.",
    location: "Location",
    locationPh: "Regia Hall, Bucharest",
    teamComma: "Team (comma-separated)",
    createProject: "Create project",
    createShort: "Create",
    needAccountArchive: "Archiving projects requires a signed-in account.",
    needAccountRestore: "Restoring projects requires a signed-in account.",
    needAccountDelete: "Deleting projects requires a signed-in account.",
    backToList: "Back to projects",
    margin: "Margin",
    noDateSet: "No date set",
    team: "Team",
    noAssignees: "No one assigned yet.",
    archiveConfirm: "The project stays in history but will no longer appear in the active list.",
    archiving: "Archiving…",
    archiveProject: "Archive project",
    deleteTitle: "Delete this project?",
    deleteConfirm: "The project will be marked deleted and removed from the list. It can be restored later.",
    deleteProject: "Delete project",
    deleting: "Deleting…",
    restoring: "Restoring…",
  },
});

// ---- lead-form-dialog ----
patch("components/leads/lead-form-dialog.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    '{mode === "create" ? "Lead nou" : "Editează lead"}',
    '{mode === "create" ? t("modules.leads.new") : t("modules.leads.edit")}',
  ],
  [
    '? "Adaugă un lead nou în pipeline."\n              : "Actualizează detaliile acestui lead."}',
    '? t("modules.leads.createHint")\n              : t("modules.leads.editHint")}',
  ],
  [
    'placeholder="Selectează tipul"',
    'placeholder={t("modules.leads.selectType")}',
  ],
  ['>Oraș<', '>{t("common.city")}<'],
  [
    '>Locație eveniment<',
    '>{t("modules.leads.eventVenue")}<',
  ],
  [
    'placeholder="Sală, restaurant, locație"',
    'placeholder={t("modules.leads.venuePlaceholder")}',
  ],
  ['>Număr invitați<', '>{t("modules.leads.guestCount")}<'],
  ['placeholder="Opțional"', 'placeholder={t("modules.leads.optional")}'],
  ['>Durată<', '>{t("modules.leads.duration")}<'],
  ['>Valoare estimată<', '>{t("common.estimatedValue")}<'],
  ['>Monedă<', '>{t("common.currency")}<'],
  ['>Sursă<', '>{t("common.source")}<'],
  ['>Servicii (separate prin virgulă)<', '>{t("modules.leads.servicesComma")}<'],
  ['>Etichete (separate prin virgulă)<', '>{t("modules.leads.tagsComma")}<'],
  ['>Notițe<', '>{t("modules.leads.notesLabel")}<'],
  [
    `Anulează
`,
    `{t("common.cancel")}
`,
  ],
  [
    '? "Se salvează…"\n              : mode === "create"\n                ? "Creează lead"\n                : "Salvează modificările"}',
    '? t("common.saving")\n              : mode === "create"\n                ? t("modules.leads.createLead")\n                : t("common.saveChanges")}',
  ],
]);
ensureHook("components/leads/lead-form-dialog.tsx", "}: LeadFormDialogProps) {");

// ---- lead-detail ----
patch("components/leads/lead-detail.tsx", [
  ["Înapoi la leaduri", '{t("modules.leads.backToList")}'],
  [
    `Convertește
`,
    `{t("modules.leads.convert")}
`,
  ],
  [
    `Creează ofertă
`,
    `{t("modules.leads.createProposal")}
`,
  ],
  [
    `Editează
`,
    `{t("common.edit")}
`,
  ],
  [
    `Șterge
`,
    `{t("common.delete")}
`,
  ],
  [
    '{currentLead.eventDate ? formatDate(currentLead.eventDate) : "Dată nespecificată"}',
    '{currentLead.eventDate ? formatDate(currentLead.eventDate) : t("modules.leads.dateUnspecified")}',
  ],
  [
    "Sursă: {currentLead.source || \"—\"}",
    '{t("modules.leads.sourceLabel", { source: currentLead.source || "—" })}',
  ],
  [
    `Confirmă pierdut
`,
    `{t("modules.leads.confirmLost")}
`,
  ],
  [">Notițe<", '>{t("modules.leads.notesLabel")}<'],
  [">Nicio notă încă.<", '>{t("modules.leads.noNotesYet")}<'],
  [
    'placeholder="Adaugă o notă…"',
    'placeholder={t("modules.leads.addNotePh")}',
  ],
  [
    '{savingNote ? "Se salvează…" : "Adaugă notă"}',
    '{savingNote ? t("common.saving") : t("modules.leads.addNote")}',
  ],
  [
    'title="Fără activitate"',
    'title={t("modules.leads.noActivity")}',
  ],
  [">Ștergi acest lead?<", '>{t("modules.leads.deleteTitle")}<'],
  [
    "Această acțiune nu poate fi anulată. {currentLead.name} va fi eliminat din pipeline.",
    '{t("modules.leads.deleteConfirm", { name: currentLead.name })}',
  ],
  [
    '{deleting ? "Se șterge…" : "Șterge lead"}',
    '{deleting ? t("modules.leads.deleting") : t("modules.leads.deleteLead")}',
  ],
]);
ensureHook("components/leads/lead-detail.tsx", "}: LeadDetailProps) {");

// ---- convert-lead-dialog ----
patch("components/leads/convert-lead-dialog.tsx", [
  ['setError("Selectează clientul existent.");', 'setError(t("modules.leads.selectExisting"));'],
  [
    'setError(result?.error ?? "Conversia a eșuat.");',
    'setError(result?.error ?? t("modules.leads.convertFailed"));',
  ],
  [">Convertește în client<", '>{t("modules.leads.convertTitle")}<'],
  [
    "Alege dacă {lead.name} devine un client nou sau se leagă de unul existent.",
    '{t("modules.leads.convertHint", { name: lead.name })}',
  ],
  [
    `Conversia leadurilor în clienți este disponibilă doar pentru workspace-uri conectate.
          Creează-ți un cont pentru a folosi această funcție.`,
    `{t("modules.leads.convertDemo")}`,
  ],
  [
    `Închide
`,
    `{t("common.close")}
`,
  ],
  [">Se caută potriviri…<", '>{t("modules.leads.searchingMatches")}<'],
  [
    "Nu am găsit clienți existenți cu acest email sau telefon.",
    '{t("modules.leads.noMatches")}',
  ],
  [
    '{submitting ? "Se convertește…" : "Convertește"}',
    '{submitting ? t("modules.leads.converting") : t("modules.leads.convert")}',
  ],
]);
ensureHook("components/leads/convert-lead-dialog.tsx", "}: ConvertLeadDialogProps) {");

// ---- client-form-dialog ----
patch("components/clients/client-form-dialog.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    '{mode === "create" ? "Client nou" : "Editează client"}',
    '{mode === "create" ? t("modules.clients.new") : t("modules.clients.edit")}',
  ],
  [
    '? "Adaugă un client nou în evidență."\n              : "Actualizează detaliile acestui client."}',
    '? t("modules.clients.createHint")\n              : t("modules.clients.editHint")}',
  ],
  ['>Sursă<', '>{t("common.source")}<'],
  ['>Adresă<', '>{t("common.address")}<'],
  ['>Oraș<', '>{t("common.city")}<'],
  ['>Țară<', '>{t("modules.clients.country")}<'],
  [
    'placeholder="Selectează tipul"',
    'placeholder={t("modules.clients.selectType")}',
  ],
  ['>Etichete (separate prin virgulă)<', '>{t("modules.clients.tagsComma")}<'],
  ['>Notițe<', '>{t("modules.leads.notesLabel")}<'],
  [
    '? "Se salvează…"\n              : mode === "create"\n                ? "Creează client"\n                : "Salvează modificările"}',
    '? t("common.saving")\n              : mode === "create"\n                ? t("modules.clients.createClient")\n                : t("common.saveChanges")}',
  ],
]);
ensureHook("components/clients/client-form-dialog.tsx", "}: ClientFormDialogProps) {");

// ---- payment-form-dialog ----
patch("components/payments/payment-form-dialog.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    '{mode === "create" ? "Plată nouă" : "Editează plata"}',
    '{mode === "create" ? t("modules.payments.new") : t("modules.payments.edit")}',
  ],
  [
    '? "Înregistrează un avans, o tranșă sau o plată."\n              : "Actualizează detaliile acestei plăți."}',
    '? t("modules.payments.createHint")\n              : t("modules.payments.editHint")}',
  ],
  ['>Sumă totală<', '>{t("modules.payments.totalAmount")}<'],
  ['>Sumă încasată<', '>{t("modules.payments.paidAmount")}<'],
  [
    "Suma încasată depășește suma totală. Confirmă că este o suprasumă intenționată.",
    '{t("modules.payments.overpayWarn")}',
  ],
  ['>Termen scadență<', '>{t("modules.payments.dueDate")}<'],
  ['>Metodă<', '>{t("common.method")}<'],
  [
    'placeholder="Selectează metoda"',
    'placeholder={t("modules.payments.selectMethod")}',
  ],
  [
    'placeholder="Fără client"',
    'placeholder={t("common.noClient")}',
  ],
  ['>Valută<', '>{t("modules.payments.currencyLabel")}<'],
  [
    'placeholder="Fără contract"',
    'placeholder={t("modules.payments.noContract")}',
  ],
  [
    'placeholder="Fără proiect"',
    'placeholder={t("modules.payments.noProject")}',
  ],
  ['>Referință<', '>{t("modules.payments.reference")}<'],
  [
    'placeholder="Ex: OP 1234, factură #45"',
    'placeholder={t("modules.payments.referencePh")}',
  ],
  ['>Link dovadă plată<', '>{t("modules.payments.proofUrl")}<'],
  ['>Notițe<', '>{t("modules.leads.notesLabel")}<'],
  [
    '? "Se salvează…"\n              : mode === "create"\n                ? "Creează plată"\n                : "Salvează modificările"}',
    '? t("common.saving")\n              : mode === "create"\n                ? t("modules.payments.createPayment")\n                : t("common.saveChanges")}',
  ],
]);
ensureHook("components/payments/payment-form-dialog.tsx", "}: PaymentFormDialogProps) {");

// ---- payment-detail ----
patch("components/payments/payment-detail.tsx", [
  [
    "if (!window.confirm(`Ștergi plata „${payment.label}”?`)) return;",
    'if (!window.confirm(t("modules.payments.deleteConfirm", { label: payment.label }))) return;',
  ],
  [
    `Plată parțială
`,
    `{t("modules.payments.partial")}
`,
  ],
  [
    `Marchează plătit
`,
    `{t("modules.payments.markPaid")}
`,
  ],
  [">Scadență<", '>{t("common.dueDate")}<'],
  [
    '{payment.dueDate ? formatDate(payment.dueDate) : "Fără termen"}',
    '{payment.dueDate ? formatDate(payment.dueDate) : t("modules.payments.noDeadline")}',
  ],
  [">Metodă<", '>{t("common.method")}<'],
  [">Referință<", '>{t("modules.payments.reference")}<'],
  [">Plătit la<", '>{t("modules.payments.paidAt")}<'],
  [">Dovadă plată<", '>{t("modules.payments.proof")}<'],
  [">Notițe<", '>{t("modules.leads.notesLabel")}<'],
  [">Plată parțială<", '>{t("modules.payments.partialTitle")}<'],
  [
    "Actualizează suma încasată pentru „{payment.label}”.",
    '{t("modules.payments.partialHint", { label: payment.label })}',
  ],
  [">Sumă încasată<", '>{t("modules.payments.paidAmount")}<'],
  [
    "Suma depășește totalul. Confirmă suprasuma.",
    '{t("modules.payments.overTotal")}',
  ],
  [
    '{pending ? "Se salvează…" : "Salvează"}',
    '{pending ? t("common.saving") : t("common.save")}',
  ],
]);
ensureHook("components/payments/payment-detail.tsx", "}: PaymentDetailProps) {");

// ---- project-form ----
patch("components/projects/project-form.tsx", [
  ['setFormError("Verifică datele completate.");', 'setFormError(t("common.verifyData"));'],
  [
    'const message = result?.error || "Proiectul nu a putut fi salvat. Verifică datele și încearcă din nou.";',
    'const message = result?.error || t("modules.projects.saveFailed");',
  ],
  [
    'const message = "Proiectul nu a putut fi salvat. Verifică datele și încearcă din nou.";',
    'const message = t("modules.projects.saveFailed");',
  ],
  [
    "Nu ai permisiunea de a edita acest proiect. Poți vizualiza datele, dar salvarea este dezactivată.",
    '{t("modules.projects.noPermissionEdit")}',
  ],
  [
    'placeholder="Nuntă Ana & Radu"',
    'placeholder={t("modules.projects.titlePh")}',
  ],
  [
    'placeholder="Selectează clientul"',
    'placeholder={t("modules.projects.selectClient")}',
  ],
  [
    ">Niciun client disponibil încă.<",
    '>{t("modules.projects.noClientsYet")}<',
  ],
  [">Locație<", '>{t("modules.projects.location")}<'],
  [
    'placeholder="Sala Regia, București"',
    'placeholder={t("modules.projects.locationPh")}',
  ],
  [">Echipă (separată prin virgulă)<", '>{t("modules.projects.teamComma")}<'],
  [">Monedă<", '>{t("common.currency")}<'],
  [">Notițe<", '>{t("modules.leads.notesLabel")}<'],
  [
    '{submitting ? "Se salvează…" : mode === "create" ? "Creează proiect" : "Salvează modificările"}',
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.projects.createProject") : t("common.saveChanges")}',
  ],
  [
    '{submitting ? "Se salvează…" : mode === "create" ? "Creează" : "Salvează"}',
    '{submitting ? t("common.saving") : mode === "create" ? t("modules.projects.createShort") : t("common.save")}',
  ],
]);
ensureHook("components/projects/project-form.tsx", "}: ProjectFormProps) {");

// ---- project-detail ----
patch("components/projects/project-detail.tsx", [
  [
    'if (!requireLive("Arhivarea proiectelor necesită un cont conectat.")) {',
    'if (!requireLive(t("modules.projects.needAccountArchive"))) {',
  ],
  [
    'if (!requireLive("Restaurarea proiectelor necesită un cont conectat.")) return;',
    'if (!requireLive(t("modules.projects.needAccountRestore"))) return;',
  ],
  [
    'if (!requireLive("Ștergerea proiectelor necesită un cont conectat.")) {',
    'if (!requireLive(t("modules.projects.needAccountDelete"))) {',
  ],
  ["Înapoi la proiecte", '{t("modules.projects.backToList")}'],
  [
    'project.clientName ?? "Fără client"',
    'project.clientName ?? t("common.noClient")',
  ],
  [">Marjă<", '>{t("modules.projects.margin")}<'],
  [
    '{project.eventDate ? formatDate(project.eventDate) : "Fără dată setată"}',
    '{project.eventDate ? formatDate(project.eventDate) : t("modules.projects.noDateSet")}',
  ],
  [">Echipă<", '>{t("modules.projects.team")}<'],
  [
    ">Nicio persoană asignată încă.<",
    '>{t("modules.projects.noAssignees")}<',
  ],
  [">Notițe<", '>{t("modules.leads.notesLabel")}<'],
  [
    "Proiectul rămâne disponibil în istoric, dar nu va mai apărea în lista activă.",
    '{t("modules.projects.archiveConfirm")}',
  ],
  [
    '{archiving ? "Se arhivează…" : "Arhivează proiect"}',
    '{archiving ? t("modules.projects.archiving") : t("modules.projects.archiveProject")}',
  ],
  [">Ștergi acest proiect?<", '>{t("modules.projects.deleteTitle")}<'],
  [
    "Proiectul va fi marcat ca șters și eliminat din listă. Poate fi restaurat ulterior.",
    '{t("modules.projects.deleteConfirm")}',
  ],
  [
    '{deleting ? "Se șterge…" : "Șterge proiect"}',
    '{deleting ? t("modules.projects.deleting") : t("modules.projects.deleteProject")}',
  ],
  [
    '{restoring ? "Se restaurează…" : "Restaurează"}',
    '{restoring ? t("modules.projects.restoring") : t("common.restore")}',
  ],
]);
ensureHook("components/projects/project-detail.tsx", "}: ProjectDetailProps) {");

console.log("CRM batch done");
