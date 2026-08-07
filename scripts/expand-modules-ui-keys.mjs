import fs from "node:fs";

function expand(loc) {
  const p = `messages/${loc}/modules.json`;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const ro = loc === "ro";

  Object.assign(j.leads, {
    searchSr: ro ? "Căutare leaduri" : "Search leads",
    searchPlaceholder: ro ? "Caută după nume, email, oraș…" : "Search by name, email, city…",
    emptyColumn: ro ? "Fără leaduri" : "No leads",
  });
  Object.assign(j.clients, {
    searchSr: ro ? "Căutare clienți" : "Search clients",
    searchPlaceholder: ro ? "Caută după nume, email, oraș…" : "Search by name, email, city…",
  });
  Object.assign(j.proposals, {
    searchSr: ro ? "Căutare oferte" : "Search proposals",
    searchPlaceholder: ro ? "Caută după titlu sau client…" : "Search by title or client…",
    emptyFiltered: ro ? "Nicio ofertă găsită" : "No proposals found",
  });
  Object.assign(j.contracts, {
    searchSr: ro ? "Căutare contracte" : "Search contracts",
    searchPlaceholder: ro
      ? "Caută după titlu, număr sau client…"
      : "Search by title, number, or client…",
    emptyFiltered: ro ? "Niciun contract găsit" : "No contracts found",
    emptyHint: ro
      ? "Creează un contract manual sau generează-l dintr-o ofertă acceptată."
      : "Create a contract manually or generate it from an accepted proposal.",
    editDraft: ro ? "Editează draft" : "Edit draft",
    publish: ro ? "Publică" : "Publish",
    publishContract: ro ? "Publică contract" : "Publish contract",
    publishConfirm: ro
      ? "Clientul va primi un link public pentru vizualizare și acceptare digitală. Contractul nu va mai putea fi editat liber după publicare."
      : "The client will get a public link to view and accept digitally. The contract can no longer be freely edited after publishing.",
    cancelContract: ro ? "Anulează contract" : "Cancel contract",
    cancelConfirm: ro
      ? "Contractul va fi marcat drept anulat și nu va mai putea fi acceptat de client."
      : "The contract will be marked as cancelled and can no longer be accepted by the client.",
    newVersion: ro ? "Versiune nouă" : "New version",
    versionCreated: ro ? "Versiune nouă creată." : "New version created.",
    deleted: ro ? "Contract șters." : "Contract deleted.",
    deleteDraftConfirm: ro
      ? "Ștergi draftul „{title}”? Contractul acceptat nu poate fi șters destructiv."
      : 'Delete draft "{title}"? An accepted contract cannot be destructively deleted.',
    eventUntil: ro ? "Eveniment până la" : "Event until",
    portalLinkCopied: ro ? "Link portal copiat în clipboard." : "Portal link copied to clipboard.",
    needAccountPublish: ro
      ? "Publicarea contractelor necesită un cont conectat."
      : "Publishing contracts requires a signed-in account.",
    needAccountCancel: ro
      ? "Anularea contractelor necesită un cont conectat."
      : "Cancelling contracts requires a signed-in account.",
    needAccountDuplicate: ro
      ? "Duplicarea contractelor necesită un cont conectat."
      : "Duplicating contracts requires a signed-in account.",
    needAccountVersion: ro
      ? "Versiunea nouă necesită un cont conectat."
      : "Creating a new version requires a signed-in account.",
    needAccountCreate: ro
      ? "Crearea contractelor necesită un cont conectat."
      : "Creating contracts requires a signed-in account.",
    needAccountDelete: ro
      ? "Ștergerea contractelor necesită un cont conectat."
      : "Deleting contracts requires a signed-in account.",
    needAccountArchive: ro
      ? "Arhivarea contractelor necesită un cont conectat."
      : "Archiving contracts requires a signed-in account.",
    needAccountPortal: ro
      ? "Portalul client necesită un cont conectat."
      : "The client portal requires a signed-in account.",
  });
  Object.assign(j.payments, {
    searchSr: ro ? "Căutare plăți" : "Search payments",
    searchPlaceholder: ro
      ? "Caută după denumire, referință, client…"
      : "Search by label, reference, or client…",
    emptyFiltered: ro ? "Nicio plată găsită" : "No payments found",
    emptyHint: ro ? "Nu există plăți înregistrate." : "No payments recorded yet.",
    totalCollected: ro ? "Total încasat" : "Total collected",
    totalOutstanding: ro ? "Total de încasat" : "Total outstanding",
    outstandingHint: ro ? "Sume rămase de colectat" : "Amounts left to collect",
    overdueHint: ro ? "{count} plăți întârziate" : "{count} overdue payments",
    markPaid: ro ? "Încasează" : "Collect",
    markedPaid: ro ? "Plată încasată." : "Payment collected.",
    markPaidFailed: ro
      ? "Nu am putut marca plata ca încasată."
      : "Could not mark the payment as collected.",
    deleted: ro ? "Plată ștearsă." : "Payment deleted.",
    deleteConfirm: ro ? "Ștergi plata „{label}”?" : 'Delete payment "{label}"?',
    deleteAria: ro ? "Șterge plata {label}" : "Delete payment {label}",
  });
  Object.assign(j.projects, {
    searchSr: ro ? "Căutare proiecte" : "Search projects",
    searchPlaceholder: ro
      ? "Caută după nume proiect sau client…"
      : "Search by project name or client…",
    emptyFiltered: ro ? "Niciun proiect găsit" : "No projects found",
    emptyHint: ro
      ? "Proiectele apar automat după acceptarea unui contract sau pot fi create manual."
      : "Projects appear after a contract is accepted or can be created manually.",
    noEventDate: ro ? "Fără dată eveniment" : "No event date",
    viewOnly: ro
      ? "Ai acces doar de vizualizare la proiecte în acest workspace."
      : "You have view-only access to projects in this workspace.",
  });
  Object.assign(j.tasks, {
    searchSr: ro ? "Căutare task-uri" : "Search tasks",
    searchPlaceholder: ro
      ? "Caută după titlu, notițe, responsabil…"
      : "Search by title, notes, or assignee…",
    emptyFiltered: ro ? "Niciun task găsit" : "No tasks found",
    emptyHint: ro ? "Adaugă primul task pentru echipa ta." : "Add the first task for your team.",
    overdue: ro ? "Întârziate" : "Overdue",
    dueToday: ro ? "Astăzi" : "Today",
    noDueDate: ro ? "Fără termen" : "No due date",
    deleted: ro ? "Task șters." : "Task deleted.",
    deleteConfirm: ro ? "Ștergi task-ul „{title}”?" : 'Delete task "{title}"?',
    markDoneAria: ro ? "Marchează „{title}” ca finalizat" : 'Mark "{title}" as done',
    deleteAria: ro ? "Șterge task-ul {title}" : "Delete task {title}",
  });
  Object.assign(j.calendar, {
    searchSr: ro ? "Căutare evenimente" : "Search events",
    searchPlaceholder: ro ? "Caută după titlu, locație…" : "Search by title or location…",
    prevPeriod: ro ? "Perioada precedentă" : "Previous period",
    nextPeriod: ro ? "Perioada următoare" : "Next period",
    noEvents: ro ? "Fără evenimente" : "No events",
    allDay: ro ? "Toată ziua" : "All day",
    deleted: ro ? "Eveniment șters." : "Event deleted.",
    deleteConfirm: ro
      ? "Sigur vrei să ștergi evenimentul „{title}”?"
      : 'Are you sure you want to delete event "{title}"?',
    needWriteAdd: ro
      ? "Nu ai permisiunea de a adăuga evenimente."
      : "You do not have permission to add events.",
    needWriteDelete: ro
      ? "Nu ai permisiunea de a șterge evenimente."
      : "You do not have permission to delete events.",
    rescheduleEarlier: ro ? "Reprogramează o zi mai devreme" : "Reschedule one day earlier",
    rescheduleLater: ro ? "Reprogramează o zi mai târziu" : "Reschedule one day later",
    deleteAria: ro ? "Șterge evenimentul" : "Delete event",
  });
  Object.assign(j.templates, {
    searchSr: ro ? "Căutare template-uri" : "Search templates",
    searchPlaceholder: ro ? "Caută după nume sau categorie…" : "Search by name or category…",
    empty: ro ? "Niciun template încă" : "No templates yet",
    emptyArchive: ro ? "Nimic în arhivă" : "Nothing in archive",
    emptyHint: ro
      ? "Creează primul template pentru oferte, contracte, emailuri sau alte fluxuri."
      : "Create the first template for proposals, contracts, emails, or other flows.",
    showArchived: ro ? "Vezi arhivate" : "Show archived",
    hidingArchived: ro ? "Se văd arhivate" : "Showing archived",
    setDefault: ro ? "Setează implicit" : "Set as default",
    restoreArchive: ro ? "Restaurează din arhivă" : "Restore from archive",
    deleteConfirm: ro
      ? "Ștergi template-ul „{name}”? Această acțiune nu poate fi anulată."
      : 'Delete template "{name}"? This cannot be undone.',
  });
  Object.assign(j.automations, {
    duplicated: ro ? "Automatizare duplicată." : "Automation duplicated.",
    deleted: ro ? "Automatizare ștearsă." : "Automation deleted.",
    deleteConfirm: ro ? "Ștergi această automatizare?" : "Delete this automation?",
    trigger: ro ? "Declanșator" : "Trigger",
    channelEmail: "Email",
    channelInternal: ro ? "Notificare internă" : "Internal notification",
    enabled: ro ? "Activă" : "Enabled",
    disabled: ro ? "Dezactivată" : "Disabled",
    neverRanShort: ro ? "Nu a rulat încă" : "Has not run yet",
    runStats: ro
      ? " · {success} succes / {failed} eșec"
      : " · {success} success / {failed} failed",
    toggleAria: ro ? "Comută automatizarea {name}" : "Toggle automation {name}",
  });
  Object.assign(j.team, {
    pendingInvites: ro ? "Invitații în curs ({count})" : "Pending invitations ({count})",
    noPendingInvites: ro ? "Nicio invitație în curs." : "No pending invitations.",
    memberNoProfile: ro ? "Membru fără profil" : "Member without profile",
    memberFallback: ro ? "Membru echipă" : "Team member",
    reactivate: ro ? "Reactivează" : "Reactivate",
    deactivate: ro ? "Dezactivează" : "Deactivate",
    removeFromWorkspace: ro ? "Elimină din workspace" : "Remove from workspace",
    transferConfirm: ro
      ? "Confirmă transferul de proprietate: „{name}” va deveni owner."
      : 'Confirm ownership transfer: "{name}" will become owner.',
    thisMember: ro ? "acest membru" : "this member",
    resendFailed: ro ? "Nu am putut retrimite invitația." : "Could not resend the invitation.",
    resent: ro ? "Invitație retrimisă." : "Invitation resent.",
    newLinkCopied: ro ? "Link nou copiat în clipboard." : "New link copied to clipboard.",
    revokeConfirm: ro
      ? "Revoci invitația trimisă către {email}?"
      : "Revoke the invitation sent to {email}?",
    revokeAria: ro ? "Revocă invitația" : "Revoke invitation",
    sentExpires: ro
      ? "trimisă {sent} · expiră {expires}"
      : "sent {sent} · expires {expires}",
    descriptionMember: ro
      ? "Rol, status și volum de lucru curent."
      : "Role, status, and current workload.",
  });

  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("modules", loc, "ok");
}

expand("ro");
expand("en");
