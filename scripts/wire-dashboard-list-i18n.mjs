/**
 * Wire high-visibility dashboard list/board strings to t().
 * Safe, explicit replacements only — no regex over unknown content.
 */
import fs from "node:fs";

function patch(file, replacements) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of replacements) {
    if (!text.includes(from)) continue;
    const count = text.split(from).length - 1;
    text = text.split(from).join(to);
    n += count;
  }
  fs.writeFileSync(file, text);
  console.log(`${file}: ${n} replacements`);
}

patch("components/leads/leads-board.tsx", [
  ['{ value: "list", label: "Listă", icon: List }', '{ value: "list", label: t("common.list"), icon: List }'],
  ["Căutare leaduri", '{t("modules.leads.searchSr")}'],
  ['placeholder="Caută după nume, email, oraș…"', 'placeholder={t("modules.leads.searchPlaceholder")}'],
  [">Oraș<", '>{t("common.city")}<'],
  [">Sursă<", '>{t("common.source")}<'],
  [">Valoare estimată<", '>{t("common.estimatedValue")}<'],
  ["Fără leaduri", '{t("modules.leads.emptyColumn")}'],
]);

// Fix sr-only that may have broken: <span className="sr-only">{t("modules.leads.searchSr")}</span>
patch("components/leads/leads-board.tsx", [
  ['<span className="sr-only">{t("modules.leads.searchSr")}</span>', '<span className="sr-only">{t("modules.leads.searchSr")}</span>'],
]);

patch("components/clients/clients-page-client.tsx", [
  ['toast("Creează-ți un cont pentru a adăuga clienți reali.", "info")', 'toast(t("common.needAccountAction"), "info")'],
  ["Căutare clienți", '{t("modules.clients.searchSr")}'],
  ['placeholder="Caută după nume, email, oraș…"', 'placeholder={t("modules.clients.searchPlaceholder")}'],
]);

patch("components/contracts/contracts-list.tsx", [
  ['requireLive("Publicarea contractelor necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountPublish"))'],
  ['requireLive("Anularea contractelor necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountCancel"))'],
  ['requireLive("Duplicarea contractelor necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountDuplicate"))'],
  ['requireLive("Versiunea nouă necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountVersion"))'],
  ['toast(result?.success ?? "Versiune nouă creată.", "success")', 'toast(result?.success ?? t("modules.contracts.versionCreated"), "success")'],
  ['toast("Link copiat în clipboard.", "success")', 'toast(t("common.linkCopied"), "success")'],
  ['requireLive("Crearea contractelor necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountCreate"))'],
  ['requireLive("Ștergerea contractelor necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountDelete"))'],
  [
    "`Ștergi draftul „${contract.title}”? Contractul acceptat nu poate fi șters destructiv.`",
    't("modules.contracts.deleteDraftConfirm", { title: contract.title })',
  ],
  ['toast(result?.success ?? "Contract șters.", "success")', 'toast(result?.success ?? t("modules.contracts.deleted"), "success")'],
  ['requireLive("Arhivarea contractelor necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountArchive"))'],
  ['requireLive("Portalul client necesită un cont conectat.")', 'requireLive(t("modules.contracts.needAccountPortal"))'],
  ['toast("Link portal copiat în clipboard.", "success")', 'toast(t("modules.contracts.portalLinkCopied"), "success")'],
  ["Căutare contracte", '{t("modules.contracts.searchSr")}'],
  ['placeholder="Caută după titlu, număr sau client…"', 'placeholder={t("modules.contracts.searchPlaceholder")}'],
  ['{busyId === "new" ? "Se creează…" : "Contract nou"}', '{busyId === "new" ? t("common.creating") : t("modules.contracts.new")}'],
  ['placeholder="Toți clienții"', 'placeholder={t("common.allClients")}'],
  [">Toți clienții<", '>{t("common.allClients")}<'],
  ['aria-label="Eveniment până la"', 'aria-label={t("modules.contracts.eventUntil")}'],
  [
    'title={initialContracts.length === 0 ? "Niciun contract" : "Niciun contract găsit"}',
    'title={initialContracts.length === 0 ? t("modules.contracts.empty") : t("modules.contracts.emptyFiltered")}',
  ],
  [
    '? "Creează un contract manual sau generează-l dintr-o ofertă acceptată."',
    '? t("modules.contracts.emptyHint")',
  ],
  [
    ': "Încearcă alți termeni de căutare sau alți filtre."',
    ': t("common.searchNoResultsHint")',
  ],
  [">Număr<", '>{t("common.number")}<'],
  [">Acțiuni<", '>{t("common.actions")}<'],
  ['aria-label="Mai multe acțiuni"', 'aria-label={t("common.moreActions")}'],
  ["Editează draft", '{t("modules.contracts.editDraft")}'],
  [">Publică<", '>{t("modules.contracts.publish")}<'],
  ["Copiază link", '{t("common.copyLink")}'],
  [">Duplică<", '>{t("common.duplicate")}<'],
  [">Anulează<", '>{t("common.cancel")}<'],
  ["Versiune nouă", '{t("modules.contracts.newVersion")}'],
  [">Arhivează<", '>{t("common.archive")}<'],
  [">Șterge<", '>{t("common.delete")}<'],
  [
    "Clientul va primi un link public pentru vizualizare și acceptare digitală. Contractul\n              nu va mai putea fi editat liber după publicare.",
    '{t("modules.contracts.publishConfirm")}',
  ],
  [">Renunță<", '>{t("common.dismiss")}<'],
  ['{busyId ? "Se publică…" : "Publică contract"}', '{busyId ? t("common.publishing") : t("modules.contracts.publishContract")}'],
  [
    "Contractul va fi marcat drept anulat și nu va mai putea fi acceptat de client.",
    '{t("modules.contracts.cancelConfirm")}',
  ],
  ['{busyId ? "Se anulează…" : "Anulează contract"}', '{busyId ? t("common.cancelling") : t("modules.contracts.cancelContract")}'],
]);

patch("components/payments/payments-list.tsx", [
  [
    'toast(result.error ?? "Nu am putut marca plata ca încasată.", "error")',
    'toast(result.error ?? t("modules.payments.markPaidFailed"), "error")',
  ],
  ['toast(result.success ?? "Plată încasată.", "success")', 'toast(result.success ?? t("modules.payments.markedPaid"), "success")'],
  [
    "`Ștergi plata „${payment.label}”?`",
    't("modules.payments.deleteConfirm", { label: payment.label })',
  ],
  ['toast(result.success ?? "Plată ștearsă.", "success")', 'toast(result.success ?? t("modules.payments.deleted"), "success")'],
  [">Plată nouă<", '>{t("modules.payments.new")}<'],
  ['label="Total încasat"', 'label={t("modules.payments.totalCollected")}'],
  ['label="Total de încasat"', 'label={t("modules.payments.totalOutstanding")}'],
  ['hint="Sume rămase de colectat"', 'hint={t("modules.payments.outstandingHint")}'],
  ["`${overdueCount} plăți întârziate`", 't("modules.payments.overdueHint", { count: overdueCount })'],
  ["Căutare plăți", '{t("modules.payments.searchSr")}'],
  ['placeholder="Caută după denumire, referință, client…"', 'placeholder={t("modules.payments.searchPlaceholder")}'],
  [
    'title={payments.length === 0 ? "Nicio plată" : "Nicio plată găsită"}',
    'title={payments.length === 0 ? t("modules.payments.empty") : t("modules.payments.emptyFiltered")}',
  ],
  ['? "Nu există plăți înregistrate."', '? t("modules.payments.emptyHint")'],
  [
    ': "Încearcă alți termeni de căutare sau alt filtru de status."',
    ': t("common.searchNoResultsHint")',
  ],
  [">Sumă<", '>{t("common.amount")}<'],
  [">Încasat<", '>{t("common.collected")}<'],
  [">Scadență<", '>{t("common.dueDate")}<'],
  [">Metodă<", '>{t("common.method")}<'],
  [">Acțiuni<", '>{t("common.actions")}<'],
  [">Încasează<", '>{t("modules.payments.markPaid")}<'],
  [
    "aria-label={`Șterge plata ${payment.label}`}",
    'aria-label={t("modules.payments.deleteAria", { label: payment.label })}',
  ],
]);

patch("components/projects/projects-list.tsx", [
  [
    "Ai acces doar de vizualizare la proiecte în acest workspace.",
    '{t("modules.projects.viewOnly")}',
  ],
  ["Căutare proiecte", '{t("modules.projects.searchSr")}'],
  [
    'placeholder="Caută după nume proiect sau client…"',
    'placeholder={t("modules.projects.searchPlaceholder")}',
  ],
  [
    'title={initialProjects.length === 0 ? "Niciun proiect" : "Niciun proiect găsit"}',
    'title={initialProjects.length === 0 ? t("modules.projects.empty") : t("modules.projects.emptyFiltered")}',
  ],
  [
    '? "Proiectele apar automat după acceptarea unui contract sau pot fi create manual."',
    '? t("modules.projects.emptyHint")',
  ],
  [
    ': "Încearcă alți termeni de căutare sau alt filtru de status."',
    ': t("common.searchNoResultsHint")',
  ],
  ["project.clientName ?? \"Fără client\"", 'project.clientName ?? t("common.noClient")'],
  [
    "project.eventDate ? formatDate(project.eventDate) : \"Fără dată eveniment\"",
    "project.eventDate ? formatDate(project.eventDate) : t(\"modules.projects.noEventDate\")",
  ],
]);

patch("components/tasks/tasks-board.tsx", [
  ['{ id: "overdue", label: "Întârziate" }', '{ id: "overdue", label: t("modules.tasks.overdue") }'],
  ['{ id: "dueToday", label: "Astăzi" }', '{ id: "dueToday", label: t("modules.tasks.dueToday") }'],
  [
    "`Ștergi task-ul „${task.title}”?`",
    't("modules.tasks.deleteConfirm", { title: task.title })',
  ],
  ['toast(result.success ?? "Task șters.", "success")', 'toast(result.success ?? t("modules.tasks.deleted"), "success")'],
  ["Căutare task-uri", '{t("modules.tasks.searchSr")}'],
  [
    'placeholder="Caută după titlu, notițe, responsabil…"',
    'placeholder={t("modules.tasks.searchPlaceholder")}',
  ],
  [
    'title={tasks.length === 0 ? "Niciun task" : "Niciun task găsit"}',
    'title={tasks.length === 0 ? t("modules.tasks.empty") : t("modules.tasks.emptyFiltered")}',
  ],
  ['? "Adaugă primul task pentru echipa ta."', '? t("modules.tasks.emptyHint")'],
  [
    ': "Încearcă alți termeni de căutare sau alt filtru."',
    ': t("common.searchNoResultsHint")',
  ],
  [
    "aria-label={`Marchează „${task.title}” ca finalizat`}",
    'aria-label={t("modules.tasks.markDoneAria", { title: task.title })}',
  ],
  [">Fără termen<", '>{t("modules.tasks.noDueDate")}<'],
  [">Editează<", '>{t("common.edit")}<'],
  [
    "aria-label={`Șterge task-ul ${task.title}`}",
    'aria-label={t("modules.tasks.deleteAria", { title: task.title })}',
  ],
]);

patch("components/calendar/calendar-board.tsx", [
  ['{ value: "month", label: "Lună" }', '{ value: "month", label: t("common.month") }'],
  ['{ value: "week", label: "Săptămână" }', '{ value: "week", label: t("common.week") }'],
  ['{ value: "list", label: "Listă" }', '{ value: "list", label: t("common.list") }'],
  [
    'toast("Nu ai permisiunea de a adăuga evenimente.", "info")',
    'toast(t("modules.calendar.needWriteAdd"), "info")',
  ],
  [
    'toast("Nu ai permisiunea de a șterge evenimente.", "info")',
    'toast(t("modules.calendar.needWriteDelete"), "info")',
  ],
  [
    "`Sigur vrei să ștergi evenimentul „${eventItem.title}”?`",
    't("modules.calendar.deleteConfirm", { title: eventItem.title })',
  ],
  [
    'toast(result?.success ?? "Eveniment șters.", "success")',
    'toast(result?.success ?? t("modules.calendar.deleted"), "success")',
  ],
  ["Căutare evenimente", '{t("modules.calendar.searchSr")}'],
  [
    'placeholder="Caută după titlu, locație…"',
    'placeholder={t("modules.calendar.searchPlaceholder")}',
  ],
  ["Perioada precedentă", '{t("modules.calendar.prevPeriod")}'],
  [">Astăzi<", '>{t("common.today")}<'],
  ["Perioada următoare", '{t("modules.calendar.nextPeriod")}'],
  [">Fără evenimente<", '>{t("modules.calendar.noEvents")}<'],
  ['event.allDay ? "Toată ziua"', 'event.allDay ? t("modules.calendar.allDay")'],
  ['? "Toată ziua"', '? t("modules.calendar.allDay")'],
  [
    'aria-label="Reprogramează o zi mai devreme"',
    'aria-label={t("modules.calendar.rescheduleEarlier")}',
  ],
  [
    'aria-label="Reprogramează o zi mai târziu"',
    'aria-label={t("modules.calendar.rescheduleLater")}',
  ],
  ['aria-label="Șterge evenimentul"', 'aria-label={t("modules.calendar.deleteAria")}'],
]);

patch("components/templates/templates-list.tsx", [
  [
    "`Ștergi template-ul „${template.name}”? Această acțiune nu poate fi anulată.`",
    't("modules.templates.deleteConfirm", { name: template.name })',
  ],
  ["Căutare template-uri", '{t("modules.templates.searchSr")}'],
  [
    'placeholder="Caută după nume sau categorie…"',
    'placeholder={t("modules.templates.searchPlaceholder")}',
  ],
  [
    '{showArchived ? "Se văd arhivate" : "Vezi arhivate"}',
    '{showArchived ? t("modules.templates.hidingArchived") : t("modules.templates.showArchived")}',
  ],
  [
    'title={showArchived ? "Nimic în arhivă" : "Niciun template încă"}',
    'title={showArchived ? t("modules.templates.emptyArchive") : t("modules.templates.empty")}',
  ],
  [
    ': "Creează primul template pentru oferte, contracte, emailuri sau alte fluxuri."',
    ': t("modules.templates.emptyHint")',
  ],
  [">Editează<", '>{t("common.edit")}<'],
  ["Setează implicit", '{t("modules.templates.setDefault")}'],
  [">Duplică<", '>{t("common.duplicate")}<'],
  ["Restaurează din arhivă", '{t("modules.templates.restoreArchive")}'],
  [">Arhivează<", '>{t("common.archive")}<'],
  [">Șterge<", '>{t("common.delete")}<'],
]);

patch("components/automations/automations-list-client.tsx", [
  [
    'toast(result.success ?? "Automatizare duplicată.", "success")',
    'toast(result.success ?? t("modules.automations.duplicated"), "success")',
  ],
  [
    'if (!window.confirm("Ștergi această automatizare?")) return;',
    'if (!window.confirm(t("modules.automations.deleteConfirm"))) return;',
  ],
  [
    'toast(result.success ?? "Automatizare ștearsă.", "success")',
    'toast(result.success ?? t("modules.automations.deleted"), "success")',
  ],
  [">Automatizare nouă<", '>{t("modules.automations.new")}<'],
  ["Declanșator:", '{t("modules.automations.trigger")}:'],
  [
    "label={`Comută automatizarea ${automation.name}`}",
    'label={t("modules.automations.toggleAria", { name: automation.name })}',
  ],
  [
    'automation.channel === "email" ? "Email" : "Notificare internă"',
    'automation.channel === "email" ? t("modules.automations.channelEmail") : t("modules.automations.channelInternal")',
  ],
  [
    'label={automation.enabled ? "Activă" : "Dezactivată"}',
    'label={automation.enabled ? t("modules.automations.enabled") : t("modules.automations.disabled")}',
  ],
  [': "Nu a rulat încă"', ': t("modules.automations.neverRanShort")'],
  [
    "` · ${automation.successCount} succes / ${automation.failedCount} eșec`",
    't("modules.automations.runStats", { success: automation.successCount, failed: automation.failedCount })',
  ],
  [">Editează<", '>{t("common.edit")}<'],
  [">Duplică<", '>{t("common.duplicate")}<'],
  [">Șterge<", '>{t("common.delete")}<'],
]);

patch("components/team/team-page-client.tsx", [
  [
    '`Confirmă transferul de proprietate: „${member.fullName ?? "acest membru"}” va deveni owner.`',
    't("modules.team.transferConfirm", { name: member.fullName ?? t("modules.team.thisMember") })',
  ],
  [
    'toast(result?.error ?? "Nu am putut retrimite invitația.", "error")',
    'toast(result?.error ?? t("modules.team.resendFailed"), "error")',
  ],
  [
    'toast(result.success ?? "Invitație retrimisă.", "success")',
    'toast(result.success ?? t("modules.team.resent"), "success")',
  ],
  [
    'toast("Link nou copiat în clipboard.", "success")',
    'toast(t("modules.team.newLinkCopied"), "success")',
  ],
  [
    "`Revoci invitația trimisă către ${invitation.email}?`",
    't("modules.team.revokeConfirm", { email: invitation.email })',
  ],
  [
    'member.fullName ?? "Membru fără profil"',
    'member.fullName ?? t("modules.team.memberNoProfile")',
  ],
  [">Reactivează<", '>{t("modules.team.reactivate")}<'],
  [">Dezactivează<", '>{t("modules.team.deactivate")}<'],
  ["Elimină din workspace", '{t("modules.team.removeFromWorkspace")}'],
  [
    "Invitații în curs ({invitations.length})",
    '{t("modules.team.pendingInvites", { count: invitations.length })}',
  ],
  ["Nicio invitație în curs.", '{t("modules.team.noPendingInvites")}'],
  ['aria-label="Revocă invitația"', 'aria-label={t("modules.team.revokeAria")}'],
]);

console.log("done");
