/**
 * Wire settings-page-client and proposals-list remaining RO strings to t().
 */
import fs from "node:fs";

function patch(file, reps) {
  let text = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of reps) {
    if (!text.includes(from)) continue;
    const c = text.split(from).length - 1;
    text = text.split(from).join(to);
    n += c;
  }
  fs.writeFileSync(file, text);
  console.log(file, n);
}

// Expand modules.proposals keys
for (const loc of ["ro", "en"]) {
  const p = `messages/${loc}/modules.json`;
  const m = JSON.parse(fs.readFileSync(p, "utf8"));
  Object.assign(
    m.proposals,
    loc === "ro"
      ? {
          searchSr: "Căutare oferte",
          searchPlaceholder: "Caută după titlu, număr sau client…",
          emptyFiltered: "Nicio ofertă găsită",
          emptyHint: "Creează prima ofertă pentru un lead sau client.",
          clientOrLead: "Client / Lead",
          validUntil: "Valabilă până la",
        }
      : {
          searchSr: "Search proposals",
          searchPlaceholder: "Search by title, number, or client…",
          emptyFiltered: "No proposals found",
          emptyHint: "Create the first proposal for a lead or client.",
          clientOrLead: "Client / Lead",
          validUntil: "Valid until",
        },
  );
  fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
}

patch("components/proposals/proposals-list.tsx", [
  [">Ofertă nouă<", '>{t("modules.proposals.new")}<'],
  ["Căutare oferte", '{t("modules.proposals.searchSr")}'],
  [
    'placeholder="Caută după titlu, număr sau client…"',
    'placeholder={t("modules.proposals.searchPlaceholder")}',
  ],
  ['<SelectItem value="all">Toate statusurile</SelectItem>', '<SelectItem value="all">{t("common.allStatuses")}</SelectItem>'],
  [
    'title={initialProposals.length === 0 ? "Nicio ofertă încă" : "Nicio ofertă găsită"}',
    'title={initialProposals.length === 0 ? t("modules.proposals.empty") : t("modules.proposals.emptyFiltered")}',
  ],
  [
    '? "Creează prima ofertă pentru un lead sau client."',
    '? t("modules.proposals.emptyHint")',
  ],
  [
    ': "Încearcă alți termeni de căutare sau alt filtru de status."',
    ': t("common.searchNoResultsHint")',
  ],
  [">Număr<", '>{t("common.number")}<'],
  [">Client / Lead<", '>{t("modules.proposals.clientOrLead")}<'],
  [">Titlu<", '>{t("common.title")}<'],
  [">Sumă<", '>{t("common.amount")}<'],
  [">Status<", '>{t("common.status")}<'],
  [">Valabilă până la<", '>{t("modules.proposals.validUntil")}<'],
  [">Acțiuni<", '>{t("common.actions")}<'],
  [
    "label={PROPOSAL_STATUS_LABELS[proposal.effectiveStatus]}",
    'label={t(`status.proposal.${proposal.effectiveStatus}`)}',
  ],
  [
    "{PROPOSAL_STATUS_LABELS[item]}",
    "{t(`status.proposal.${item}`)}",
  ],
]);

patch("components/settings/settings-page-client.tsx", [
  [
    'const LANGUAGES: { value: "ro" | "en"; label: string }[] = [\n  { value: "ro", label: "Română" },\n  { value: "en", label: "Engleză" },\n];',
    'const LANGUAGE_CODES = ["ro", "en"] as const;',
  ],
  [
    'setWorkspaceError(parsed.error.issues[0]?.message ?? "Verifică datele completate.");',
    'setWorkspaceError(parsed.error.issues[0]?.message ?? t("settings.verifyData"));',
  ],
  [
    'setWorkspaceError(result?.error ?? "Nu am putut salva setările.");',
    'setWorkspaceError(result?.error ?? t("settings.saveFailed"));',
  ],
  [
    'toast(result.success ?? "Setări actualizate.", "success");',
    'toast(result.success ?? t("settings.savedWorkspace"), "success");',
  ],
  [
    'setProfileError(parsed.error.issues[0]?.message ?? "Verifică datele completate.");',
    'setProfileError(parsed.error.issues[0]?.message ?? t("settings.verifyData"));',
  ],
  [
    'toast(prepared?.error ?? "Nu am putut pregăti încărcarea logo-ului.", "error");',
    'toast(prepared?.error ?? t("settings.logoPrepareFailed"), "error");',
  ],
  [
    'toast("Nu am putut încărca logo-ul.", "error");',
    'toast(t("settings.logoUploadFailed"), "error");',
  ],
  [
    'toast(result.success ?? "Workspace șters.", "success");',
    'toast(result.success ?? t("settings.deletedWorkspace"), "success");',
  ],
  [
    'toast(result.success ?? "Proprietate transferată.", "success");',
    'toast(result.success ?? t("settings.transferred"), "success");',
  ],
  [
    '<h2 className="font-heading text-lg font-medium text-foreground">Workspace</h2>\n              <p className="text-sm text-muted-foreground">\n                Informații generale despre businessul tău din industria evenimentelor.\n              </p>',
    '<h2 className="font-heading text-lg font-medium text-foreground">{t("settings.workspaceTitle")}</h2>\n              <p className="text-sm text-muted-foreground">\n                {t("settings.workspaceHint")}\n              </p>',
  ],
  [
    '{logoUploading ? "Se încarcă…" : "Încarcă logo"}',
    '{logoUploading ? t("settings.uploading") : t("settings.uploadLogo")}',
  ],
  [">Elimină<", '>{t("settings.removeLogo")}<'],
  [
    '<Label htmlFor="workspace-name">Nume workspace</Label>',
    '<Label htmlFor="workspace-name">{t("settings.workspaceName")}</Label>',
  ],
  [
    '<Label htmlFor="workspace-currency">Monedă</Label>',
    '<Label htmlFor="workspace-currency">{t("settings.currency")}</Label>',
  ],
  [
    '<Label htmlFor="workspace-city">Oraș</Label>',
    '<Label htmlFor="workspace-city">{t("settings.city")}</Label>',
  ],
  [
    '<Label htmlFor="workspace-country">Țară</Label>',
    '<Label htmlFor="workspace-country">{t("settings.country")}</Label>',
  ],
  [
    '<Label htmlFor="workspace-timezone">Fus orar</Label>',
    '<Label htmlFor="workspace-timezone">{t("settings.timezone")}</Label>',
  ],
  [
    '<Label htmlFor="workspace-language">Limbă</Label>',
    '<Label htmlFor="workspace-language">{t("settings.language")}</Label>',
  ],
  [
    "{LANGUAGES.map((option) => (\n                      <SelectItem key={option.value} value={option.value}>\n                        {option.label}\n                      </SelectItem>\n                    ))}",
    '{LANGUAGE_CODES.map((code) => (\n                      <SelectItem key={code} value={code}>\n                        {code === "ro" ? t("common.romanian") : t("common.english")}\n                      </SelectItem>\n                    ))}',
  ],
  [
    '<h2 className="font-heading text-lg font-medium text-foreground">Branding și pipeline</h2>\n              <p className="text-sm text-muted-foreground">\n                Culorile brandului și pipeline-ul implicit pentru proiectele noi.\n              </p>',
    '<h2 className="font-heading text-lg font-medium text-foreground">{t("settings.brandingTitle")}</h2>\n              <p className="text-sm text-muted-foreground">\n                {t("settings.brandingHint")}\n              </p>',
  ],
  [
    '<Label htmlFor="brand-primary">Culoare principală (hex)</Label>',
    '<Label htmlFor="brand-primary">{t("settings.brandPrimary")}</Label>',
  ],
  [
    '<Label htmlFor="brand-accent">Culoare accent (hex)</Label>',
    '<Label htmlFor="brand-accent">{t("settings.brandAccent")}</Label>',
  ],
  [
    '<Label htmlFor="default-pipeline">Pipeline implicit pentru proiecte</Label>',
    '<Label htmlFor="default-pipeline">{t("settings.defaultPipeline")}</Label>',
  ],
  [
    '<h2 className="font-heading text-lg font-medium text-foreground">Date fiscale</h2>\n              <p className="text-sm text-muted-foreground">Apar pe contracte și facturi.</p>',
    '<h2 className="font-heading text-lg font-medium text-foreground">{t("settings.fiscalTitle")}</h2>\n              <p className="text-sm text-muted-foreground">{t("settings.fiscalHint")}</p>',
  ],
  ['<Label htmlFor="fiscal-cui">CUI / CIF</Label>', '<Label htmlFor="fiscal-cui">{t("settings.fiscalCui")}</Label>'],
  [
    '<Label htmlFor="fiscal-address">Adresă fiscală</Label>',
    '<Label htmlFor="fiscal-address">{t("settings.fiscalAddress")}</Label>',
  ],
  [
    '<h2 className="font-heading text-lg font-medium text-foreground">Notificări workspace</h2>\n              <p className="text-sm text-muted-foreground">\n                Preferințe implicite de notificare pentru echipă.\n              </p>',
    '<h2 className="font-heading text-lg font-medium text-foreground">{t("settings.notificationsTitle")}</h2>\n              <p className="text-sm text-muted-foreground">\n                {t("settings.notificationsHint")}\n              </p>',
  ],
  [
    "Notificări email pentru leaduri și plăți noi",
    '{t("settings.notifyEmail")}',
  ],
  ["Rezumat săptămânal al activității", '{t("settings.notifyDigest")}'],
  [
    "Noutăți despre funcționalități EasyWedd Pro",
    '{t("settings.notifyProduct")}',
  ],
  [
    '{workspaceSubmitting ? "Se salvează…" : "Salvează setările workspace-ului"}',
    '{workspaceSubmitting ? t("common.saving") : t("settings.saveWorkspace")}',
  ],
  [
    '<h2 className="font-heading text-lg font-medium text-foreground">Profilul tău</h2>\n              <p className="text-sm text-muted-foreground">\n                Aceste informații apar în platformă și în comunicările cu clienții.\n              </p>',
    '<h2 className="font-heading text-lg font-medium text-foreground">{t("settings.profileTitle")}</h2>\n              <p className="text-sm text-muted-foreground">\n                {t("settings.profileHint")}\n              </p>',
  ],
  [
    '<Label htmlFor="user-name">Nume complet</Label>',
    '<Label htmlFor="user-name">{t("settings.fullName")}</Label>',
  ],
  [
    '{profileSubmitting ? "Se salvează…" : "Salvează profilul"}',
    '{profileSubmitting ? t("common.saving") : t("settings.saveProfile")}',
  ],
  [
    '<h2 className="font-heading text-lg font-medium text-foreground">Zonă periculoasă</h2>',
    '<h2 className="font-heading text-lg font-medium text-foreground">{t("settings.dangerTitle")}</h2>',
  ],
  [
    '<p className="text-sm font-medium text-foreground">Transferă proprietatea</p>\n                  <p className="text-sm text-muted-foreground">\n                    Rolul tău va deveni admin. Scrie exact numele workspace-ului{" "}\n                    <strong>„{currentWorkspaceName}”</strong> pentru confirmare.\n                  </p>',
    '<p className="text-sm font-medium text-foreground">{t("settings.transferTitle")}</p>\n                  <p className="text-sm text-muted-foreground">\n                    {t("settings.transferHint", { name: currentWorkspaceName })}\n                  </p>',
  ],
  [
    'target.fullName ?? "Membru fără profil"',
    'target.fullName ?? t("settings.memberNoProfile")',
  ],
  [
    '{transferSubmitting ? "Se transferă…" : "Transferă proprietatea"}',
    '{transferSubmitting ? t("settings.transferring") : t("settings.transferCta")}',
  ],
  [
    '<p className="text-sm font-medium text-foreground">Șterge workspace-ul</p>\n                <p className="text-sm text-muted-foreground">\n                  Elimină permanent toate leadurile, clienții și documentele asociate. Scrie exact{" "}\n                  <strong>„{currentWorkspaceName}”</strong> pentru confirmare.\n                </p>',
    '<p className="text-sm font-medium text-foreground">{t("settings.deleteTitle")}</p>\n                <p className="text-sm text-muted-foreground">\n                  {t("settings.deleteHint", { name: currentWorkspaceName })}\n                </p>',
  ],
  [
    '{deleteSubmitting ? "Se șterge…" : "Șterge workspace-ul"}',
    '{deleteSubmitting ? t("settings.deleting") : t("settings.deleteCta")}',
  ],
]);

console.log("done");
